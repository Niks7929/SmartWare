import http.server
import socketserver
import urllib.parse
import json
import os
import sys
import csv
import io
import datetime

import db_manager
import analytics

PORT = int(os.environ.get('PYTHON_PORT', 3000))

class SmartWareHandler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

    def _get_client_ip(self):
        forwarded = self.headers.get('X-Forwarded-For', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return self.client_address[0] if self.client_address else '127.0.0.1'

    def _set_security_headers(self, is_api=True):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
        if is_api:
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
            self.send_header('Pragma', 'no-cache')

    def _send_json(self, data, status_code=200, cookie=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self._set_security_headers(is_api=True)
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, default=str).encode('utf-8'))

    def _send_file(self, file_path, content_type):
        if not os.path.exists(file_path):
            self.send_error(404, "File Not Found")
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self._set_security_headers(is_api=False)
        self.end_headers()
        with open(file_path, 'rb') as f:
            self.wfile.write(f.read())

    def _get_auth_token(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        # Check cookie
        cookie_header = self.headers.get('Cookie', '')
        if 'smartware_session=' in cookie_header:
            for c in cookie_header.split(';'):
                c = c.strip()
                if c.startswith('smartware_session='):
                    return c[len('smartware_session='):]
        return None

    def _get_current_user(self):
        token = self._get_auth_token()
        if token:
            return db_manager.get_user_from_session(token)
        return None

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Main Application Page & HTML Entry
        if path in ['/', '/index.html', '/home', '/login', '/register', '/app']:
            return self._send_file('templates/index.html', 'text/html; charset=utf-8')

        # 2. Static Assets
        if path.startswith('/static/'):
            file_path = path[1:]
            if file_path.endswith('.css'):
                return self._send_file(file_path, 'text/css')
            elif file_path.endswith('.js'):
                return self._send_file(file_path, 'application/javascript')
            elif file_path.endswith('.svg'):
                return self._send_file(file_path, 'image/svg+xml')
            elif file_path.endswith('.png'):
                return self._send_file(file_path, 'image/png')
            elif file_path.endswith('.ico'):
                return self._send_file(file_path, 'image/x-icon')

        # 3. AUTHENTICATION REST APIS
        if path == '/api/auth/me':
            user = self._get_current_user()
            if user:
                return self._send_json({'authenticated': True, 'user': user})
            return self._send_json({'authenticated': False, 'user': None})

        elif path == '/api/auth/security_status':
            return self._send_json({
                'success': True,
                'auto_logout_inactivity_minutes': 10,
                'server_idle_timeout_minutes': 30,
                'session_type': 'session_bound',
                'brute_force_protection': True,
                'max_failed_attempts': 5,
                'lockout_minutes': 5,
                'hashing_algorithm': 'Argon2id (OWASP Recommended, Memory-Hard 64MB, 2 Passes)',
                'password_hasher': 'Argon2id',
                'security_headers_enabled': True
            })

        # 4. OPERATIONAL REST APIS
        elif path == '/api/health':
            return self._send_json({
                'status': 'online',
                'app': 'SMARTWARE',
                'title': 'Intelligent Warehouse Management System',
                'engine': 'Python 3.10 Enterprise WSGI',
                'database': 'Relational Layer (MySQL/SQLite)'
            })

        elif path == '/api/dashboard':
            drift = float(query.get('drift', [1.0])[0])
            stats = analytics.calculate_inventory_analytics(drift)
            recent_movements = db_manager.get_recent_movements(limit=15)
            warehouses = db_manager.get_all_warehouses()
            pos = db_manager.get_all_purchase_orders()
            sos = db_manager.get_all_sales_orders()
            notifs = db_manager.get_notifications(unread_only=True)

            pending_pos = sum(1 for p in pos if p['status'] in ['PENDING', 'APPROVED', 'SENT'])
            pending_sos = sum(1 for s in sos if s['status'] in ['PENDING', 'CONFIRMED', 'PICKING'])
            total_sales_value = sum(s['total_amount'] for s in sos if s['status'] in ['DISPATCHED', 'COMPLETED'])

            return self._send_json({
                'analytics': stats,
                'recent_movements': recent_movements,
                'warehouses': warehouses,
                'pending_pos_count': pending_pos,
                'pending_sos_count': pending_sos,
                'total_sales_value': total_sales_value,
                'unread_notifications_count': len(notifs)
            })

        elif path == '/api/products':
            products = db_manager.get_all_products()
            return self._send_json({'products': products})

        elif path == '/api/warehouses':
            warehouses = db_manager.get_all_warehouses()
            locations = db_manager.get_all_locations()
            density = db_manager.get_inventory_density()
            return self._send_json({'warehouses': warehouses, 'locations': locations, 'density': density})

        elif path in ['/api/inventory/density', '/api/warehouses/density']:
            wh_filter = query.get('warehouse_id', [None])[0]
            density = db_manager.get_inventory_density(wh_filter)
            return self._send_json(density)

        elif path == '/api/locations':
            locations = db_manager.get_all_locations()
            return self._send_json({'locations': locations})

        elif path == '/api/suppliers':
            suppliers = db_manager.get_all_suppliers()
            return self._send_json({'suppliers': suppliers})

        elif path == '/api/customers':
            customers = db_manager.get_all_customers()
            return self._send_json({'customers': customers})

        elif path in ('/api/purchase_orders', '/api/purchase-orders'):
            pos = db_manager.get_all_purchase_orders()
            return self._send_json({'purchase_orders': pos})

        elif path in ('/api/sales_orders', '/api/sales-orders'):
            sos = db_manager.get_all_sales_orders()
            return self._send_json({'sales_orders': sos})

        elif path == '/api/transfers':
            transfers = db_manager.get_all_transfers()
            return self._send_json({'transfers': transfers})

        elif path == '/api/returns':
            returns = db_manager.get_all_returns()
            return self._send_json({'returns': returns})

        elif path in ('/api/audit_logs', '/api/audit/logs', '/api/audit-logs'):
            logs = db_manager.get_all_audit_logs(limit=100)
            return self._send_json({'audit_logs': logs})

        elif path == '/api/movements':
            movements = db_manager.get_recent_movements(limit=50)
            return self._send_json({'movements': movements})

        elif path == '/api/notifications':
            notifs = db_manager.get_notifications()
            return self._send_json({'notifications': notifs})

        elif path in ('/api/analytics', '/api/ai/forecast'):
            drift = float(query.get('drift', query.get('surge', [1.0]))[0])
            stats = analytics.calculate_inventory_analytics(drift)
            return self._send_json(stats)

        elif path in ('/api/export_csv', '/api/reports/export'):
            report_type = query.get('type', ['products'])[0]
            output = io.StringIO()
            writer = csv.writer(output)

            if report_type == 'products':
                products = db_manager.get_all_products()
                writer.writerow(['SKU', 'Barcode', 'Name', 'Category', 'Quantity', 'Unit', 'Purchase Price (INR)', 'Selling Price (INR)', 'Total Valuation', 'Warehouse', 'Location Bin'])
                for p in products:
                    val = round(p['quantity'] * p['purchase_price'], 2)
                    writer.writerow([
                        p['sku'], p['barcode'], p['name'], p['category'], p['quantity'], p.get('unit', 'pcs'),
                        p['purchase_price'], p['selling_price'], val, p.get('warehouse_name', ''), p.get('location_code', '')
                    ])
                filename = "smartware_inventory_valuation.csv"

            elif report_type == 'purchase_orders':
                pos = db_manager.get_all_purchase_orders()
                writer.writerow(['PO Number', 'Supplier', 'Warehouse', 'Status', 'Total Amount (INR)', 'Expected Delivery', 'Created By', 'Created At'])
                for po in pos:
                    writer.writerow([
                        po['po_number'], po['supplier_name'], po['warehouse_name'], po['status'],
                        po['total_amount'], po.get('expected_delivery', ''), po.get('created_by', ''), po['created_at']
                    ])
                filename = "smartware_purchase_orders.csv"

            elif report_type == 'sales_orders':
                sos = db_manager.get_all_sales_orders()
                writer.writerow(['SO Number', 'Customer', 'Warehouse', 'Status', 'Total Amount (INR)', 'Created By', 'Created At'])
                for so in sos:
                    writer.writerow([
                        so['so_number'], so['customer_name'], so['warehouse_name'], so['status'],
                        so['total_amount'], so.get('created_by', ''), so['created_at']
                    ])
                filename = "smartware_sales_orders.csv"

            elif report_type == 'movements':
                movs = db_manager.get_recent_movements(limit=200)
                writer.writerow(['Date/Time', 'Movement ID', 'Product Name', 'SKU', 'Movement Type', 'Quantity', 'Previous Stock', 'New Stock', 'Warehouse Code', 'Reference', 'Reason', 'User'])
                for m in movs:
                    writer.writerow([
                        m['created_at'], m['id'], m['product_name'], m['product_sku'], m['movement_type'],
                        m['quantity'], m['previous_quantity'], m['new_quantity'], m.get('warehouse_code', ''),
                        m.get('reference', ''), m.get('reason', ''), m.get('user_id', '')
                    ])
                filename = "smartware_stock_movements.csv"

            else:
                logs = db_manager.get_all_audit_logs(limit=200)
                writer.writerow(['Timestamp', 'Log ID', 'User Role', 'Module', 'Action', 'Record ID', 'Details', 'IP Address'])
                for l in logs:
                    writer.writerow([
                        l['created_at'], l['id'], l['user_role'], l.get('module', ''), l['action'],
                        l.get('record_id', ''), l['details'], l['ip_address']
                    ])
                filename = "smartware_system_audit_logs.csv"

            csv_data = output.getvalue()
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.end_headers()
            self.wfile.write(csv_data.encode('utf-8'))
            return

        else:
            self.send_error(404, "Endpoint Not Found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        current_user = self._get_current_user()
        user_role = current_user['role'] if current_user else data.get('user_role', 'Admin')

        # 1. AUTHENTICATION ENDPOINTS
        if path == '/api/auth/login':
            identifier = data.get('email') or data.get('username') or ''
            password = data.get('password') or ''
            client_ip = self._get_client_ip()
            success, result = db_manager.verify_credentials(identifier, password, ip=client_ip)
            if not success:
                status_code = 429 if 'locked' in result.lower() else 401
                return self._send_json({'success': False, 'message': result}, status_code)
            
            user = result
            token = db_manager.create_user_session(user['id'], user['role'])
            # Session cookie without permanent Max-Age, automatically dies on browser close
            cookie = f"smartware_session={token}; Path=/; HttpOnly; SameSite=Lax"
            return self._send_json({
                'success': True,
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'role': user['role'],
                    'department': user['department']
                },
                'message': f"Welcome back, {user['full_name']}!"
            }, cookie=cookie)

        elif path == '/api/auth/register':
            success, result = db_manager.register_user(data)
            if not success:
                return self._send_json({'success': False, 'message': result}, 400)
            
            user = result
            token = db_manager.create_user_session(user['id'], user['role'])
            cookie = f"smartware_session={token}; Path=/; HttpOnly; SameSite=Lax"
            return self._send_json({
                'success': True,
                'token': token,
                'user': user,
                'message': f"Account registered successfully! Welcome to SmartWare, {user['full_name']}."
            }, cookie=cookie)

        elif path == '/api/auth/logout':
            token = self._get_auth_token() or data.get('token')
            reason = data.get('reason', 'user_initiated')
            client_ip = self._get_client_ip()
            if token:
                target_user = db_manager.get_user_from_session(token)
                if target_user:
                    action = 'AUTO_LOGOUT_INACTIVITY' if 'inactivity' in reason else ('AUTO_LOGOUT_PAGE_EXIT' if 'exit' in reason else 'USER_LOGOUT')
                    db_manager.log_audit(
                        target_user['role'],
                        action,
                        'SECURITY',
                        target_user['id'],
                        '',
                        'LOGGED_OUT',
                        f"Session ended ({reason})",
                        ip_address=client_ip
                    )
                db_manager.delete_user_session(token)
            cookie = "smartware_session=; Path=/; HttpOnly; Max-Age=0"
            return self._send_json({'success': True, 'message': 'Successfully logged out'}, cookie=cookie)

        elif path == '/api/auth/refresh_session':
            token = self._get_auth_token() or data.get('token')
            if not token:
                return self._send_json({'success': False, 'message': 'Authentication required'}, 401)
            user = db_manager.get_user_from_session(token)
            if user:
                db_manager.touch_user_session(token)
                return self._send_json({'success': True, 'user': user, 'message': 'Session refreshed successfully'})
            return self._send_json({'success': False, 'message': 'Session expired or invalid'}, 401)

        elif path == '/api/auth/security_status':
            return self._send_json({
                'success': True,
                'auto_logout_inactivity_minutes': 10,
                'server_idle_timeout_minutes': 30,
                'session_type': 'session_bound',
                'brute_force_protection': True,
                'max_failed_attempts': 5,
                'lockout_minutes': 5,
                'hashing_algorithm': 'Argon2id (OWASP Recommended, Memory-Hard 64MB, 2 Passes)',
                'password_hasher': 'Argon2id',
                'security_headers_enabled': True
            })

        elif path == '/api/auth/change_password':
            if not current_user:
                return self._send_json({'success': False, 'message': 'Authentication required'}, 401)
            old_pass = data.get('current_password', '')
            new_pass = data.get('new_password', '')
            success, msg = db_manager.change_password(current_user['id'], old_pass, new_pass)
            return self._send_json({'success': success, 'message': msg})

        # 2. INVENTORY & PRODUCT OPERATIONS
        elif path == '/api/products':
            success, result = db_manager.add_product(data)
            if not success:
                return self._send_json({'success': False, 'message': result}, 400)
            return self._send_json({'success': True, 'product_id': result, 'message': f"Product '{data.get('name')}' registered successfully!"})

        elif path == '/api/products/stock':
            change = int(data.get('quantity_change', 0))
            if change == 0:
                return self._send_json({'success': False, 'message': 'Quantity change cannot be zero.'}, 400)
            
            reason = data.get('reason', 'Manual stock adjustment')
            notes = data.get('notes', '')
            full_reason = f"{reason}: {notes}" if notes else reason

            success, msg = db_manager.update_product_stock(
                data['product_id'],
                change,
                movement_type=data.get('movement_type', 'ADJUSTMENT'),
                reference=data.get('reference', 'Cycle Count Correction'),
                user_role=user_role,
                reason=full_reason
            )
            return self._send_json({'success': success, 'message': msg})

        # 3. PURCHASING & RECEIVING OPERATIONS
        elif path in ('/api/purchase_orders', '/api/purchase-orders'):
            po_id, po_num = db_manager.create_purchase_order({
                **data,
                'created_by': current_user['full_name'] if current_user else 'Purchase Manager'
            })
            return self._send_json({'success': True, 'po_id': po_id, 'po_number': po_num, 'message': f"Purchase Order {po_num} drafted successfully!"})

        elif path in ('/api/purchase_orders/receive', '/api/purchase-orders/receive'):
            po_id = data.get('po_id')
            success, msg = db_manager.receive_purchase_order(po_id, user_role=user_role)
            return self._send_json({'success': success, 'message': msg})

        elif path in ('/api/purchase_orders/auto_generate', '/api/purchase-orders/auto_generate', '/api/purchase-orders/auto-generate'):
            # Run AI Analytics
            stats = analytics.calculate_inventory_analytics()
            reorders = stats['reorder_recommendations']
            suppliers = db_manager.get_all_suppliers()
            warehouses = db_manager.get_all_warehouses()

            # Filter out any SKU that ALREADY has a pending/approved PO to avoid duplicate orders!
            eligible_reorders = [item for item in reorders if not item.get('has_pending_po')]

            if not eligible_reorders:
                return self._send_json({
                    'success': True,
                    'message': 'All low-stock SKUs already have active purchase orders in progress! No duplicate POs were generated.'
                })

            count = 0
            for item in eligible_reorders:
                po_data = {
                    'supplier_id': item['supplier_id'] or (suppliers[0]['id'] if suppliers else 'default'),
                    'warehouse_id': item['warehouse_id'] or (warehouses[0]['id'] if warehouses else 'wh-central'),
                    'total_amount': item['estimated_total_cost'],
                    'expected_delivery': (datetime.date.today() + datetime.timedelta(days=7)).strftime('%Y-%m-%d'),
                    'created_by': 'AI SmartWare Auto-Engine',
                    'notes': f"Auto-generated reorder to prevent shortage. Suggested qty: {item['suggested_reorder_qty']}",
                    'items': [{
                        'product_id': item['product_id'],
                        'quantity': item['suggested_reorder_qty'],
                        'unit_cost': item['unit_cost']
                    }]
                }
                db_manager.create_purchase_order(po_data)
                count += 1

            return self._send_json({
                'success': True,
                'message': f"AI Auto-Engine created {count} new Purchase Orders for low-stock SKUs! (Duplicate pending orders were safely skipped)"
            })

        # 4. SALES ORDERS & DISPATCH WITH STRICT STOCK VALIDATION
        elif path in ('/api/sales_orders', '/api/sales-orders'):
            so_id, so_num = db_manager.create_sales_order({
                **data,
                'created_by': current_user['full_name'] if current_user else 'Sales Manager'
            })
            return self._send_json({'success': True, 'so_id': so_id, 'so_number': so_num, 'message': f"Sales Order {so_num} booked successfully!"})

        elif path in ('/api/sales_orders/dispatch', '/api/sales-orders/dispatch'):
            so_id = data.get('so_id')
            success, msg = db_manager.dispatch_sales_order(so_id, user_role=user_role)
            return self._send_json({'success': success, 'message': msg})

        # 5. WAREHOUSE TRANSFERS
        elif path == '/api/transfers':
            success, result = db_manager.create_stock_transfer(data)
            if not success:
                return self._send_json({'success': False, 'message': result}, 400)
            return self._send_json({'success': True, 'transfer_number': result, 'message': f"Transfer {result} initiated. Stock in transit from source warehouse."})

        elif path in ('/api/transfers/complete', '/api/transfers/receive'):
            transfer_id = data.get('transfer_id')
            success, msg = db_manager.complete_stock_transfer(transfer_id, user_role=user_role)
            return self._send_json({'success': success, 'message': msg})

        # 6. RETURNS & QUARANTINE RESOLUTION
        elif path == '/api/returns':
            success, result = db_manager.create_return(data)
            if not success:
                return self._send_json({'success': False, 'message': result}, 400)
            return self._send_json({'success': True, 'return_number': result, 'message': f"Customer return {result} registered and isolated in Quarantine Bay."})

        elif path == '/api/returns/resolve':
            ret_id = data.get('return_id')
            action = data.get('action', 'RESTOCK')
            notes = data.get('notes', 'Inspection completed')
            success, msg = db_manager.resolve_return(ret_id, action, notes, user_role=user_role)
            return self._send_json({'success': success, 'message': msg})

        # 7. NOTIFICATIONS READ ALL
        elif path in ('/api/notifications/read_all', '/api/notifications/read-all'):
            db_manager.mark_all_notifications_read()
            return self._send_json({'success': True, 'message': 'All notifications marked as read'})

        # 8. REFRESH ALL
        elif path == '/api/refresh_all':
            now_str = datetime.datetime.now().strftime("%I:%M:%S %p")
            return self._send_json({'success': True, 'message': 'All warehouse modules and live analytics synced!', 'timestamp': now_str})

        else:
            self.send_error(404, "Endpoint Not Found")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def main():
    db_manager.init_db()
    print(f"SMARTWARE Intelligent Warehouse Backend initializing on port {PORT}...")
    server = ReusableTCPServer(("0.0.0.0", PORT), SmartWareHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down SMARTWARE server.")
        server.server_close()

if __name__ == '__main__':
    main()
