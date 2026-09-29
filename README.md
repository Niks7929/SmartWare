# SmartWare - Intelligent Warehouse Management System (WMS)

SmartWare is an enterprise-grade, full-stack warehouse and inventory management platform built with **Python 3**, **HTML5**, **Bootstrap 5.3**, **Chart.js**, **D3.js v7**, and an ACID-compliant relational database engine.

---

## 👩‍💻 Project Ownership

SmartWare is a warehouse management application built for operational inventory, procurement, sales, and reporting workflows.

- **Primary Super Administrator**: `nik@gmail.com`
- **Verified admin credentials**:
  - Email / Username: `nik@gmail.com`
  - Password: `123456`
- **Role**: `Admin`
- **System rule**: only the `nik@gmail.com` account is allowed to hold administrator access.

---

## 🔐 Authentication & Single Super Administrator Access

SmartWare uses **Argon2id**-style password hashing with a compatibility fallback for secure authentication. The application enforces a single administrator account policy.

| Field | Production Value |
|---|---|
| **Administrator Email** | `nik@gmail.com` |
| **Administrator Username** | `nik@gmail.com` or `admin` |
| **Password** | `123456` |
| **Role** | `Admin` |
| **Access Policy** | Only `nik@gmail.com` can hold administrator access. Additional admin accounts are blocked. |

---

## 🛡️ Enterprise Security & Session Guard

- **Strictly English UI**: 100% of all UI strings, toasts, modal dialogs, and error messages are in clear, professional English.
- **Auto-Logout on Tab/Window Close**: Unloading the browser tab or closing the window immediately terminates the session via `navigator.sendBeacon`.
- **10-Minute Idle Inactivity Timeout**: Automatically counts down when idle; shows a 60-second warning modal before safe termination.
- **Brute-Force Rate Limiting**: 5 consecutive failed login attempts trigger an automatic 5-minute lockout with HTTP 429 status.
- **Enterprise Security HTTP Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Cache-Control: no-store, no-cache, must-revalidate, private`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 📦 Core Operational Modules

1. **Executive Dashboard**:
   - Live KPI cards: Total Active SKUs, Cost Valuation, Potential Revenue, Projected Gross Margin, and Stock Health Index.
   - Interactive Chart.js visualizers: Category Breakdown (doughnut) and Stock Health Distribution (bar).
   - Real-time stock movement ledger and facility load counters.

2. **Master Product Catalog & Barcode/QR Generation**:
   - Complete inventory catalog with SKU codes, barcodes, unit pricing, margins, and assigned warehouse locations.
   - Built-in QR Code and Barcode Thermal Label Badge printer modal for box scanning.
   - Manual stock count adjustment with mandatory audit logging.

3. **Multi-Hub Warehouses & Spatial Locations**:
   - Centralized management across 4 distribution hubs:
     - `WH-CENTRAL`: Central Mega Logistics Hub (Gurugram)
     - `WH-EAST`: East Coast Distribution Center (Kolkata)
     - `WH-NORTH`: Northern Industrial Hub (Baddi)
     - `WH-WEST`: Pacific West Fulfillment Depot (Navi Mumbai)
   - Granular Aisle, Rack, Shelf, and Bin coordinates (`HUB-RACK-SHELF-BIN`).

4. **Interactive D3.js Inventory Density Heatmap**:
   - 2D physical matrix mapping rack columns and shelf rows with color-coded density tiers:
     - **Critical Hotspot (>90% capacity)**: `#ef4444`
     - **High Density (75%–90%)**: `#f59e0b`
     - **Optimal Space**: `#10b981`
     - **Low Density**: `#3b82f6`
     - **Empty Space**: `#f1f5f9`
   - Hotspot isolation filter to rapidly identify and rebalance overloaded storage bins.
   - Chart.js Rack Leaderboard ranking racks by highest storage density across all hubs.

5. **Inbound Purchase Orders (PO)**:
   - Create supplier purchase orders with expected delivery dates and itemized costs.
   - **1-Click Dock Receiving**: Restocks inventory into target warehouse bins with automated transaction audit logging.

6. **Outbound Sales Orders (SO)**:
   - Create client sales orders with real-time stock availability verification.
   - **Strict Stock Guard**: Rejects orders exceeding available inventory to prevent negative stock balances.
   - **1-Click Dispatch**: Automatically decrements bin inventory and generates outbound movements.

7. **Inter-Hub Stock Transfers**:
   - Manage cross-facility inventory relocations with `IN_TRANSIT` and `COMPLETED` lifecycle tracking.
   - Safeguards transfer quantities at the source hub during transit.

8. **Returns & Defective Stock Quarantine (RMA)**:
   - Isolate customer and supplier returns in the Quarantine Bay with inspection notes.
   - Inspection resolution workflows: `RESTOCK` (returns units to inventory) or `SCRAP/RETURN_TO_SUPPLIER`.

9. **AI Demand Intelligence & Forecasting**:
   - 7-day and 30-day predictive sales velocity algorithm based on order history.
   - Demand surge multiplier simulation slider (100% baseline to 150% peak season surge).
   - **1-Click AI Auto Purchase Orders**: Automatically creates drafted POs for all low-stock SKUs, intelligently skipping SKUs with active orders already in progress.

10. **Movements Ledger & Immutable Audit Trail**:
    - Complete chronologically ordered ledger of every stock change: `PURCHASE_RECEIPT`, `SALE_DISPATCH`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `QUARANTINE`.
    - User attribution, timestamps, reference order numbers, and change reasons.

11. **CSV Data Report Generator**:
    - Instant CSV export for inventory valuation, purchase orders, sales orders, and audit logs.

---

## 🌐 REST API Endpoints

### Authentication & Sessions
- `POST /api/auth/login` — Sign in with email/username & password (returns Bearer token)
- `GET  /api/auth/me` — Validate current user session and permissions
- `POST /api/auth/logout` — Invalidate user session
- `POST /api/auth/refresh_session` — Extend active session timeout
- `GET  /api/auth/security_status` — Real-time security standards status

### Operations & Inventory
- `GET  /api/dashboard` — Live KPI metrics, valuation, and movements
- `GET  /api/products` — Product inventory catalog
- `POST /api/products/stock` — Adjust product stock with audit trail
- `GET  /api/warehouses` — Warehouse facilities & bin location mappings
- `GET  /api/inventory/density` — D3 heatmap utilization matrix & rack rankings
- `GET  /api/purchase_orders` — Inbound purchase orders
- `POST /api/purchase_orders` — Draft new purchase order
- `POST /api/purchase_orders/receive` — 1-click dock delivery receiving
- `POST /api/purchase_orders/auto_generate` — 1-click AI auto reorders
- `GET  /api/sales_orders` — Outbound sales orders
- `POST /api/sales_orders` — Book customer sales order
- `POST /api/sales_orders/dispatch` — Dispatch & deduct stock
- `GET  /api/transfers` — Inter-hub stock transfers
- `POST /api/transfers` — Initiate stock transfer
- `POST /api/transfers/complete` — Confirm destination dock arrival
- `GET  /api/returns` — Customer RMA returns
- `POST /api/returns` — Log new return
- `POST /api/returns/resolve` — Inspection resolution
- `GET  /api/movements` — Stock movements ledger
- `GET  /api/audit_logs` — Security audit logs
- `GET  /api/analytics` — AI demand forecasting & surge simulation
- `GET  /api/export_csv` — Download structured CSV reports

---

## 🧪 Automated Testing & Verification

SmartWare includes a test suite covering the operational modules. The verified working local commands are:

```powershell
# Run the full automated test suite
python tests_runner.py

# Verify the major end-to-end flows
python test_all_modules.py
```

### Test Coverage (23/23 Passing):
- `TC-01`: Super Admin Login & JWT Token Generation
- `TC-02`: Invalid Password Authentication Rejection (HTTP 401)
- `TC-03`: Session Validation (`/api/auth/me`)
- `TC-04`: User Registration & New User Login
- `TC-05`: Executive Dashboard Real-Time Metrics & Valuation
- `TC-06`: Product Inventory Catalog & SKU Metadata
- `TC-07`: Inventory Stock Adjustment & Audit Trail
- `TC-08`: Multi-Hub Warehouses & Bin Locations Mapping
- `TC-09`: Purchase Order Flow & 1-Click Dock Receiving
- `TC-10`: Sales Order Booking & Outbound Dispatch Deduction
- `TC-11`: Insufficient Stock Guard (Negative Stock Prevention)
- `TC-12`: Inter-Hub Stock Transfer (In-Transit to Complete)
- `TC-13`: Returns & RMA Inspection Restock Processing
- `TC-14`: AI Demand Forecasting & Surge Multiplier (100% to 150%)
- `TC-15`: 1-Click AI Auto Purchase Order Generation
- `TC-16`: Movements Ledger & Security Audit Logs
- `TC-17`: System Notifications & Read-All Action
- `TC-18`: CSV Data Report Generator & Export
- `TC-19`: Brute-Force Rate Limiting Lockout (HTTP 429)
- `TC-20`: Enterprise HTTP Security Headers (`nosniff`, `SAMEORIGIN`, `no-store`)
- `TC-21`: Session Sliding Expiry & Active Refresh API
- `TC-22`: Argon2id Memory-Hard Password Hashing (OWASP Standard)
- `TC-23`: Inventory Density Heatmap & Bin Rack Utilization

---

## 🚀 Running the Application

SmartWare runs directly on Python. Node.js and npm are not required to start the application.

```powershell
cd "C:\Users\NIKITA\Downloads\smartware---intelligent-warehouse-management-system"
python app.py
```

Open the application and API at:

```text
http://localhost:3000
```

The npm scripts are optional compatibility shortcuts that also launch the Python server:

```powershell
cd "C:\Users\NIKITA\Downloads\smartware---intelligent-warehouse-management-system"
npm run dev
```

Then visit:

```text
http://localhost:3000
```

The end-to-end tests use the same default port:

```powershell
python tests_runner.py
```
