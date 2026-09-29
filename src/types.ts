export type Role = 'Admin' | 'Warehouse Manager' | 'Warehouse Staff' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  warehouseId?: string; // Assigned warehouse if specific
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  capacityUnits: number;
  currentStockUnits: number;
  managerName: string;
  contactEmail: string;
  status: 'Active' | 'Maintenance' | 'Full';
}

export interface StockLocation {
  warehouseId: string;
  warehouseName: string;
  rack: string;    // e.g. "A-03"
  shelf: string;   // e.g. "S-02"
  bin: string;     // e.g. "B-14"
  quantity: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  rating: number; // 1-5
  address: string;
}

export interface BatchInfo {
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  warehouseId: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  unit: string; // e.g. "Pcs", "Boxes", "Kg"
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  supplierId: string;
  supplierName: string;
  locations: StockLocation[];
  batches: BatchInfo[];
  createdAt: string;
  updatedAt: string;
  // Computed fields / historical metrics
  salesLast30Days: number;
  salesLast60Days: number;
  salesLast90Days: number;
  dailyAvgDemand: number;
  lastSaleDate?: string;
  lastRestockDate?: string;
}

export type MovementType = 
  | 'IN'            // Goods Received / Purchase
  | 'OUT'           // Sales Dispatch / Order Fulfillment
  | 'DAMAGED'       // Quarantine / Damaged
  | 'EXPIRED'       // Scrapped due to expiry
  | 'RETURN'        // Customer return
  | 'TRANSFER_IN'   // Inter-warehouse transfer in
  | 'TRANSFER_OUT'  // Inter-warehouse transfer out
  | 'ADJUSTMENT';   // Manual inventory correction

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  locationRef?: string; // Rack-Shelf-Bin
  referenceDoc?: string; // PO-101, SO-202, TR-303
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  orderedQty: number;
  receivedQty: number;
}

export type POStatus = 'Draft' | 'Approved' | 'Ordered' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: POStatus;
  notes?: string;
  createdBy: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  orderedQty: number;
}

export type SOStatus = 'Pending' | 'Picking' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  customerEmail: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  dispatchDate?: string;
  items: SalesOrderItem[];
  totalAmount: number;
  grossProfit: number;
  status: SOStatus;
  createdBy: string;
}

export interface TransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

export type TransferStatus = 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destWarehouseId: string;
  destWarehouseName: string;
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string;
  requestDate: string;
  completedDate?: string;
  notes?: string;
}

export interface ReturnItem {
  id: string;
  returnNumber: string;
  type: 'Customer' | 'Supplier';
  orderRef: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reason: 'Damaged' | 'Defective' | 'Wrong Product' | 'Expired' | 'Overstock';
  action: 'Replace' | 'Refund' | 'Repair' | 'Quarantine';
  status: 'Pending' | 'Approved' | 'Processed';
  date: string;
  reportedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  category: 'Inventory' | 'Purchase' | 'Sales' | 'Transfer' | 'System' | 'User';
  details: string;
  ipAddress?: string;
}

export interface SystemNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
  productId?: string;
}

export interface StockHealthScore {
  productId: string;
  productName: string;
  sku: string;
  overallScore: number; // 0 - 100
  status: 'Healthy' | 'Warning' | 'Critical';
  subScores: {
    stockLevelScore: number;     // 0 - 100
    demandVelocityScore: number; // 0 - 100
    expiryRiskScore: number;     // 0 - 100
    leadTimeCoverageScore: number; // 0 - 100
    deadStockScore: number;      // 0 - 100
  };
  keyIssues: string[];
  recommendations: string[];
}

export interface DemandPrediction {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  dailyAvgDemand: number;
  predictedDemand7Days: number;
  predictedDemand14Days: number;
  predictedDemand30Days: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  estimatedDaysRemaining: number;
  shortageRisk: 'None' | 'Moderate' | 'High Shortage Risk' | 'Out of Stock';
  deadStockFlag: boolean;
  slowMovingFlag: boolean;
  fastMovingFlag: boolean;
  seasonalityFactor: number;
  confidenceScore: number; // e.g. 88%
}
