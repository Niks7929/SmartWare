-- ==========================================================
-- SMARTWARE: Seed Demo Data
-- Populates Realistic Enterprise Warehouse Lifecycle Data
-- ==========================================================

-- 1. Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
('role-admin', 'Admin', 'Super administrator with unrestricted system access'),
('role-wh-mgr', 'Warehouse Manager', 'Oversees inventory, transfers, locations, and adjustments'),
('role-pur-mgr', 'Purchase Manager', 'Manages suppliers, purchase orders, and receiving'),
('role-sal-mgr', 'Sales Manager', 'Manages clients, customer sales orders, and dispatches'),
('role-staff', 'Warehouse Staff', 'Operational inventory inspection, picking, and receiving');

-- 2. Users (Single Super Admin: nik@gmail.com / Pass: 123456 / Argon2id secured)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role, department, status) VALUES
('usr-admin', 'nik@gmail.com', 'nik@gmail.com', '$argon2id$v=19$m=65536,t=2,p=2$vvo2CoRc0N0l5DWTMbcwvQ$mXzv8ufrIZNvf/jlEQPPjC9e8QmBQeHfmp2fGb2o8lY', 'Nikita Chaudhari', 'Admin', 'Executive Operations', 'ACTIVE'),
('usr-wh-mgr', 'warehouse_mgr', 'warehouse@smartware.com', '$argon2id$v=19$m=65536,t=2,p=2$fKCvJeTypHC16KMx6CsrNw$OuiCwplMnZJRGMH9zuOy4R+MycAqJvVfq5glclpDw5c', 'Marcus Vance', 'Warehouse Manager', 'Warehouse Logistics', 'ACTIVE'),
('usr-pur-mgr', 'purchase_mgr', 'purchase@smartware.com', '$argon2id$v=19$m=65536,t=2,p=2$fKCvJeTypHC16KMx6CsrNw$OuiCwplMnZJRGMH9zuOy4R+MycAqJvVfq5glclpDw5c', 'Sarah Jenkins', 'Purchase Manager', 'Procurement & Supply', 'ACTIVE'),
('usr-sal-mgr', 'sales_mgr', 'sales@smartware.com', '$argon2id$v=19$m=65536,t=2,p=2$fKCvJeTypHC16KMx6CsrNw$OuiCwplMnZJRGMH9zuOy4R+MycAqJvVfq5glclpDw5c', 'Rajesh Patel', 'Sales Manager', 'Client Fulfillment', 'ACTIVE'),
('usr-staff', 'staff_clerk', 'staff@smartware.com', '$argon2id$v=19$m=65536,t=2,p=2$fKCvJeTypHC16KMx6CsrNw$OuiCwplMnZJRGMH9zuOy4R+MycAqJvVfq5glclpDw5c', 'Aman Verma', 'Warehouse Staff', 'Dock & Floor Operations', 'ACTIVE');

-- 3. Categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('cat-elec', 'Electronics', 'Barcode scanners, thermal printers, IoT sensors, and mobile terminals'),
('cat-mach', 'Machinery Parts', 'Hydraulic valves, precision bearings, pneumatic couplings, and gaskets'),
('cat-stor', 'Storage Equipment', 'Heavy duty steel pallets, cantilever racks, bins, and tote boxes'),
('cat-pack', 'Packaging', 'Biodegradable bubble wraps, corrugated cartons, and strapping bands'),
('cat-safe', 'Safety & Hardware', 'High-visibility safety vests, steel-toe boots, helmets, and industrial gloves');

-- 4. Warehouses
INSERT OR IGNORE INTO warehouses (id, code, name, address, city, manager_name, phone, email, capacity_sqft, used_sqft) VALUES
('wh-central', 'WH-CENTRAL', 'Central Mega Logistics Hub', '100 Industrial Parkway, Sector 18', 'Gurugram', 'Marcus Vance', '+91-124-555-0100', 'central@smartware.com', 65000, 38400),
('wh-east', 'WH-EAST', 'East Coast Distribution Center', '45 Portside Logistics Blvd', 'Kolkata', 'Elena Rostova', '+91-33-555-0199', 'east@smartware.com', 35000, 19200),
('wh-west', 'WH-WEST', 'Pacific West Fulfillment Depot', '880 Harbor Road, JNPT Zone', 'Navi Mumbai', 'David Chen', '+91-22-555-0244', 'west@smartware.com', 40000, 24600),
('wh-north', 'WH-NORTH', 'Northern Industrial Hub', '12 Highway Express Corridor', 'Baddi', 'Anil Mehta', '+91-179-555-0311', 'north@smartware.com', 25000, 11500);

-- 5. Warehouse Locations (Rack, Shelf, Bin)
INSERT OR IGNORE INTO warehouse_locations (id, warehouse_id, rack, shelf, bin, location_code, capacity) VALUES
('loc-c-1', 'wh-central', 'R01', 'S01', 'B01', 'CENTRAL-R01-S01-B01', 500),
('loc-c-2', 'wh-central', 'R01', 'S02', 'B04', 'CENTRAL-R01-S02-B04', 350),
('loc-c-3', 'wh-central', 'R02', 'S03', 'B12', 'CENTRAL-R02-S03-B12', 400),
('loc-c-4', 'wh-central', 'R03', 'S01', 'B02', 'CENTRAL-R03-S01-B02', 600),
('loc-c-5', 'wh-central', 'R02', 'S01', 'B01', 'CENTRAL-R02-S01-B01', 450),
('loc-c-6', 'wh-central', 'R02', 'S02', 'B05', 'CENTRAL-R02-S02-B05', 350),
('loc-c-7', 'wh-central', 'R03', 'S02', 'B03', 'CENTRAL-R03-S02-B03', 500),
('loc-c-8', 'wh-central', 'R04', 'S01', 'B01', 'CENTRAL-R04-S01-B01', 400),
('loc-e-1', 'wh-east', 'R01', 'S01', 'B05', 'EAST-R01-S01-B05', 450),
('loc-e-2', 'wh-east', 'R02', 'S04', 'B01', 'EAST-R02-S04-B01', 300),
('loc-e-3', 'wh-east', 'R01', 'S02', 'B02', 'EAST-R01-S02-B02', 400),
('loc-e-4', 'wh-east', 'R02', 'S02', 'B03', 'EAST-R02-S02-B03', 350),
('loc-e-5', 'wh-east', 'R03', 'S01', 'B01', 'EAST-R03-S01-B01', 450),
('loc-w-1', 'wh-west', 'R01', 'S02', 'B08', 'WEST-R01-S02-B08', 500),
('loc-w-2', 'wh-west', 'R02', 'S01', 'B03', 'WEST-R02-S01-B03', 400),
('loc-w-3', 'wh-west', 'R01', 'S01', 'B01', 'WEST-R01-S01-B01', 450),
('loc-w-4', 'wh-west', 'R02', 'S02', 'B02', 'WEST-R02-S02-B02', 350),
('loc-w-5', 'wh-west', 'R03', 'S01', 'B01', 'WEST-R03-S01-B01', 500),
('loc-n-1', 'wh-north', 'R01', 'S01', 'B02', 'NORTH-R01-S01-B02', 500),
('loc-n-2', 'wh-north', 'R01', 'S02', 'B01', 'NORTH-R01-S02-B01', 400),
('loc-n-3', 'wh-north', 'R02', 'S01', 'B03', 'NORTH-R02-S01-B03', 450),
('loc-n-4', 'wh-north', 'R03', 'S01', 'B01', 'NORTH-R03-S01-B01', 400);

-- 6. Suppliers
INSERT OR IGNORE INTO suppliers (id, supplier_code, name, company, contact_person, email, phone, city, gst_number, lead_time_days, rating) VALUES
('sup-apex', 'SUP-101', 'Apex Semiconductor Corp', 'Apex MicroTech Pvt Ltd', 'Sarah Jenkins', 's.jenkins@apexsemi.com', '+91-80-555-0199', 'Bengaluru', '29AAACA1234A1Z5', 5, 4.90),
('sup-titan', 'SUP-102', 'Titan Industrial Components', 'Titan Heavy Industries Ltd', 'Carlos Mendez', 'carlos@titanind.com', '+91-20-555-0244', 'Pune', '27AAACT5678B1Z2', 8, 4.75),
('sup-omni', 'SUP-103', 'OmniPack Global Solutions', 'OmniPack Materials India', 'Aisha Khan', 'akhan@omnipack.io', '+91-11-555-0311', 'New Delhi', '07AAAC09876C1Z8', 3, 4.95),
('sup-bharat', 'SUP-104', 'Bharat Precision Tools Ltd', 'Bharat Engineering Tools', 'Dinesh Rawat', 'dinesh@bharattools.in', '+91-79-555-0422', 'Ahmedabad', '24AAACB3456D1Z1', 6, 4.65),
('sup-quantum', 'SUP-105', 'Quantum Sensorics Co', 'Quantum Automation Solutions', 'Pooja Nair', 'pooja@quantumsensors.com', '+91-44-555-0588', 'Chennai', '33AAACQ7890E1Z9', 4, 4.88);

-- 7. Customers
INSERT OR IGNORE INTO customers (id, customer_code, name, company, email, phone, city, gst_number) VALUES
('cust-1', 'CUST-201', 'Metro Logistics Network', 'Metro Express Logistics Ltd', 'procurement@metrologistics.com', '+91-11-444-0101', 'New Delhi', '07AABCM1111A1Z9'),
('cust-2', 'CUST-202', 'Stellar Robotics Ltd', 'Stellar Automation Pvt Ltd', 'orders@stellarrobotics.com', '+91-80-444-0202', 'Bengaluru', '29AABCS2222B1Z8'),
('cust-3', 'CUST-203', 'BlueDart Regional Freight', 'BlueDart Freight Carriers', 'hub@bluedartfreight.in', '+91-22-444-0303', 'Mumbai', '27AABCB3333C1Z7'),
('cust-4', 'CUST-204', 'Horizon Automotive Components', 'Horizon Motors India', 'supply@horizonauto.in', '+91-44-444-0404', 'Chennai', '33AABCH4444D1Z6'),
('cust-5', 'CUST-205', 'Zen Superstores India', 'Zen Hypermarkets Ltd', 'inventory@zensuperstores.com', '+91-40-444-0505', 'Hyderabad', '36AABCZ5555E1Z5'),
('cust-6', 'CUST-206', 'Apollo Manufacturing Works', 'Apollo Heavy Eng Corp', 'billing@apollomfg.in', '+91-20-444-0606', 'Pune', '27AABCA6666F1Z4'),
('cust-7', 'CUST-207', 'Kolkata Port Logistics', 'Portside Warehouse Ltd', 'info@kolkataportlog.com', '+91-33-444-0707', 'Kolkata', '19AABCK7777G1Z3'),
('cust-8', 'CUST-208', 'Nexus E-Commerce Retail', 'Nexus Digital Retail LLP', 'vendor@nexusecom.in', '+91-124-444-0808', 'Gurugram', '06AABCN8888H1Z2'),
('cust-9', 'CUST-209', 'Surat Textile Machinery', 'Surat Weave Tech Ltd', 'parts@surattex.com', '+91-261-444-0909', 'Surat', '24AABCS9999I1Z1'),
('cust-10', 'CUST-210', 'Chandigarh Agro Logistics', 'Agro ColdChain Corp', 'logistics@chandigarhagro.in', '+91-172-444-1010', 'Chandigarh', '04AABCC0000J1Z0');

-- 8. Products (20+ SKUs with varied stock states: Healthy, Low Stock, Critical)
INSERT OR IGNORE INTO products (id, sku, barcode, name, description, category_id, category, brand, unit, purchase_price, selling_price, quantity, min_stock_level, max_stock_level, reorder_point, warehouse_id, location_rack, location_shelf, location_bin, location_code, supplier_id) VALUES
('prd-1', 'PRD-1001', '8901234567891', 'UltraHD 4K Industrial Barcode Scanner Pro', 'High-speed wireless imager scanner with IP65 dust and water resistance', 'cat-elec', 'Electronics', 'ApexSemi', 'pcs', 18500.00, 28999.00, 42, 15, 150, 25, 'wh-central', 'R01', 'S02', 'B04', 'CENTRAL-R01-S02-B04', 'sup-apex'),
('prd-2', 'PRD-1002', '8901234567892', 'High-Flow Hydraulic Directional Valve 12mm', 'Double solenoid hydraulic valve rated for 350 bar industrial pressures', 'cat-mach', 'Machinery Parts', 'TitanInd', 'pcs', 3200.00, 5800.00, 8, 20, 200, 30, 'wh-central', 'R02', 'S03', 'B12', 'CENTRAL-R02-S03-B12', 'sup-titan'),
('prd-3', 'PRD-1003', '8901234567893', 'Ruggedized Android Mobile Computer PDA', 'Equipped with physical keypad, 2D Zebra scan engine, and 4G LTE connectivity', 'cat-elec', 'Electronics', 'ApexSemi', 'pcs', 24500.00, 38500.00, 85, 10, 120, 20, 'wh-east', 'R02', 'S04', 'B01', 'EAST-R02-S04-B01', 'sup-apex'),
('prd-4', 'PRD-1004', '8901234567894', 'Heavy Duty Galvanized Steel Pallet 1200kg', 'Stackable 4-way entry galvanized steel warehouse pallet', 'cat-stor', 'Storage Equipment', 'TitanInd', 'units', 4200.00, 7500.00, 6, 12, 80, 18, 'wh-west', 'R01', 'S02', 'B08', 'WEST-R01-S02-B08', 'sup-titan'),
('prd-5', 'PRD-1005', '8901234567895', 'Biodegradable Air Cushion Bubble Wrap Roll 500m', 'Eco-friendly inflatable bubble roll for delicate item carton cushioning', 'cat-pack', 'Packaging', 'OmniPack', 'rolls', 1250.00, 2400.00, 240, 40, 500, 80, 'wh-central', 'R03', 'S01', 'B02', 'CENTRAL-R03-S01-B02', 'sup-omni'),
('prd-6', 'PRD-1006', '8901234567896', 'Smart Bluetooth Low-Energy RFID Beacon V3', 'Real-time asset tracking tag with 5-year battery life and magnetic mounting', 'cat-elec', 'Electronics', 'QuantumSensor', 'pcs', 650.00, 1450.00, 4, 30, 400, 50, 'wh-east', 'R01', 'S01', 'B05', 'EAST-R01-S01-B05', 'sup-quantum'),
('prd-7', 'PRD-1007', '8901234567897', 'Precision Deep Groove Bearing 50mm Stainless', 'Pre-lubricated stainless steel bearings for conveyor rollers', 'cat-mach', 'Machinery Parts', 'BharatTools', 'sets', 1850.00, 3600.00, 160, 25, 300, 45, 'wh-central', 'R01', 'S01', 'B01', 'CENTRAL-R01-S01-B01', 'sup-bharat'),
('prd-8', 'PRD-1008', '8901234567898', 'Heavy Duty Polyester Strapping Band 19mm x 1000m', 'High-tensile PET strapping roll for pallet securing', 'cat-pack', 'Packaging', 'OmniPack', 'spools', 2100.00, 4200.00, 75, 15, 200, 30, 'wh-west', 'R02', 'S01', 'B03', 'WEST-R02-S01-B03', 'sup-omni'),
('prd-9', 'PRD-1009', '8901234567899', 'Direct Thermal Label Rolls 4x6 inch (1000 Labels)', 'Standard thermal sticker roll for courier dispatch and shipping barcodes', 'cat-pack', 'Packaging', 'OmniPack', 'rolls', 380.00, 850.00, 380, 50, 800, 100, 'wh-central', 'R03', 'S01', 'B02', 'CENTRAL-R03-S01-B02', 'sup-omni'),
('prd-10', 'PRD-1010', '8901234567800', 'Industrial Thermal Transfer Ribbon 110mm x 300m', 'Wax-resin barcode printer ribbon for smudge-proof asset labeling', 'cat-pack', 'Packaging', 'ApexSemi', 'rolls', 450.00, 980.00, 120, 20, 300, 40, 'wh-east', 'R01', 'S01', 'B05', 'EAST-R01-S01-B05', 'sup-apex'),
('prd-11', 'PRD-1011', '8901234567801', 'Steel-Toe Kevlar Midsole Safety Work Boots 42EU', 'Anti-slip puncture resistant occupational safety footwear with breathable mesh', 'cat-safe', 'Safety & Hardware', 'BharatTools', 'pairs', 2200.00, 4400.00, 55, 10, 120, 25, 'wh-north', 'R01', 'S01', 'B02', 'NORTH-R01-S01-B02', 'sup-bharat'),
('prd-12', 'PRD-1012', '8901234567802', 'High-Visibility Breathable Reflective Vest Class 2', 'Fluorescent yellow vest with 3M reflective tape bands and radio pocket', 'cat-safe', 'Safety & Hardware', 'BharatTools', 'pcs', 280.00, 650.00, 210, 30, 400, 50, 'wh-central', 'R01', 'S01', 'B01', 'CENTRAL-R01-S01-B01', 'sup-bharat'),
('prd-13', 'PRD-1013', '8901234567803', 'Heavy Duty Cantilever Storage Arm 1000mm', 'Load-bearing powder coated cantilever bracket for steel pipes and bars', 'cat-stor', 'Storage Equipment', 'TitanInd', 'pcs', 1800.00, 3500.00, 34, 10, 100, 20, 'wh-north', 'R01', 'S01', 'B02', 'NORTH-R01-S01-B02', 'sup-titan'),
('prd-14', 'PRD-1014', '8901234567804', 'Nitrile Coated Abrasion Safety Grip Gloves', 'Seamless nylon liner with sandy nitrile coating for warehouse parts handling', 'cat-safe', 'Safety & Hardware', 'BharatTools', 'pairs', 120.00, 290.00, 310, 50, 600, 80, 'wh-west', 'R02', 'S01', 'B03', 'WEST-R02-S01-B03', 'sup-bharat'),
('prd-15', 'PRD-1015', '8901234567805', 'Automated Optical Sorting Sensor Module 24V', 'Photoelectric reflective sensor for sorting automation conveyors', 'cat-elec', 'Electronics', 'QuantumSensor', 'pcs', 4800.00, 9200.00, 3, 15, 100, 25, 'wh-central', 'R01', 'S02', 'B04', 'CENTRAL-R01-S02-B04', 'sup-quantum'),
('prd-16', 'PRD-1016', '8901234567806', 'Stackable Plastic Euronorm Warehouse Tote 60L', 'Reinforced impact-resistant PP storage container with ergonomic handles', 'cat-stor', 'Storage Equipment', 'TitanInd', 'units', 750.00, 1600.00, 140, 25, 350, 40, 'wh-east', 'R02', 'S04', 'B01', 'EAST-R02-S04-B01', 'sup-titan'),
('prd-17', 'PRD-1017', '8901234567807', 'Heavy Duty Manual Hydraulic Pallet Jack 2500kg', 'Nylon steer wheels with ergonomic 3-position pump handle lever', 'cat-stor', 'Storage Equipment', 'TitanInd', 'units', 16500.00, 27500.00, 9, 4, 25, 8, 'wh-central', 'R01', 'S01', 'B01', 'CENTRAL-R01-S01-B01', 'sup-titan'),
('prd-18', 'PRD-1018', '8901234567808', 'Industrial Pneumatic Cylinder 63mm Bore 200mm Stroke', 'Double acting magnetic piston cylinder for pick and place arms', 'cat-mach', 'Machinery Parts', 'BharatTools', 'pcs', 3400.00, 6400.00, 28, 8, 80, 16, 'wh-north', 'R01', 'S01', 'B02', 'NORTH-R01-S01-B02', 'sup-bharat'),
('prd-19', 'PRD-1019', '8901234567809', 'Reinforced Heavy Duty Corrugated Carton Box (Large)', '5-ply export grade kraft carton for bulk order dispatch', 'cat-pack', 'Packaging', 'OmniPack', 'units', 65.00, 160.00, 520, 100, 1500, 200, 'wh-west', 'R01', 'S02', 'B08', 'WEST-R01-S02-B08', 'sup-omni'),
('prd-20', 'PRD-1020', '8901234567810', 'Temperature & Humidity IoT Datalogger Sensor', 'Cloud calibrated ambient monitoring node for cold storage warehouse aisles', 'cat-elec', 'Electronics', 'QuantumSensor', 'pcs', 3800.00, 7600.00, 18, 10, 90, 20, 'wh-east', 'R01', 'S01', 'B05', 'EAST-R01-S01-B05', 'sup-quantum');

-- 9. Purchase Orders & Items
INSERT OR IGNORE INTO purchase_orders (id, po_number, supplier_id, warehouse_id, status, total_amount, expected_delivery, notes, created_by) VALUES
('po-1', 'PO-2026-001', 'sup-apex', 'wh-central', 'RECEIVED', 185000.00, '2026-09-10', 'Bulk restock for Q3 industrial scanners', 'Sarah Jenkins'),
('po-2', 'PO-2026-002', 'sup-titan', 'wh-central', 'PENDING', 64000.00, '2026-09-18', 'Critical hydraulic valves reorder', 'Sarah Jenkins'),
('po-3', 'PO-2026-003', 'sup-quantum', 'wh-east', 'PENDING', 26000.00, '2026-09-19', 'Emergency restock for low RFID beacon tags', 'AI Auto Reorder Engine'),
('po-4', 'PO-2026-004', 'sup-omni', 'wh-west', 'APPROVED', 42000.00, '2026-09-22', 'Scheduled packaging strapping rolls', 'Sarah Jenkins');

INSERT OR IGNORE INTO po_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost, total) VALUES
('poi-1', 'po-1', 'prd-1', 10, 10, 18500.00, 185000.00),
('poi-2', 'po-2', 'prd-2', 20, 0, 3200.00, 64000.00),
('poi-3', 'po-3', 'prd-6', 40, 0, 650.00, 26000.00),
('poi-4', 'po-4', 'prd-8', 20, 0, 2100.00, 42000.00);

-- 10. Sales Orders & Items
INSERT OR IGNORE INTO sales_orders (id, so_number, customer_id, customer_name, warehouse_id, status, total_amount, notes, created_by) VALUES
('so-1', 'SO-2026-001', 'cust-1', 'Metro Logistics Network', 'wh-central', 'DISPATCHED', 144995.00, 'Priority order for 5 scanners', 'Rajesh Patel'),
('so-2', 'SO-2026-002', 'cust-2', 'Stellar Robotics Ltd', 'wh-central', 'CONFIRMED', 34800.00, '6 Bearings and components', 'Rajesh Patel'),
('so-3', 'SO-2026-003', 'cust-3', 'BlueDart Regional Freight', 'wh-west', 'PENDING', 42000.00, '10 strapping rolls scheduled dispatch', 'Rajesh Patel'),
('so-4', 'SO-2026-004', 'cust-5', 'Zen Superstores India', 'wh-east', 'PENDING', 77000.00, '2 Mobile computers PDA for checkout', 'Rajesh Patel');

INSERT OR IGNORE INTO so_items (id, so_id, product_id, quantity, unit_price, total) VALUES
('soi-1', 'so-1', 'prd-1', 5, 28999.00, 144995.00),
('soi-2', 'so-2', 'prd-7', 6, 3600.00, 21600.00),
('soi-3', 'so-3', 'prd-8', 10, 4200.00, 42000.00),
('soi-4', 'so-4', 'prd-3', 2, 38500.00, 77000.00);

-- 11. Warehouse Transfers
INSERT OR IGNORE INTO warehouse_transfers (id, transfer_number, source_warehouse_id, destination_warehouse_id, product_id, quantity, status, notes, requested_by) VALUES
('trf-1', 'TRF-2026-001', 'wh-central', 'wh-east', 'prd-5', 20, 'IN_TRANSIT', 'Rebalancing packaging materials to East distribution hub', 'Marcus Vance'),
('trf-2', 'TRF-2026-002', 'wh-central', 'wh-west', 'prd-7', 15, 'RECEIVED', 'Precision bearing transfer completed', 'Marcus Vance');

-- 12. Returns & Quarantine
INSERT OR IGNORE INTO returns (id, return_number, customer_name, product_id, warehouse_id, quantity, reason, condition, inspection_status, remedial_action, notes) VALUES
('ret-1', 'RET-2026-001', 'Metro Logistics Network', 'prd-1', 'wh-central', 1, 'Minor scratch on scanner casing', 'QUARANTINED', 'PENDING', 'QUARANTINE', 'Customer requested exchange on dispatch delivery box inspection'),
('ret-2', 'RET-2026-002', 'Stellar Robotics Ltd', 'prd-2', 'wh-central', 2, 'Ordered incorrect port size diameter', 'INSPECTION_PASSED', 'COMPLETED', 'RESTOCK', 'Units inspected and re-sealed, approved for inventory restock');

-- 13. Notifications
INSERT OR IGNORE INTO notifications (id, title, message, type, link) VALUES
('notif-1', 'Critical Stock Warning', 'Smart Bluetooth RFID Beacon (PRD-1006) has only 4 units remaining. Below min stock level (30).', 'CRITICAL_STOCK', 'view-analytics'),
('notif-2', 'Low Stock Alert', 'Hydraulic Directional Valve (PRD-1002) has 8 units remaining (Reorder point: 30).', 'LOW_STOCK', 'view-analytics'),
('notif-3', 'PO Awaiting Receiving', 'PO-2026-002 from Titan Industrial is due for dock delivery.', 'PO_PENDING', 'view-purchases'),
('notif-4', 'Sales Order Ready for Dispatch', 'SO-2026-003 for BlueDart Freight is awaiting warehouse picking verification.', 'DISPATCH', 'view-sales'),
('notif-5', 'Quarantine Inspection Required', 'Customer return RET-2026-001 placed into Quarantine Bay Q-01.', 'RETURN', 'view-returns');

-- 14. Stock Movements (Ledger)
INSERT OR IGNORE INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, user_id, reason) VALUES
('mov-1', 'prd-1', 'wh-central', 'PURCHASE_RECEIPT', 10, 37, 47, 'PO-2026-001', 'Sarah Jenkins', 'Purchase order delivery received & restocked'),
('mov-2', 'prd-1', 'wh-central', 'SALE_DISPATCH', -5, 47, 42, 'SO-2026-001', 'Rajesh Patel', 'Dispatched client sales order to Metro Logistics'),
('mov-3', 'prd-7', 'wh-central', 'TRANSFER_OUT', -15, 175, 160, 'TRF-2026-002', 'Marcus Vance', 'Inter-hub inventory balancing transfer out to West Hub'),
('mov-4', 'prd-7', 'wh-west', 'TRANSFER_IN', 15, 0, 15, 'TRF-2026-002', 'David Chen', 'Inter-hub inventory transfer received at West Hub'),
('mov-5', 'prd-5', 'wh-central', 'ADJUSTMENT_IN', 20, 220, 240, 'MANUAL_AUDIT_2026', 'Marcus Vance', 'Physical cycle count adjustment (+20 units found)');

-- 15. Audit Logs
INSERT OR IGNORE INTO audit_logs (id, user_role, action, module, record_id, old_value, new_value, details, ip_address) VALUES
('aud-1', 'Admin', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'SYS-INIT', '', 'READY', 'SmartWare enterprise database seeded with master SKUs, warehouses, and demo roles.', '127.0.0.1'),
('aud-2', 'Warehouse Manager', 'STOCK_ADJUSTMENT', 'INVENTORY', 'prd-5', '220', '240', 'Physical cycle count adjustment performed on Biodegradable Air Cushion Bubble Wrap Roll.', '127.0.0.1'),
('aud-3', 'Purchase Manager', 'PO_RECEIVED', 'PURCHASING', 'po-1', 'ORDERED', 'RECEIVED', 'Purchase order PO-2026-001 received. 10 units restocked into Central Warehouse.', '127.0.0.1'),
('aud-4', 'Sales Manager', 'SO_DISPATCHED', 'SALES', 'so-1', 'PICKED', 'DISPATCHED', 'Sales order SO-2026-001 dispatched. Inventory deducted accordingly.', '127.0.0.1');
