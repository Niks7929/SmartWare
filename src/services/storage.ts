import {
  Product,
  Warehouse,
  Supplier,
  StockMovement,
  PurchaseOrder,
  SalesOrder,
  StockTransfer,
  ReturnItem,
  AuditLog,
  SystemNotification,
  User,
  Role
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_SUPPLIERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES_ORDERS,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_RETURNS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS
} from '../data/mockData';

const KEYS = {
  PRODUCTS: 'smartware_products_v1',
  WAREHOUSES: 'smartware_warehouses_v1',
  SUPPLIERS: 'smartware_suppliers_v1',
  MOVEMENTS: 'smartware_movements_v1',
  PURCHASES: 'smartware_purchases_v1',
  SALES: 'smartware_sales_v1',
  TRANSFERS: 'smartware_transfers_v1',
  RETURNS: 'smartware_returns_v1',
  AUDITS: 'smartware_audits_v1',
  NOTIFICATIONS: 'smartware_notifications_v1',
  CURRENT_USER: 'smartware_current_user_v1',
  ACTIVE_WAREHOUSE: 'smartware_active_wh_v1'
};

export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }
  }

  // Reset to default seed
  static resetToDefault(): void {
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.WAREHOUSES);
    localStorage.removeItem(KEYS.SUPPLIERS);
    localStorage.removeItem(KEYS.MOVEMENTS);
    localStorage.removeItem(KEYS.PURCHASES);
    localStorage.removeItem(KEYS.SALES);
    localStorage.removeItem(KEYS.TRANSFERS);
    localStorage.removeItem(KEYS.RETURNS);
    localStorage.removeItem(KEYS.AUDITS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.ACTIVE_WAREHOUSE);
  }

  // Users & Role
  static getCurrentUser(): User {
    return this.getItem<User>(KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  static setCurrentUser(user: User): void {
    this.setItem(KEYS.CURRENT_USER, user);
  }

  static switchUserRole(role: Role): User {
    const found = INITIAL_USERS.find(u => u.role === role) || {
      id: `usr-${Date.now()}`,
      name: `User (${role})`,
      email: `${role.toLowerCase().replace(/\s+/g, '')}@smartware.io`,
      role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };
    this.setCurrentUser(found);
    return found;
  }

  // Active Warehouse
  static getActiveWarehouseId(): string {
    return this.getItem<string>(KEYS.ACTIVE_WAREHOUSE, 'ALL');
  }

  static setActiveWarehouseId(id: string): void {
    this.setItem(KEYS.ACTIVE_WAREHOUSE, id);
  }

  // Products
  static getProducts(): Product[] {
    return this.getItem<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static saveProducts(products: Product[]): void {
    this.setItem(KEYS.PRODUCTS, products);
  }

  static addProduct(product: Product, user: User): void {
    const products = this.getProducts();
    products.unshift(product);
    this.saveProducts(products);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Created Product',
      category: 'Inventory',
      details: `Added new product SKU: ${product.sku} (${product.name}) with stock ${product.currentStock}.`
    });
  }

  static updateProduct(product: Product, user: User): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      products[idx] = { ...product, updatedAt: new Date().toISOString() };
      this.saveProducts(products);

      this.addAuditLog({
        user: user.name,
        userRole: user.role,
        action: 'Updated Product Details',
        category: 'Inventory',
        details: `Updated details/pricing for ${product.sku} (${product.name}).`
      });
    }
  }

  static adjustProductStock(
    productId: string,
    warehouseId: string,
    delta: number,
    movementType: 'IN' | 'OUT' | 'DAMAGED' | 'EXPIRED' | 'ADJUSTMENT',
    user: User,
    notes?: string,
    refDoc?: string
  ): void {
    const products = this.getProducts();
    const warehouses = this.getWarehouses();
    const product = products.find(p => p.id === productId);
    const warehouse = warehouses.find(w => w.id === warehouseId);

    if (!product || !warehouse) return;

    const oldQty = product.currentStock;
    const newQty = Math.max(0, oldQty + delta);
    product.currentStock = newQty;
    product.updatedAt = new Date().toISOString();

    // Update location quantity
    let loc = product.locations.find(l => l.warehouseId === warehouseId);
    if (!loc) {
      loc = {
        warehouseId,
        warehouseName: warehouse.name,
        rack: 'A-01',
        shelf: 'S-01',
        bin: 'B-01',
        quantity: 0
      };
      product.locations.push(loc);
    }
    loc.quantity = Math.max(0, loc.quantity + delta);

    this.saveProducts(products);

    // Record Stock Movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: movementType,
      quantity: Math.abs(delta),
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      locationRef: `${loc.rack}-${loc.shelf}-${loc.bin}`,
      referenceDoc: refDoc || 'MANUAL-ADJ',
      performedBy: user.name,
      timestamp: new Date().toISOString(),
      notes: notes || `Manual stock adjust (${delta > 0 ? '+' : ''}${delta})`
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    this.saveMovements(movements);

    // Audit Log
    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: `Stock Adjustment (${movementType})`,
      category: 'Inventory',
      details: `${product.sku}: ${oldQty} → ${newQty} (${delta > 0 ? '+' : ''}${delta}) at ${warehouse.name}. ${notes || ''}`
    });
  }

  // Warehouses
  static getWarehouses(): Warehouse[] {
    return this.getItem<Warehouse[]>(KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
  }

  static saveWarehouses(warehouses: Warehouse[]): void {
    this.setItem(KEYS.WAREHOUSES, warehouses);
  }

  // Suppliers
  static getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    this.setItem(KEYS.SUPPLIERS, suppliers);
  }

  static addSupplier(supplier: Supplier, user: User): void {
    const suppliers = this.getSuppliers();
    suppliers.unshift(supplier);
    this.saveSuppliers(suppliers);
    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Added Supplier',
      category: 'Purchase',
      details: `Added new supplier ${supplier.name} (${supplier.code}).`
    });
  }

  // Stock Movements
  static getMovements(): StockMovement[] {
    return this.getItem<StockMovement[]>(KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  }

  static saveMovements(movements: StockMovement[]): void {
    this.setItem(KEYS.MOVEMENTS, movements);
  }

  // Purchase Orders
  static getPurchaseOrders(): PurchaseOrder[] {
    return this.getItem<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASE_ORDERS);
  }

  static savePurchaseOrders(pos: PurchaseOrder[]): void {
    this.setItem(KEYS.PURCHASES, pos);
  }

  static createPurchaseOrder(po: PurchaseOrder, user: User): void {
    const pos = this.getPurchaseOrders();
    pos.unshift(po);
    this.savePurchaseOrders(pos);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Created Purchase Order',
      category: 'Purchase',
      details: `Created PO ${po.poNumber} to ${po.supplierName} for total $${po.totalAmount.toFixed(2)}.`
    });
  }

  static receivePurchaseOrder(poId: string, user: User): void {
    const pos = this.getPurchaseOrders();
    const po = pos.find(p => p.id === poId);
    if (!po || po.status === 'Received') return;

    po.status = 'Received';
    po.actualDeliveryDate = new Date().toISOString().split('T')[0];

    // Automatically increase stock for each item in the PO
    po.items.forEach(item => {
      item.receivedQty = item.orderedQty;
      this.adjustProductStock(
        item.productId,
        po.warehouseId,
        item.orderedQty,
        'IN',
        user,
        `Goods Received via ${po.poNumber}`,
        po.poNumber
      );
    });

    this.savePurchaseOrders(pos);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Received Purchase Order',
      category: 'Purchase',
      details: `Fulfilled and received all items for PO ${po.poNumber} into ${po.warehouseName}.`
    });
  }

  // Sales Orders
  static getSalesOrders(): SalesOrder[] {
    return this.getItem<SalesOrder[]>(KEYS.SALES, INITIAL_SALES_ORDERS);
  }

  static saveSalesOrders(sos: SalesOrder[]): void {
    this.setItem(KEYS.SALES, sos);
  }

  static createSalesOrder(so: SalesOrder, user: User): void {
    const sos = this.getSalesOrders();
    sos.unshift(so);
    this.saveSalesOrders(sos);

    // Auto deduct stock if dispatched immediately or set to picking
    if (so.status === 'Dispatched') {
      so.items.forEach(item => {
        this.adjustProductStock(
          item.productId,
          so.warehouseId,
          -item.orderedQty,
          'OUT',
          user,
          `Dispatched for Sales Order ${so.soNumber}`,
          so.soNumber
        );
      });
    }

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Created Sales Order',
      category: 'Sales',
      details: `Created Sales Order ${so.soNumber} for ${so.customerName} ($${so.totalAmount.toFixed(2)}).`
    });
  }

  static dispatchSalesOrder(soId: string, user: User): void {
    const sos = this.getSalesOrders();
    const so = sos.find(s => s.id === soId);
    if (!so || so.status === 'Dispatched') return;

    so.status = 'Dispatched';
    so.dispatchDate = new Date().toISOString().split('T')[0];

    so.items.forEach(item => {
      this.adjustProductStock(
        item.productId,
        so.warehouseId,
        -item.orderedQty,
        'OUT',
        user,
        `Dispatched for Sales Order ${so.soNumber}`,
        so.soNumber
      );
    });

    this.saveSalesOrders(sos);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Dispatched Sales Order',
      category: 'Sales',
      details: `Dispatched SO ${so.soNumber} to ${so.customerName}. Stock deducted.`
    });
  }

  // Stock Transfers
  static getTransfers(): StockTransfer[] {
    return this.getItem<StockTransfer[]>(KEYS.TRANSFERS, INITIAL_STOCK_TRANSFERS);
  }

  static saveTransfers(transfers: StockTransfer[]): void {
    this.setItem(KEYS.TRANSFERS, transfers);
  }

  static createTransfer(transfer: StockTransfer, user: User): void {
    const transfers = this.getTransfers();
    transfers.unshift(transfer);
    this.saveTransfers(transfers);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Requested Stock Transfer',
      category: 'Transfer',
      details: `Created transfer ${transfer.transferNumber} from ${transfer.sourceWarehouseName} to ${transfer.destWarehouseName}.`
    });
  }

  static completeTransfer(transferId: string, user: User): void {
    const transfers = this.getTransfers();
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer || transfer.status === 'Completed') return;

    transfer.status = 'Completed';
    transfer.completedDate = new Date().toISOString().split('T')[0];

    // Deduct from source warehouse, add to destination warehouse
    transfer.items.forEach(item => {
      // Transfer Out from source
      this.adjustProductStock(
        item.productId,
        transfer.sourceWarehouseId,
        -item.quantity,
        'TRANSFER_OUT',
        user,
        `Transfer ${transfer.transferNumber} to ${transfer.destWarehouseName}`,
        transfer.transferNumber
      );
      // Transfer In to destination
      this.adjustProductStock(
        item.productId,
        transfer.destWarehouseId,
        item.quantity,
        'TRANSFER_IN',
        user,
        `Transfer ${transfer.transferNumber} from ${transfer.sourceWarehouseName}`,
        transfer.transferNumber
      );
    });

    this.saveTransfers(transfers);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Completed Stock Transfer',
      category: 'Transfer',
      details: `Finalized inter-warehouse transfer ${transfer.transferNumber}. Stocks updated.`
    });
  }

  // Returns
  static getReturns(): ReturnItem[] {
    return this.getItem<ReturnItem[]>(KEYS.RETURNS, INITIAL_RETURNS);
  }

  static saveReturns(returns: ReturnItem[]): void {
    this.setItem(KEYS.RETURNS, returns);
  }

  static addReturn(returnItem: ReturnItem, user: User): void {
    const returns = this.getReturns();
    returns.unshift(returnItem);
    this.saveReturns(returns);

    this.addAuditLog({
      user: user.name,
      userRole: user.role,
      action: 'Logged Stock Return',
      category: 'Inventory',
      details: `Logged ${returnItem.type} return ${returnItem.returnNumber} (${returnItem.quantity}x ${returnItem.sku} - Reason: ${returnItem.reason}).`
    });
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(KEYS.AUDITS, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: entry.user,
      userRole: entry.userRole,
      action: entry.action,
      category: entry.category,
      details: entry.details,
      ipAddress: entry.ipAddress || '127.0.0.1'
    };
    logs.unshift(newLog);
    this.setItem(KEYS.AUDITS, logs);
  }

  // Notifications
  static getNotifications(): SystemNotification[] {
    return this.getItem<SystemNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(notifications: SystemNotification[]): void {
    this.setItem(KEYS.NOTIFICATIONS, notifications);
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveNotifications(list);
    }
  }

  static markAllNotificationsRead(): void {
    const list = this.getNotifications();
    list.forEach(n => (n.read = true));
    this.saveNotifications(list);
  }
}
