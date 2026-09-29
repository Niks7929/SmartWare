import urllib.request, urllib.error, json, uuid

BASE = "http://127.0.0.1:3000"

def http_req(path, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers, method=method)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            content = resp.read().decode("utf-8")
            try:
                return resp.getcode(), json.loads(content)
            except Exception:
                return resp.getcode(), content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content

print("=================================================================")
print(" SMARTWARE WMS - DEEP COMPREHENSIVE END-TO-END VERIFICATION")
print("=================================================================")

# STEP 1: Super Admin Login
print("[1/12] Authenticating Super Admin (nik@gmail.com)...")
code, res = http_req("/api/auth/login", "POST", {"username": "nik@gmail.com", "password": "123456"})
assert code == 200 and res.get("success") is True, f"Login failed: {res}"
token = res["token"]
user = res["user"]
assert user["email"] == "nik@gmail.com", f"Unexpected email: {user['email']}"
assert user["role"] == "Admin", f"Unexpected role: {user['role']}"
print(f" -> SUCCESS: Logged in as {user['full_name']} ({user['email']}), Token received.")

# STEP 2: Session Verification
print("[2/12] Verifying User Session (/api/auth/me)...")
code, me_res = http_req("/api/auth/me", token=token)
assert code == 200 and me_res["user"]["email"] == "nik@gmail.com"
print(" -> SUCCESS: Session verified and active.")

# STEP 3: Dashboard & Valuation Metrics
print("[3/12] Checking Executive Dashboard KPIs & Analytics...")
code, dash = http_req("/api/dashboard", token=token)
assert code == 200
analytics = dash["analytics"]
print(f" -> SUCCESS: SKUs: {analytics['total_skus']}, Units: {analytics['total_units']}, Valuation: ${analytics['total_valuation']:,.2f}")

# STEP 4: Product Catalog & Location Verification
print("[4/12] Fetching Inventory Products & Multi-Hub Locations...")
code, prod_res = http_req("/api/products", token=token)
products = prod_res if isinstance(prod_res, list) else prod_res.get("products", [])
assert len(products) > 0, "No products found!"
target_prd = next((p for p in products if p["sku"] == "PRD-1001"), products[0])
initial_qty = target_prd["quantity"]
print(f" -> SUCCESS: {len(products)} products loaded. Target SKU: {target_prd['sku']} (Current Qty: {initial_qty})")

# STEP 5: Purchase Order Flow (Inbound Restock)
print("[5/12] Testing Inbound PO Creation & 1-Click Receiving...")
po_payload = {
    "supplier_id": "sup-apex",
    "warehouse_id": "wh-central",
    "total_amount": 185000.0,
    "expected_delivery": "2026-10-05",
    "notes": "Automated verification restock batch",
    "items": [{
        "product_id": target_prd["id"],
        "quantity": 10,
        "unit_cost": target_prd["purchase_price"]
    }]
}
code, po_res = http_req("/api/purchase_orders", "POST", po_payload, token=token)
assert code == 200 and po_res.get("success") is True, f"PO creation failed: {po_res}"
po_id = po_res["po_id"]

# Receive the PO
code, rec_res = http_req("/api/purchase_orders/receive", "POST", {"po_id": po_id}, token=token)
assert code == 200 and rec_res.get("success") is True, f"PO receive failed: {rec_res}"

# Verify stock increased by 10
code, prod_res2 = http_req("/api/products", token=token)
prods2 = prod_res2 if isinstance(prod_res2, list) else prod_res2.get("products", [])
updated_prd = next(p for p in prods2 if p["id"] == target_prd["id"])
assert updated_prd["quantity"] == initial_qty + 10, f"Expected {initial_qty + 10}, got {updated_prd['quantity']}"
print(f" -> SUCCESS: PO {po_res['po_number']} received. Stock increased from {initial_qty} to {updated_prd['quantity']}.")

# STEP 6: Sales Order Flow (Outbound Dispatch)
print("[6/12] Testing Outbound Sales Order Booking & Dispatch...")
so_payload = {
    "customer_id": "cust-tech",
    "warehouse_id": "wh-central",
    "total_amount": target_prd["selling_price"] * 2,
    "shipping_address": "88 Industrial Way, Sector 12",
    "shipping_city": "Gurugram",
    "shipping_postal_code": "122001",
    "items": [{
        "product_id": target_prd["id"],
        "quantity": 2,
        "unit_price": target_prd["selling_price"]
    }]
}
code, so_res = http_req("/api/sales_orders", "POST", so_payload, token=token)
assert code == 200 and so_res.get("success") is True, f"SO creation failed: {so_res}"
so_id = so_res["so_id"]

# Dispatch the SO
code, disp_res = http_req("/api/sales_orders/dispatch", "POST", {"so_id": so_id}, token=token)
assert code == 200 and disp_res.get("success") is True, f"SO dispatch failed: {disp_res}"

# Verify stock decreased by 2
code, prod_res3 = http_req("/api/products", token=token)
prods3 = prod_res3 if isinstance(prod_res3, list) else prod_res3.get("products", [])
after_disp_prd = next(p for p in prods3 if p["id"] == target_prd["id"])
assert after_disp_prd["quantity"] == initial_qty + 8, f"Expected {initial_qty + 8}, got {after_disp_prd['quantity']}"
print(f" -> SUCCESS: SO {so_res['so_number']} dispatched. Stock decremented to {after_disp_prd['quantity']}.")

# STEP 7: Negative Stock Prevention Guard
print("[7/12] Testing Strict Stock Guard (Prevent Over-Ordering)...")
excessive_so = {
    "customer_id": "cust-tech",
    "warehouse_id": "wh-central",
    "total_amount": 99999999.0,
    "shipping_address": "Test",
    "shipping_city": "Test",
    "shipping_postal_code": "000000",
    "items": [{
        "product_id": target_prd["id"],
        "quantity": 999999,
        "unit_price": target_prd["selling_price"]
    }]
}
# Creation or dispatch must be blocked
code, over_res = http_req("/api/sales_orders", "POST", excessive_so, token=token)
if code == 200 and over_res.get("success"):
    # Dispatch must fail
    d_code, d_res = http_req("/api/sales_orders/dispatch", "POST", {"so_id": over_res["so_id"]}, token=token)
    assert d_res.get("success") is False, "Dispatch should have failed for excessive quantity!"
print(" -> SUCCESS: Negative stock guard successfully prevented over-allocation.")

# STEP 8: Inter-Hub Transfer Flow
print("[8/12] Testing Cross-Warehouse Transfer Flow...")
prd7_obj = next((p for p in prods3 if p["id"] == "prd-7"), prods3[0])
src_wh = prd7_obj["warehouse_id"]
dst_wh = "wh-central" if src_wh != "wh-central" else "wh-east"
trf_payload = {
    "from_warehouse_id": src_wh,
    "to_warehouse_id": dst_wh,
    "product_id": prd7_obj["id"],
    "quantity": 1,
    "notes": "End-to-end verification transfer"
}
code, trf_res = http_req("/api/transfers", "POST", trf_payload, token=token)
assert code == 200 and trf_res.get("success") is True, f"Transfer creation failed: {trf_res}"
code, trf_list = http_req("/api/transfers", token=token)
transfers = trf_list if isinstance(trf_list, list) else trf_list.get("transfers", [])
active_trf = next(t for t in transfers if t["transfer_number"] == trf_res["transfer_number"])

# Complete transfer
code, comp_res = http_req("/api/transfers/complete", "POST", {"transfer_id": active_trf["id"]}, token=token)
assert code == 200 and comp_res.get("success") is True, f"Transfer complete failed: {comp_res}"
print(f" -> SUCCESS: Transfer {trf_res['transfer_number']} created and completed at destination hub.")

# STEP 9: Returns & RMA Inspection Flow
print("[9/12] Testing Customer Return (RMA) & Quarantine Restock...")
ret_payload = {
    "order_id": so_id,
    "customer_id": "cust-tech",
    "product_id": target_prd["id"],
    "warehouse_id": "wh-central",
    "quantity": 1,
    "return_type": "CUSTOMER_RETURN",
    "reason": "Client ordered surplus quantity",
    "notes": "Original packaging intact"
}
code, ret_res = http_req("/api/returns", "POST", ret_payload, token=token)
assert code == 200 and ret_res.get("success") is True, f"Return creation failed: {ret_res}"
code, ret_list = http_req("/api/returns", token=token)
returns = ret_list if isinstance(ret_list, list) else ret_list.get("returns", [])
active_ret = next(r for r in returns if r["return_number"] == ret_res["return_number"])

# Resolve return with RESTOCK
code, res_ret = http_req("/api/returns/resolve", "POST", {
    "return_id": active_ret["id"],
    "action": "RESTOCK",
    "notes": "Inspection approved - returned to active shelf"
}, token=token)
assert code == 200 and res_ret.get("success") is True, f"Return resolve failed: {res_ret}"
print(f" -> SUCCESS: Return {ret_res['return_number']} resolved and restocked.")

# STEP 10: AI Demand Forecasting & Reorders
print("[10/12] Testing AI Demand Forecasting & Auto PO Engine...")
code, ai_res = http_req("/api/analytics?drift=1.3", token=token)
assert code == 200
reorders = ai_res.get("reorder_recommendations", [])
print(f" -> SUCCESS: AI engine calculated recommendations with 130% surge drift ({len(reorders)} reorder items).")

# STEP 11: Inventory Density Heatmap Calculations
print("[11/12] Testing D3.js Inventory Density Heatmap Data...")
code, dens = http_req("/api/inventory/density", token=token)
assert code == 200
assert "racks" in dens and "total_bins" in dens
print(f" -> SUCCESS: Density matrix mapped across {dens['total_bins']} bins and {len(dens['racks'])} rack columns.")

# STEP 12: Security Controls & Single Admin Enforcment
print("[12/12] Testing Single Admin Registration Security Restriction...")
rogue_res_code, rogue_res = http_req("/api/auth/register", "POST", {
    "full_name": "Rogue Attacker",
    "email": "rogue@attacker.com",
    "password": "Password123!",
    "role": "Admin"
})
assert rogue_res.get("success") is False, "Security Violation: Non-nik admin registration was not rejected!"
print(" -> SUCCESS: Single Super Administrator Policy strictly enforced (rejected rogue admin registration).")

print("=================================================================")
print(" ALL 12 DEEP OPERATIONAL LIFECYCLE CHECKS PASSED WITH 100% SUCCESS!")
print("=================================================================")
