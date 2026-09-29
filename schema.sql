-- ==========================================================
-- SMARTWARE: Intelligent Warehouse Management System
-- Relational Database Schema (MySQL 8.0+ & SQLite compatible)
-- ==========================================================

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50) DEFAULT 'Operations',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_token VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) DEFAULT 'Chicago',
    manager_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) DEFAULT '+1-800-555-0100',
    email VARCHAR(100) DEFAULT 'warehouse@smartware.com',
    capacity_sqft INT DEFAULT 25000,
    used_sqft INT DEFAULT 12000,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id VARCHAR(36) PRIMARY KEY,
    warehouse_id VARCHAR(36) NOT NULL,
    rack VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin VARCHAR(20) NOT NULL,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    capacity INT DEFAULT 500,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    supplier_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(50),
    gst_number VARCHAR(50),
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    lead_time_days INT DEFAULT 7,
    rating DECIMAL(3,2) DEFAULT 4.80,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    customer_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(50),
    gst_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(36),
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(100) DEFAULT 'SmartWare OEM',
    unit VARCHAR(20) DEFAULT 'pcs',
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    max_stock_level INT DEFAULT 500,
    reorder_point INT DEFAULT 25,
    warehouse_id VARCHAR(36),
    location_rack VARCHAR(20) DEFAULT 'R01',
    location_shelf VARCHAR(20) DEFAULT 'S01',
    location_bin VARCHAR(20) DEFAULT 'B01',
    location_code VARCHAR(50) DEFAULT 'WH-R01-S01-B01',
    supplier_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    po_number VARCHAR(30) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    warehouse_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- DRAFT, PENDING, APPROVED, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    expected_delivery DATE,
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_at DATETIME,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS po_items (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(36) PRIMARY KEY,
    so_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id VARCHAR(36),
    customer_name VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, PICKING, PICKED, DISPATCHED, COMPLETED, CANCELLED
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    dispatched_at DATETIME,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS so_items (
    id VARCHAR(36) PRIMARY KEY,
    so_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (so_id) REFERENCES sales_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id VARCHAR(36) PRIMARY KEY,
    transfer_number VARCHAR(30) UNIQUE NOT NULL,
    source_warehouse_id VARCHAR(36) NOT NULL,
    destination_warehouse_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'IN_TRANSIT', -- REQUESTED, APPROVED, IN_TRANSIT, RECEIVED, CANCELLED
    notes TEXT,
    requested_by VARCHAR(100) DEFAULT 'Warehouse Supervisor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_at DATETIME,
    FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS returns (
    id VARCHAR(36) PRIMARY KEY,
    return_number VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    warehouse_id VARCHAR(36),
    quantity INT NOT NULL,
    reason VARCHAR(200) NOT NULL,
    condition VARCHAR(50) DEFAULT 'QUARANTINED', -- QUARANTINED, INSPECTION_PASSED, DAMAGED, DEFECTIVE
    inspection_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, INSPECTED, COMPLETED
    remedial_action VARCHAR(50) DEFAULT 'QUARANTINE', -- QUARANTINE, RESTOCK, DAMAGED, DISPOSAL
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    inspected_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    warehouse_id VARCHAR(36),
    movement_type VARCHAR(30) NOT NULL, -- PURCHASE_RECEIPT, SALE_DISPATCH, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT_IN, ADJUSTMENT_OUT, RETURN, QUARANTINE, DAMAGE, DISPOSAL
    quantity INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference VARCHAR(100),
    user_id VARCHAR(50) DEFAULT 'system',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'INFO', -- LOW_STOCK, CRITICAL_STOCK, PO_PENDING, PO_RECEIVED, DISPATCH, RETURN, TRANSFER
    is_read INT DEFAULT 0,
    link VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) DEFAULT 'INVENTORY',
    record_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
