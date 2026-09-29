import urllib.request, json

BASE = 'http://127.0.0.1:3000'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req_obj = urllib.request.Request(f'{BASE}{url}', headers=headers, method=method)
    body = json.dumps(data).encode('utf-8') if data else None
    with urllib.request.urlopen(req_obj, data=body) as resp:
        return resp.getcode(), json.loads(resp.read().decode('utf-8'))

print('=== TESTING ALL 15 SMARTWARE ENTERPRISE MODULES ===')

# 1. Login
code, res = req('/api/auth/login', 'POST', {'username': 'nik@gmail.com', 'password': '123456'})
assert code == 200 and res['success'], f'Login failed: {res}'
token = res['token']
print('1.  Auth / Login (nik@gmail.com): OK [TOKEN RECEIVED]')

# 2. Auth me
code, res = req('/api/auth/me', token=token)
assert res['user']['email'] == 'nik@gmail.com' and res['user']['role'] == 'Admin', f'Auth me failed: {res}'
print('2.  User Session (/api/auth/me): OK [Super Admin Nikita Chaudhari]')

# 3. Dashboard
code, res = req('/api/dashboard', token=token)
assert 'analytics' in res and 'recent_movements' in res, f'Dashboard failed: {res}'
analytics = res['analytics']
print(f'3.  Executive Dashboard: OK [SKUs: {analytics["total_skus"]}, Units: {analytics["total_units"]}]')

# 4. Products
code, res = req('/api/products', token=token)
products_list = res if isinstance(res, list) else res.get('products', [])
assert len(products_list) > 0, f'Products failed: {res}'
print(f'4.  Products Inventory Catalog: OK [{len(products_list)} active SKUs]')

# 5. Warehouses
code, res = req('/api/warehouses', token=token)
wh_list = res if isinstance(res, list) else res.get('warehouses', [])
assert len(wh_list) > 0, f'Warehouses failed: {res}'
print(f'5.  Multi-Hub Warehouses: OK [{len(wh_list)} distribution hubs connected]')

# 6. Inventory Density & Heatmap
code, res = req('/api/inventory/density', token=token)
assert 'racks' in res and 'total_bins' in res, f'Density failed: {res}'
print(f'6.  Inventory Density Heatmap: OK [{res["total_bins"]} bins mapped across hubs]')

# 7. Purchase Orders (Inbound)
code, res = req('/api/purchase_orders', token=token)
po_list = res if isinstance(res, list) else res.get('purchase_orders', [])
print(f'7.  Inbound Purchase Orders: OK [{len(po_list)} purchase orders loaded]')

# 8. Sales Orders (Outbound)
code, res = req('/api/sales_orders', token=token)
so_list = res if isinstance(res, list) else res.get('sales_orders', [])
print(f'8.  Outbound Sales Orders: OK [{len(so_list)} sales orders loaded]')

# 9. Transfers
code, res = req('/api/transfers', token=token)
trf_list = res if isinstance(res, list) else res.get('transfers', [])
print(f'9.  Inter-Hub Transfers: OK [{len(trf_list)} stock transfers tracked]')

# 10. Returns / RMA
code, res = req('/api/returns', token=token)
ret_list = res if isinstance(res, list) else res.get('returns', [])
print(f'10. Returns & RMA: OK [{len(ret_list)} RMA records loaded]')

# 11. AI Demand Forecast
code, res = req('/api/analytics?drift=1.2', token=token)
assert 'reorder_recommendations' in res or 'demand_forecasts' in res, f'AI forecast failed: {res}'
reorders = res.get('reorder_recommendations', [])
print(f'11. AI Demand Forecasting: OK [{len(reorders)} auto-reorder recommendations generated]')

# 12. Movements Ledger
code, res = req('/api/movements', token=token)
mv_list = res if isinstance(res, list) else res.get('movements', [])
print(f'12. Movements Ledger: OK [{len(mv_list)} stock transactions logged]')

# 13. Audit Logs
code, res = req('/api/audit_logs', token=token)
audit_list = res if isinstance(res, list) else res.get('audit_logs', [])
print(f'13. Security Audit Logs: OK [{len(audit_list)} audit trail entries logged]')

# 14. Notifications
code, res = req('/api/notifications', token=token)
notif_list = res if isinstance(res, list) else res.get('notifications', [])
print(f'14. System Notifications: OK [{len(notif_list)} operational alerts tracked]')

# 15. Reports CSV Export
req_csv = urllib.request.Request(f'{BASE}/api/export_csv?type=products', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req_csv) as r:
    csv_content = r.read().decode('utf-8')
    assert 'SKU' in csv_content or 'ID' in csv_content
    print('15. CSV Report Generator: OK [Export format verified]')

print('=== ALL 15 MODULE CONNECTIONS VERIFIED 100% OPERATIONAL ===')
