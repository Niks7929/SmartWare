import {
  User,
  Warehouse,
  Supplier,
  Product,
  StockMovement,
  PurchaseOrder,
  SalesOrder,
  StockTransfer,
  ReturnItem,
  AuditLog,
  SystemNotification
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Nikita Chaudhari',
    email: 'nikita@smartware.io',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@smartware.io',
    role: 'Warehouse Manager',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    warehouseId: 'wh-1'
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.r@smartware.io',
    role: 'Warehouse Staff',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    warehouseId: 'wh-1'
  },
  {
    id: 'usr-4',
    name: 'David Chen',
    email: 'david.chen@smartware.io',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'WH-ALPHA',
    name: 'Alpha Logistics Center',
    address: '1048 Central Parkway, Bldg B',
    city: 'Chicago, IL',
    capacityUnits: 50000,
    currentStockUnits: 34210,
    managerName: 'Marcus Vance',
    contactEmail: 'alpha.wh@smartware.io',
    status: 'Active'
  },
  {
    id: 'wh-2',
    code: 'WH-BETA',
    name: 'East Coast Distribution Hub',
    address: '702 Maritime Commerce Blvd',
    city: 'Newark, NJ',
    capacityUnits: 35000,
    currentStockUnits: 28900,
    managerName: 'Sarah Jenkins',
    contactEmail: 'beta.wh@smartware.io',
    status: 'Active'
  },
  {
    id: 'wh-3',
    code: 'WH-GAMMA',
    name: 'West Pacific Depot',
    address: '450 Harbor Gateway Rd',
    city: 'Long Beach, CA',
    capacityUnits: 40000,
    currentStockUnits: 18450,
    managerName: 'Robert Vance',
    contactEmail: 'gamma.wh@smartware.io',
    status: 'Active'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    code: 'SUP-TECH',
    name: 'Apex Electronics Global',
    contactPerson: 'Kenji Sato',
    email: 'orders@apexelectronics.com',
    phone: '+1 (800) 555-0192',
    leadTimeDays: 5,
    rating: 4.8,
    address: 'Tokyo / San Jose Office'
  },
  {
    id: 'sup-2',
    code: 'SUP-OFFICE',
    name: 'ErgoDesign Solutions Ltd',
    contactPerson: 'Clara Oswald',
    email: 'supply@ergodesign.com',
    phone: '+1 (800) 555-0482',
    leadTimeDays: 7,
    rating: 4.6,
    address: 'Grand Rapids, MI'
  },
  {
    id: 'sup-3',
    code: 'SUP-PHARMA',
    name: 'BioHealth Labs & Nutra',
    contactPerson: 'Dr. Aris Thorne',
    email: 'sales@biohealth.org',
    phone: '+1 (800) 555-0921',
    leadTimeDays: 4,
    rating: 4.9,
    address: 'Boston, MA'
  },
  {
    id: 'sup-4',
    code: 'SUP-AUTO',
    name: 'Precision Industrial Components',
    contactPerson: 'Vikram Patel',
    email: 'b2b@precisioncomponents.in',
    phone: '+1 (800) 555-0311',
    leadTimeDays: 10,
    rating: 4.2,
    address: 'Detroit, MI'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'WM-001',
    barcode: '890123456701',
    name: 'Smart Ergonomic Wireless Mouse X1',
    description: 'Precision 4K DPI optical sensor, dual Bluetooth + 2.4G wireless, silent click buttons.',
    category: 'Computer Accessories',
    brand: 'Apex Tech',
    unit: 'Pcs',
    purchasePrice: 18.50,
    sellingPrice: 39.99,
    currentStock: 35,
    minStock: 40,
    maxStock: 200,
    reorderLevel: 60,
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'A-03', shelf: 'S-02', bin: 'B-14', quantity: 20 },
      { warehouseId: 'wh-2', warehouseName: 'East Coast Distribution Hub', rack: 'B-01', shelf: 'S-04', bin: 'B-02', quantity: 15 },
    ],
    batches: [
      { batchNumber: 'BAT-2026-WM1', manufactureDate: '2026-01-10', expiryDate: '2029-01-10', quantity: 35, warehouseId: 'wh-1' }
    ],
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10',
    salesLast30Days: 240,
    salesLast60Days: 450,
    salesLast90Days: 680,
    dailyAvgDemand: 8.0,
    lastSaleDate: '2026-08-12',
    lastRestockDate: '2026-07-20'
  },
  {
    id: 'prod-2',
    sku: 'KB-Mech-RGB',
    barcode: '890123456702',
    name: 'Mechanical RGB Gaming Keyboard (Tactile)',
    description: 'Aircraft-grade aluminum frame, hot-swappable switches, sound-dampening foam.',
    category: 'Computer Accessories',
    brand: 'Apex Tech',
    unit: 'Pcs',
    purchasePrice: 45.00,
    sellingPrice: 89.99,
    currentStock: 110,
    minStock: 30,
    maxStock: 250,
    reorderLevel: 50,
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'A-04', shelf: 'S-01', bin: 'B-05', quantity: 60 },
      { warehouseId: 'wh-3', warehouseName: 'West Pacific Depot', rack: 'C-02', shelf: 'S-03', bin: 'B-10', quantity: 50 }
    ],
    batches: [
      { batchNumber: 'BAT-2026-KB2', manufactureDate: '2026-02-01', expiryDate: '2030-02-01', quantity: 110, warehouseId: 'wh-1' }
    ],
    createdAt: '2026-02-01',
    updatedAt: '2026-08-11',
    salesLast30Days: 320,
    salesLast60Days: 610,
    salesLast90Days: 890,
    dailyAvgDemand: 10.6,
    lastSaleDate: '2026-08-13',
    lastRestockDate: '2026-08-01'
  },
  {
    id: 'prod-3',
    sku: 'DOCK-TH4',
    barcode: '890123456703',
    name: 'Thunderbolt 4 12-in-1 Docking Station',
    description: 'Dual 4K@60Hz display output, 100W Power Delivery, SD 4.0 reader, 2.5G Ethernet.',
    category: 'Computer Accessories',
    brand: 'Apex Tech',
    unit: 'Pcs',
    purchasePrice: 95.00,
    sellingPrice: 179.99,
    currentStock: 12,
    minStock: 25,
    maxStock: 100,
    reorderLevel: 35,
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'A-01', shelf: 'S-03', bin: 'B-01', quantity: 12 }
    ],
    batches: [
      { batchNumber: 'BAT-2026-DC1', manufactureDate: '2026-03-10', expiryDate: '2031-03-10', quantity: 12, warehouseId: 'wh-1' }
    ],
    createdAt: '2026-03-10',
    updatedAt: '2026-08-12',
    salesLast30Days: 135,
    salesLast60Days: 280,
    salesLast90Days: 410,
    dailyAvgDemand: 4.5,
    lastSaleDate: '2026-08-13',
    lastRestockDate: '2026-07-05'
  },
  {
    id: 'prod-4',
    sku: 'OLD-CAM-V1',
    barcode: '890123456704',
    name: 'Legacy 720p USB Webcam Model V1',
    description: 'Basic 720p 30fps webcam with built-in mono microphone.',
    category: 'Legacy & Clearance',
    brand: 'Apex Tech',
    unit: 'Pcs',
    purchasePrice: 12.00,
    sellingPrice: 19.99,
    currentStock: 145,
    minStock: 10,
    maxStock: 150,
    reorderLevel: 20,
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    locations: [
      { warehouseId: 'wh-2', warehouseName: 'East Coast Distribution Hub', rack: 'Z-99', shelf: 'S-01', bin: 'B-99', quantity: 145 }
    ],
    batches: [
      { batchNumber: 'BAT-2024-CAM', manufactureDate: '2024-05-10', expiryDate: '2028-05-10', quantity: 145, warehouseId: 'wh-2' }
    ],
    createdAt: '2024-05-10',
    updatedAt: '2026-05-01',
    salesLast30Days: 1,
    salesLast60Days: 2,
    salesLast90Days: 3,
    dailyAvgDemand: 0.03,
    lastSaleDate: '2026-06-02',
    lastRestockDate: '2024-05-15'
  },
  {
    id: 'prod-5',
    sku: 'CHAIR-ERGO-PRO',
    barcode: '890123456705',
    name: 'ErgoPro Mesh Executive Task Chair',
    description: '4D adjustable armrests, adaptive lumbar support, breathable Korean mesh.',
    category: 'Office Furniture',
    brand: 'ErgoDesign',
    unit: 'Units',
    purchasePrice: 160.00,
    sellingPrice: 349.00,
    currentStock: 48,
    minStock: 15,
    maxStock: 80,
    reorderLevel: 25,
    supplierId: 'sup-2',
    supplierName: 'ErgoDesign Solutions Ltd',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'F-01', shelf: 'S-01', bin: 'FLOOR', quantity: 28 },
      { warehouseId: 'wh-3', warehouseName: 'West Pacific Depot', rack: 'F-02', shelf: 'S-01', bin: 'FLOOR', quantity: 20 }
    ],
    batches: [
      { batchNumber: 'BAT-2026-CH1', manufactureDate: '2026-04-01', expiryDate: '2036-04-01', quantity: 48, warehouseId: 'wh-1' }
    ],
    createdAt: '2026-04-01',
    updatedAt: '2026-08-08',
    salesLast30Days: 62,
    salesLast60Days: 118,
    salesLast90Days: 180,
    dailyAvgDemand: 2.1,
    lastSaleDate: '2026-08-12',
    lastRestockDate: '2026-07-18'
  },
  {
    id: 'prod-6',
    sku: 'MED-VIT-C1000',
    barcode: '890123456706',
    name: 'BioNutra Vitamin C 1000mg Effervescent (Pack of 30)',
    description: 'Immune support dietary supplement with Zinc and Vitamin D3.',
    category: 'Pharma & Health',
    brand: 'BioHealth',
    unit: 'Boxes',
    purchasePrice: 4.20,
    sellingPrice: 12.99,
    currentStock: 420,
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    supplierId: 'sup-3',
    supplierName: 'BioHealth Labs & Nutra',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'P-02', shelf: 'S-03', bin: 'B-04', quantity: 420 }
    ],
    batches: [
      { batchNumber: 'PH-2026-V8', manufactureDate: '2025-08-20', expiryDate: '2026-08-25', quantity: 420, warehouseId: 'wh-1' } // EXPIRING SOON!
    ],
    createdAt: '2025-09-01',
    updatedAt: '2026-08-11',
    salesLast30Days: 210,
    salesLast60Days: 480,
    salesLast90Days: 710,
    dailyAvgDemand: 7.0,
    lastSaleDate: '2026-08-12',
    lastRestockDate: '2025-09-01'
  },
  {
    id: 'prod-7',
    sku: 'IND-SENSOR-V3',
    barcode: '890123456707',
    name: 'Industrial Vibration & Temp Sensor Probe',
    description: 'IP68 rated Modbus RS485 sensor probe for heavy machinery predictive maintenance.',
    category: 'Industrial Tools',
    brand: 'Precision Comp',
    unit: 'Pcs',
    purchasePrice: 55.00,
    sellingPrice: 125.00,
    currentStock: 85,
    minStock: 20,
    maxStock: 150,
    reorderLevel: 30,
    supplierId: 'sup-4',
    supplierName: 'Precision Industrial Components',
    locations: [
      { warehouseId: 'wh-3', warehouseName: 'West Pacific Depot', rack: 'I-05', shelf: 'S-02', bin: 'B-12', quantity: 85 }
    ],
    batches: [
      { batchNumber: 'BAT-2026-SN3', manufactureDate: '2026-02-15', expiryDate: '2036-02-15', quantity: 85, warehouseId: 'wh-3' }
    ],
    createdAt: '2026-02-15',
    updatedAt: '2026-08-09',
    salesLast30Days: 95,
    salesLast60Days: 190,
    salesLast90Days: 285,
    dailyAvgDemand: 3.2,
    lastSaleDate: '2026-08-11',
    lastRestockDate: '2026-06-25'
  },
  {
    id: 'prod-8',
    sku: 'CABLE-USBC-2M',
    barcode: '890123456708',
    name: 'Braided USB-C to USB-C Cable 240W (2m)',
    description: 'Ultra-durable nylon braided cable supporting PD 3.1 240W charging and 40Gbps data.',
    category: 'Computer Accessories',
    brand: 'Apex Tech',
    unit: 'Pcs',
    purchasePrice: 3.80,
    sellingPrice: 14.99,
    currentStock: 680,
    minStock: 150,
    maxStock: 1500,
    reorderLevel: 300,
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    locations: [
      { warehouseId: 'wh-1', warehouseName: 'Alpha Logistics Center', rack: 'A-02', shelf: 'S-01', bin: 'B-08', quantity: 400 },
      { warehouseId: 'wh-2', warehouseName: 'East Coast Distribution Hub', rack: 'B-03', shelf: 'S-02', bin: 'B-01', quantity: 280 }
    ],
    batches: [
      { batchNumber: 'BAT-2026-CB1', manufactureDate: '2026-05-01', expiryDate: '2031-05-01', quantity: 680, warehouseId: 'wh-1' }
    ],
    createdAt: '2026-05-01',
    updatedAt: '2026-08-12',
    salesLast30Days: 480,
    salesLast60Days: 920,
    salesLast90Days: 1400,
    dailyAvgDemand: 16.0,
    lastSaleDate: '2026-08-13',
    lastRestockDate: '2026-08-05'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-101',
    productId: 'prod-1',
    productName: 'Smart Ergonomic Wireless Mouse X1',
    sku: 'WM-001',
    type: 'IN',
    quantity: 50,
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    locationRef: 'A-03-S-02-B-14',
    referenceDoc: 'PO-2026-0012',
    performedBy: 'Marcus Vance',
    timestamp: '2026-08-05T09:30:00Z',
    notes: 'Received initial shipment from supplier'
  },
  {
    id: 'mov-102',
    productId: 'prod-1',
    productName: 'Smart Ergonomic Wireless Mouse X1',
    sku: 'WM-001',
    type: 'OUT',
    quantity: 15,
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    locationRef: 'A-03-S-02-B-14',
    referenceDoc: 'SO-2026-1088',
    performedBy: 'Elena Rostova',
    timestamp: '2026-08-10T14:15:00Z',
    notes: 'Dispatched client corporate order'
  },
  {
    id: 'mov-103',
    productId: 'prod-1',
    productName: 'Smart Ergonomic Wireless Mouse X1',
    sku: 'WM-001',
    type: 'DAMAGED',
    quantity: 2,
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    locationRef: 'A-03-S-02-B-14',
    referenceDoc: 'INSP-2026-04',
    performedBy: 'Elena Rostova',
    timestamp: '2026-08-11T11:00:00Z',
    notes: 'Water damaged outer box during rainfall unloading'
  },
  {
    id: 'mov-104',
    productId: 'prod-2',
    productName: 'Mechanical RGB Gaming Keyboard (Tactile)',
    sku: 'KB-Mech-RGB',
    type: 'IN',
    quantity: 100,
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    locationRef: 'A-04-S-01-B-05',
    referenceDoc: 'PO-2026-0010',
    performedBy: 'Marcus Vance',
    timestamp: '2026-08-01T10:00:00Z',
    notes: 'Restock completed'
  },
  {
    id: 'mov-105',
    productId: 'prod-8',
    productName: 'Braided USB-C to USB-C Cable 240W (2m)',
    sku: 'CABLE-USBC-2M',
    type: 'TRANSFER_OUT',
    quantity: 50,
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    locationRef: 'A-02-S-01-B-08',
    referenceDoc: 'TR-2026-003',
    performedBy: 'Nikita Chaudhari',
    timestamp: '2026-08-12T16:20:00Z',
    notes: 'Inter-warehouse balancing transfer to East Coast'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-0012',
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    orderDate: '2026-08-01',
    expectedDeliveryDate: '2026-08-06',
    actualDeliveryDate: '2026-08-05',
    items: [
      { productId: 'prod-1', productName: 'Smart Ergonomic Wireless Mouse X1', sku: 'WM-001', unitPrice: 18.50, orderedQty: 100, receivedQty: 100 },
      { productId: 'prod-3', productName: 'Thunderbolt 4 12-in-1 Docking Station', sku: 'DOCK-TH4', unitPrice: 95.00, orderedQty: 50, receivedQty: 50 }
    ],
    totalAmount: 6600.00,
    status: 'Received',
    notes: 'Urgent restocking order',
    createdBy: 'Nikita Chaudhari'
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-0019',
    supplierId: 'sup-1',
    supplierName: 'Apex Electronics Global',
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    orderDate: '2026-08-11',
    expectedDeliveryDate: '2026-08-16',
    items: [
      { productId: 'prod-1', productName: 'Smart Ergonomic Wireless Mouse X1', sku: 'WM-001', unitPrice: 18.50, orderedQty: 150, receivedQty: 0 },
      { productId: 'prod-3', productName: 'Thunderbolt 4 12-in-1 Docking Station', sku: 'DOCK-TH4', unitPrice: 95.00, orderedQty: 80, receivedQty: 0 }
    ],
    totalAmount: 10375.00,
    status: 'Approved',
    notes: 'Automated reorder recommendation generated by SmartWare ML Engine',
    createdBy: 'Nikita Chaudhari'
  }
];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-1',
    soNumber: 'SO-2026-1088',
    customerName: 'TechCorp Solutions Inc',
    customerEmail: 'procurement@techcorp.com',
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    orderDate: '2026-08-10',
    dispatchDate: '2026-08-10',
    items: [
      { productId: 'prod-1', productName: 'Smart Ergonomic Wireless Mouse X1', sku: 'WM-001', unitPrice: 39.99, orderedQty: 15 },
      { productId: 'prod-2', productName: 'Mechanical RGB Gaming Keyboard (Tactile)', sku: 'KB-Mech-RGB', unitPrice: 89.99, orderedQty: 10 }
    ],
    totalAmount: 1499.75,
    grossProfit: 727.25,
    status: 'Dispatched',
    createdBy: 'Marcus Vance'
  },
  {
    id: 'so-2',
    soNumber: 'SO-2026-1092',
    customerName: 'NexGen Office Systems',
    customerEmail: 'orders@nexgenoffice.org',
    warehouseId: 'wh-1',
    warehouseName: 'Alpha Logistics Center',
    orderDate: '2026-08-12',
    items: [
      { productId: 'prod-5', productName: 'ErgoPro Mesh Executive Task Chair', sku: 'CHAIR-ERGO-PRO', unitPrice: 349.00, orderedQty: 5 },
      { productId: 'prod-3', productName: 'Thunderbolt 4 12-in-1 Docking Station', sku: 'DOCK-TH4', unitPrice: 179.99, orderedQty: 3 }
    ],
    totalAmount: 2284.97,
    grossProfit: 950.00,
    status: 'Picking',
    createdBy: 'Elena Rostova'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransfer[] = [
  {
    id: 'tr-1',
    transferNumber: 'TR-2026-003',
    sourceWarehouseId: 'wh-1',
    sourceWarehouseName: 'Alpha Logistics Center',
    destWarehouseId: 'wh-2',
    destWarehouseName: 'East Coast Distribution Hub',
    items: [
      { productId: 'prod-8', productName: 'Braided USB-C to USB-C Cable 240W (2m)', sku: 'CABLE-USBC-2M', quantity: 50 }
    ],
    status: 'In Transit',
    requestedBy: 'Nikita Chaudhari',
    requestDate: '2026-08-12',
    notes: 'Inter-warehouse stock balancing for East Coast surge demand'
  }
];

export const INITIAL_RETURNS: ReturnItem[] = [
  {
    id: 'ret-1',
    returnNumber: 'RET-2026-001',
    type: 'Customer',
    orderRef: 'SO-2026-1088',
    productId: 'prod-2',
    productName: 'Mechanical RGB Gaming Keyboard (Tactile)',
    sku: 'KB-Mech-RGB',
    quantity: 2,
    reason: 'Damaged',
    action: 'Replace',
    status: 'Approved',
    date: '2026-08-12',
    reportedBy: 'Marcus Vance'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-08-13T01:45:10Z',
    user: 'Nikita Chaudhari',
    userRole: 'Admin',
    action: 'AI Demand Prediction Execution',
    category: 'System',
    details: 'Ran 30-day forecast engine across 8 products. 2 shortage warnings flagged.',
    ipAddress: '192.168.1.45'
  },
  {
    id: 'aud-2',
    timestamp: '2026-08-12T16:20:00Z',
    user: 'Nikita Chaudhari',
    userRole: 'Admin',
    action: 'Initiated Stock Transfer TR-2026-003',
    category: 'Transfer',
    details: 'Transferred 50 units of CABLE-USBC-2M from Alpha Logistics to East Coast Hub.',
    ipAddress: '192.168.1.45'
  },
  {
    id: 'aud-3',
    timestamp: '2026-08-11T11:00:00Z',
    user: 'Elena Rostova',
    userRole: 'Warehouse Staff',
    action: 'Marked Damaged Stock',
    category: 'Inventory',
    details: 'Logged 2 damaged units for WM-001 due to outer box water damage.',
    ipAddress: '10.0.4.12'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    type: 'critical',
    title: '🚨 High Shortage Risk: Wireless Mouse X1',
    message: 'Current stock is 35 units. Daily sales avg is 8.0/day. Expected stock depletion in 4.3 days! Supplier lead time is 5 days.',
    timestamp: '2026-08-13T02:00:00Z',
    read: false,
    linkTab: 'predictions',
    productId: 'prod-1'
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: '⚠️ Expiring Product: Vitamin C 1000mg',
    message: 'Batch PH-2026-V8 (420 boxes) expires on 2026-08-25 (12 days left!). Recommend promotional discount.',
    timestamp: '2026-08-12T18:30:00Z',
    read: false,
    linkTab: 'inventory',
    productId: 'prod-6'
  },
  {
    id: 'notif-3',
    type: 'warning',
    title: '⚠️ Dead Stock Flagged: Legacy 720p Webcam',
    message: 'Stock holding is 145 units with only 3 sales in the last 90 days. Health score dropped to 28/100.',
    timestamp: '2026-08-11T09:15:00Z',
    read: true,
    linkTab: 'health',
    productId: 'prod-4'
  },
  {
    id: 'notif-4',
    type: 'info',
    title: '📦 PO Approved: PO-2026-0019',
    message: 'Purchase Order PO-2026-0019 to Apex Electronics approved ($10,375.00). Expected delivery Aug 16.',
    timestamp: '2026-08-11T14:00:00Z',
    read: true,
    linkTab: 'purchases'
  }
];
