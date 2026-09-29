#!/usr/bin/env python3
"""
SmartWare WMS - Automated End-to-End Test Suite
Tests all 11 modules and integration flows.
"""

import urllib.request
import urllib.error
import json
import sys
import uuid
import sqlite3

BASE_URL = "http://127.0.0.1:3000"

test_results = []

def run_test(test_id, name, test_fn):
    print(f"Running [{test_id}] {name}...", end=" ", flush=True)
    try:
        test_fn()
        print("\033[92m[PASS]\033[0m")
        test_results.append({"id": test_id, "name": name, "status": "PASS", "error": None})
    except Exception as e:
        print(f"\033[91m[FAIL]\033[0m ({e})")
        test_results.append({"id": test_id, "name": name, "status": "FAIL", "error": str(e)})

def http_get(path, headers=None):
    req = urllib.request.Request(f"{BASE_URL}{path}", headers=headers or {})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

def http_post(path, data, headers=None):
    hdrs = {'Content-Type': 'application/json'}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode('utf-8'),
        headers=hdrs,
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

# Global state across tests
auth_token = None
test_user_token = None

# ========================================================
# 1. AUTHENTICATION & SECURITY TEST CASES
# ========================================================

def test_admin_login():
    global auth_token
    status, res = http_post("/api/auth/login", {
        "username": "nik@gmail.com",
        "password": "123456"
    })
    assert status == 200, f"Expected 200, got {status}"
    assert res.get("success") is True, "Login failed"
    assert res["user"]["role"] == "Admin", "User role is not Admin"
    assert res["user"]["email"] == "nik@gmail.com", "Admin email mismatch"
    assert "token" in res, "No token returned"
    auth_token = res["token"]

def test_invalid_login():
    status, res = http_post("/api/auth/login", {
        "username": "nik@gmail.com",
        "password": "wrong_password_999"
    })
    # HTTP 401 Unauthorized or success: false is correct security behavior
    assert status == 401 or res.get("success") is False, "Invalid login unexpectedly succeeded"

def test_session_validation():
    status, res = http_get("/api/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert status == 200, f"Expected 200, got {status}"
    assert res.get("authenticated") is True, "Token not recognized"
    assert res["user"]["role"] == "Admin", "User role mismatch"

def test_user_registration():
    global test_user_token
    reg_username = f"staff_{uuid.uuid4().hex[:6]}"
    reg_email = f"{reg_username}@smartware.com"
    status, res = http_post("/api/auth/register", {
        "full_name": "Test Warehouse Staff",
        "email": reg_email,
        "password": "staffPassword123!",
        "role": "Warehouse Staff",
        "department": "Inbound Dock"
    })
    assert res.get("success") is True, f"Registration failed: {res.get('message')}"
    
    # Try logging in with the newly registered user
    status, login_res = http_post("/api/auth/login", {
        "username": reg_email,
        "password": "staffPassword123!"
    })
    assert login_res.get("success") is True, "Login with new user failed"
    assert login_res["user"]["role"] == "Warehouse Staff"
    test_user_token = login_res["token"]

# ========================================================
# 2. EXECUTIVE DASHBOARD TEST CASES
# ========================================================

def test_dashboard_metrics():
    status, res = http_get("/api/dashboard")
    assert status == 200, f"Dashboard failed with {status}"
    assert "analytics" in res, "Missing analytics"
    m = res["analytics"]
    assert m["total_skus"] >= 15, f"Expected >= 15 SKUs, got {m['total_skus']}"
    assert m["total_units"] > 500, f"Expected > 500 units, got {m['total_units']}"
    assert m["total_valuation"] > 0, "Valuation must be positive"
    assert m["total_potential_revenue"] > m["total_valuation"], "Potential revenue should exceed cost basis"
    assert "warehouses" in res, "Missing warehouses summary"
    assert len(res["warehouses"]) == 4, f"Expected 4 warehouses, got {len(res['warehouses'])}"

# ========================================================
# 3. PRODUCTS & INVENTORY TEST CASES
# ========================================================

def test_products_list_and_search():
    status, res = http_get("/api/products")
    assert status == 200
    assert "products" in res
    assert len(res["products"]) >= 15
    
    sample = res["products"][0]
    for field in ["id", "sku", "name", "category", "quantity", "purchase_price", "selling_price", "warehouse_name"]:
        assert field in sample, f"Product missing field {field}"

def test_stock_adjustment():
    # Adjust product prd-1 stock by +5
    status, res = http_post("/api/products/stock", {
        "product_id": "prd-1",
        "quantity_change": 5,
        "movement_type": "ADJUSTMENT_IN",
        "reason": "Automated Test Audit"
    })
    assert res.get("success") is True, f"Stock adjustment failed: {res.get('message')}"
    
    # Adjust back by -5
    status, res2 = http_post("/api/products/stock", {
        "product_id": "prd-1",
        "quantity_change": -5,
        "movement_type": "ADJUSTMENT_OUT",
        "reason": "Automated Test Revert"
    })
    assert res2.get("success") is True, f"Stock revert failed: {res2.get('message')}"

# ========================================================
# 4. WAREHOUSES & LOCATIONS TEST CASES
# ========================================================

def test_warehouses_and_bins():
    status, res = http_get("/api/warehouses")
    assert status == 200
    assert "warehouses" in res
    assert "locations" in res
    wh_codes = {w["code"] for w in res["warehouses"]}
    assert {"WH-CENTRAL", "WH-EAST", "WH-NORTH", "WH-WEST"}.issubset(wh_codes), "Missing standard warehouse hubs"
    assert len(res["locations"]) >= 8, "Warehouse bin locations not populated"

# ========================================================
# 5. PURCHASING & DOCK RECEIVING TEST CASES
# ========================================================

def test_purchase_order_flow():
    # 1. Create a PO for prd-1
    status, po_create = http_post("/api/purchase_orders", {
        "supplier_id": "sup-apex",
        "warehouse_id": "wh-central",
        "expected_delivery": "2026-10-15",
        "notes": "Automated Test Purchase Order",
        "items": [
            {"product_id": "prd-1", "quantity": 10, "unit_cost": 2800.0}
        ]
    })
    assert po_create.get("success") is True, f"PO creation failed: {po_create.get('message')}"
    po_id = po_create["po_id"]
    
    # Get current stock of prd-1
    status, prod_res = http_get("/api/products")
    prd1_before = next(p for p in prod_res["products"] if p["id"] == "prd-1")
    qty_before = prd1_before["quantity"]
    
    # 2. Receive the PO
    status, po_rec = http_post("/api/purchase_orders/receive", {
        "po_id": po_id
    })
    assert po_rec.get("success") is True, f"PO receive failed: {po_rec.get('message')}"
    
    # 3. Verify stock increased by 10
    status, prod_res2 = http_get("/api/products")
    prd1_after = next(p for p in prod_res2["products"] if p["id"] == "prd-1")
    assert prd1_after["quantity"] == qty_before + 10, f"Stock did not increase by 10 (was {qty_before}, now {prd1_after['quantity']})"

# ========================================================
# 6. SALES ORDERS & DISPATCH TEST CASES
# ========================================================

def test_sales_order_flow():
    # 1. Create SO for prd-1 (qty 2)
    status, so_create = http_post("/api/sales_orders", {
        "customer_id": "cust-metro",
        "warehouse_id": "wh-central",
        "payment_terms": "NET30",
        "shipping_address": "Test Street 101, Industrial Hub",
        "notes": "Automated Test Sales Order",
        "items": [
            {"product_id": "prd-1", "quantity": 2, "unit_price": 5400.0}
        ]
    })
    assert so_create.get("success") is True, f"SO creation failed: {so_create.get('message')}"
    so_id = so_create["so_id"]
    
    # Get current stock of prd-1
    status, prod_res = http_get("/api/products")
    prd1_before = next(p for p in prod_res["products"] if p["id"] == "prd-1")
    qty_before = prd1_before["quantity"]
    
    # 2. Dispatch SO
    status, so_disp = http_post("/api/sales_orders/dispatch", {
        "so_id": so_id
    })
    assert so_disp.get("success") is True, f"SO dispatch failed: {so_disp.get('message')}"
    
    # 3. Verify stock reduced by 2
    status, prod_res2 = http_get("/api/products")
    prd1_after = next(p for p in prod_res2["products"] if p["id"] == "prd-1")
    assert prd1_after["quantity"] == qty_before - 2, f"Stock did not decrease by 2 (was {qty_before}, now {prd1_after['quantity']})"

def test_sales_order_insufficient_stock_guard():
    status, so_create = http_post("/api/sales_orders", {
        "customer_id": "cust-metro",
        "warehouse_id": "wh-central",
        "payment_terms": "PREPAID",
        "shipping_address": "Exceed Stock Address",
        "notes": "Order with excessive stock",
        "items": [
            {"product_id": "prd-6", "quantity": 500000, "unit_price": 1450.0}
        ]
    })
    assert so_create.get("success") is True
    so_id = so_create["so_id"]
    
    # Try dispatching -> MUST gracefully fail with insufficient stock message
    status, so_disp = http_post("/api/sales_orders/dispatch", {
        "so_id": so_id
    })
    assert so_disp.get("success") is False, "Dispatch should have failed due to insufficient stock"
    assert "INSUFFICIENT STOCK" in so_disp.get("message", "").upper(), f"Unexpected message: {so_disp.get('message')}"

# ========================================================
# 7. INTER-HUB STOCK TRANSFERS TEST CASES
# ========================================================

def test_inter_hub_stock_transfer():
    # Transfer 2 units of prd-7 from wh-central to wh-east
    status, trf_create = http_post("/api/transfers", {
        "source_warehouse_id": "wh-central",
        "destination_warehouse_id": "wh-east",
        "product_id": "prd-7",
        "quantity": 2,
        "notes": "Automated Inter-hub Transfer Test"
    })
    assert trf_create.get("success") is True, f"Transfer creation failed: {trf_create.get('message')}"
    
    # Fetch transfers list to find the newly created transfer ID
    status, trf_list = http_get("/api/transfers")
    assert len(trf_list["transfers"]) > 0
    created_num = trf_create.get("transfer_number")
    trf_record = next((t for t in trf_list["transfers"] if t.get("transfer_number") == created_num), trf_list["transfers"][0])
    
    # Complete transfer
    status, trf_comp = http_post("/api/transfers/complete", {
        "transfer_id": trf_record["id"]
    })
    assert trf_comp.get("success") is True, f"Transfer completion failed: {trf_comp.get('message')}"

# ========================================================
# 8. RETURNS & RMA PROCESSING TEST CASES
# ========================================================

def test_returns_and_rma():
    # 1. Create a return for prd-10
    status, ret_create = http_post("/api/returns", {
        "customer_name": "Direct Client Corp",
        "product_id": "prd-10",
        "warehouse_id": "wh-central",
        "quantity": 2,
        "reason": "Defective packaging on arrival",
        "notes": "Test RMA automated"
    })
    assert ret_create.get("success") is True, f"Return creation failed: {ret_create.get('message')}"
    
    # Find created return in list
    status, ret_list = http_get("/api/returns")
    assert len(ret_list["returns"]) > 0
    ret_record = ret_list["returns"][0]
    
    # 2. Resolve return (RESTOCK)
    status, ret_res = http_post("/api/returns/resolve", {
        "return_id": ret_record["id"],
        "action": "RESTOCK",
        "notes": "Inspected and repackaged for restock"
    })
    assert ret_res.get("success") is True, f"Return resolution failed: {ret_res.get('message')}"

# ========================================================
# 9. AI DEMAND FORECASTING & AUTO-REORDER TEST CASES
# ========================================================

def test_ai_forecasting_and_surge():
    # Test standard forecast at drift 1.0
    status, fc_100 = http_get("/api/analytics?drift=1.0")
    assert status == 200
    assert "demand_forecasts" in fc_100
    assert len(fc_100["demand_forecasts"]) > 0
    
    # Test 150% demand surge at drift 1.5
    status, fc_150 = http_get("/api/analytics?drift=1.5")
    assert status == 200
    assert "demand_forecasts" in fc_150
    # Surge 1.5 should increase or maintain 30d forecast
    fc_sum_100 = sum(f.get("forecast_30d", 0) for f in fc_100["demand_forecasts"])
    fc_sum_150 = sum(f.get("forecast_30d", 0) for f in fc_150["demand_forecasts"])
    assert fc_sum_150 > fc_sum_100, f"Surge 1.5 should increase 30d forecast demand ({fc_sum_150} vs {fc_sum_100})"

def test_ai_auto_po_generation():
    status, res = http_post("/api/purchase_orders/auto_generate", {})
    assert status == 200
    assert "success" in res
    assert res.get("success") is True
    assert "message" in res

# ========================================================
# 10. AUDIT TRAIL, NOTIFICATIONS & CSV EXPORTS TEST CASES
# ========================================================

def test_audit_logs_and_movements():
    status, mv_res = http_get("/api/movements")
    assert status == 200
    assert "movements" in mv_res
    assert len(mv_res["movements"]) > 0, "No movements logged"
    
    status, audit_res = http_get("/api/audit_logs")
    assert status == 200
    assert "audit_logs" in audit_res
    assert len(audit_res["audit_logs"]) > 0, "No audit logs found"

def test_notifications_flow():
    status, notifs = http_get("/api/notifications")
    assert status == 200
    assert "notifications" in notifs
    
    # Test mark all as read
    status, mark_res = http_post("/api/notifications/read_all", {})
    assert mark_res.get("success") is True

def test_csv_report_export():
    req = urllib.request.Request(f"{BASE_URL}/api/export_csv?type=products")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        content = resp.read().decode('utf-8')
        assert "SKU" in content, "CSV export header invalid"
        assert len(content.splitlines()) > 10, "CSV has insufficient rows"

# ========================================================
# 11. ADVANCED SECURITY & AUTO-LOGOUT TEST CASES
# ========================================================

def test_brute_force_rate_limiting():
    # Attempt consecutive invalid logins to trigger security rate limiter
    test_user = f"brute_target_{uuid.uuid4().hex[:6]}@smartware.com"
    locked = False
    for i in range(7):
        status, res = http_post("/api/auth/login", {
            "username": test_user,
            "password": "wrong_password_attempt"
        })
        if status == 429 or "locked" in str(res).lower():
            locked = True
            break
    assert locked is True, "Brute force lockout was not triggered after multiple failed login attempts"

def test_security_headers_verification():
    req = urllib.request.Request(f"{BASE_URL}/api/auth/security_status")
    with urllib.request.urlopen(req) as resp:
        headers = {k.lower(): v for k, v in resp.headers.items()}
        assert headers.get("x-content-type-options") == "nosniff", "Missing X-Content-Type-Options: nosniff"
        assert headers.get("x-frame-options") == "SAMEORIGIN", "Missing X-Frame-Options: SAMEORIGIN"
        assert "mode=block" in headers.get("x-xss-protection", ""), "Missing X-XSS-Protection: 1; mode=block"
        assert "no-store" in headers.get("cache-control", ""), "Missing Cache-Control: no-store on sensitive API"

def test_auto_logout_session_refresh():
    status, res = http_post("/api/auth/refresh_session", {"token": auth_token})
    assert status == 200, f"Expected 200, got {status}"
    assert res.get("success") is True, "Failed to refresh active session"

def test_argon2id_password_hashing():
    # 1. Verify /api/auth/security_status reports Argon2id
    status, res = http_get("/api/auth/security_status")
    assert status == 200, f"Expected 200, got {status}"
    assert "argon2id" in res.get("hashing_algorithm", "").lower(), f"Expected Argon2id algorithm, got: {res.get('hashing_algorithm')}"
    
    # 2. Register a new user and verify that password hash stored in DB is Argon2id ($argon2id$)
    test_user = f"argon_{uuid.uuid4().hex[:6]}"
    test_pass = "Argon2idSecret123!"
    reg_status, reg_res = http_post("/api/auth/register", {
        "full_name": "Argon2id Test User",
        "email": f"{test_user}@smartware.com",
        "password": test_pass,
        "role": "Warehouse Staff",
        "department": "Security QA"
    })
    assert reg_res.get("success") is True, f"Registration failed: {reg_res.get('message')}"
    
    # 3. Verify in DB that hash starts with $argon2id$
    conn = sqlite3.connect("smartware.db")
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE username = ?", (test_user,))
    row = cursor.fetchone()
    conn.close()
    assert row is not None, "Registered user not found in database"
    pwd_hash = row[0]
    assert pwd_hash.startswith("$argon2id$"), f"Expected $argon2id$ prefix, got: {pwd_hash[:20]}"
    
    # 4. Verify login works with the newly registered user
    login_status, login_res = http_post("/api/auth/login", {
        "username": test_user,
        "password": test_pass
    })
    assert login_res.get("success") is True, "Login with Argon2id hash failed"
    
    # 5. Verify wrong password correctly rejected
    bad_status, bad_res = http_post("/api/auth/login", {
        "username": test_user,
        "password": "WrongPassword999!"
    })
    assert bad_status == 401 or bad_res.get("success") is False, "Invalid password unexpectedly succeeded"

def test_inventory_density_heatmap():
    """Verify D3/Chart.js inventory density heatmap API calculations and hotspot detection"""
    # 1. Test /api/inventory/density endpoint
    status, res = http_get("/api/inventory/density")
    assert status == 200, f"Expected 200 OK, got: {status}"
    assert "racks" in res, "Expected 'racks' in density response"
    assert "bins" in res, "Expected 'bins' in density response"
    assert "warehouses" in res, "Expected 'warehouses' in density response"
    assert "total_capacity" in res, "Expected 'total_capacity' in density response"
    assert "total_units" in res, "Expected 'total_units' in density response"
    assert "overall_utilization_pct" in res, "Expected 'overall_utilization_pct' in density response"
    assert "peak_rack" in res, "Expected 'peak_rack' in density response"
    assert "hotspots" in res, "Expected 'hotspots' in density response"
    
    # 2. Verify racks are sorted by utilization percentage descending
    racks = res.get("racks", [])
    assert len(racks) > 0, "Expected non-empty racks array"
    for i in range(len(racks) - 1):
        assert racks[i]["utilization_pct"] >= racks[i+1]["utilization_pct"], "Racks not sorted by utilization descending"
        
    # 3. Verify bins contain valid rack, shelf, bin, and utilization_pct
    bins = res.get("bins", [])
    assert len(bins) > 0, "Expected non-empty bins array"
    for b in bins:
        assert "rack" in b and "shelf" in b and "bin" in b, "Missing coordinate in bin"
        assert "utilization_pct" in b, "Missing utilization_pct in bin"
        assert "capacity" in b, "Missing capacity in bin"
        assert b["capacity"] > 0, "Invalid capacity in bin"

    # 4. Verify warehouse filter parameter
    status_wh, res_wh = http_get("/api/inventory/density?warehouse_id=wh-central")
    assert status_wh == 200, f"Expected 200 for filtered warehouse, got: {status_wh}"
    assert res_wh.get("selected_warehouse_id") == "wh-central"

# ========================================================
# MAIN RUNNER
# ========================================================

def main():
    print("=" * 65)
    print(" SmartWare WMS - Full Automated Test Suite Execution")
    print("=" * 65)
    
    tests = [
        ("TC-01", "Admin Login & JWT Token Generation", test_admin_login),
        ("TC-02", "Invalid Password Authentication Rejection (HTTP 401)", test_invalid_login),
        ("TC-03", "Session Validation (/api/auth/me)", test_session_validation),
        ("TC-04", "User Registration & New User Login", test_user_registration),
        ("TC-05", "Executive Dashboard Real-Time Metrics & Valuation", test_dashboard_metrics),
        ("TC-06", "Product Inventory Catalog & SKU Metadata", test_products_list_and_search),
        ("TC-07", "Inventory Stock Adjustment & Audit Trail", test_stock_adjustment),
        ("TC-08", "Multi-Hub Warehouses & Bin Locations Mapping", test_warehouses_and_bins),
        ("TC-09", "Purchase Order Flow & 1-Click Dock Receiving", test_purchase_order_flow),
        ("TC-10", "Sales Order Booking & Outbound Dispatch Deduction", test_sales_order_flow),
        ("TC-11", "Insufficient Stock Guard (Negative Stock Prevention)", test_sales_order_insufficient_stock_guard),
        ("TC-12", "Inter-Hub Stock Transfer (In-Transit to Complete)", test_inter_hub_stock_transfer),
        ("TC-13", "Returns & RMA Inspection Restock Processing", test_returns_and_rma),
        ("TC-14", "AI Demand Forecasting & Surge Multiplier (100% to 150%)", test_ai_forecasting_and_surge),
        ("TC-15", "1-Click AI Auto Purchase Order Generation", test_ai_auto_po_generation),
        ("TC-16", "Movements Ledger & Security Audit Logs", test_audit_logs_and_movements),
        ("TC-17", "System Notifications & Read-All Action", test_notifications_flow),
        ("TC-18", "CSV Data Report Generator & Export", test_csv_report_export),
        ("TC-19", "Brute-Force Rate Limiting Lockout (HTTP 429)", test_brute_force_rate_limiting),
        ("TC-20", "Enterprise HTTP Security Headers (nosniff, SAMEORIGIN, XSS)", test_security_headers_verification),
        ("TC-21", "Session Sliding Expiry & Active Refresh API", test_auto_logout_session_refresh),
        ("TC-22", "Argon2id Memory-Hard Password Hashing (OWASP Standard)", test_argon2id_password_hashing),
        ("TC-23", "Inventory Density Heatmap & Bin Rack Utilization", test_inventory_density_heatmap),
    ]
    
    for tid, name, fn in tests:
        run_test(tid, name, fn)
        
    print("=" * 65)
    passed = sum(1 for t in test_results if t["status"] == "PASS")
    failed = sum(1 for t in test_results if t["status"] == "FAIL")
    print(f"Total Tests Executed: {len(test_results)}")
    print(f"Passed: \033[92m{passed}\033[0m | Failed: \033[91m{failed}\033[0m")
    print("=" * 65)
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
