import React, { useState } from 'react';
import { ShoppingBag, Plus, CheckCircle2, Clock, Truck, Building2, PackageCheck } from 'lucide-react';
import { PurchaseOrder, Supplier, Warehouse, Product, User } from '../../types';

interface PurchaseOrderManagerProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  products: Product[];
  currentUser: User;
  onCreatePO: (po: PurchaseOrder) => void;
  onReceivePO: (poId: string) => void;
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({
  purchaseOrders,
  suppliers,
  warehouses,
  products,
  currentUser,
  onCreatePO,
  onReceivePO,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || 'sup-1');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [orderQty, setOrderQty] = useState(100);
  const [notes, setNotes] = useState('');

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    const wh = warehouses.find(w => w.id === selectedWarehouseId);
    const prod = products.find(p => p.id === selectedProductId);

    if (!sup || !wh || !prod) return;

    const unitPrice = prod.purchasePrice;
    const totalAmount = unitPrice * Number(orderQty);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      warehouseId: wh.id,
      warehouseName: wh.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + sup.leadTimeDays * 86400000).toISOString().split('T')[0],
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unitPrice,
          orderedQty: Number(orderQty),
          receivedQty: 0
        }
      ],
      totalAmount,
      status: 'Approved',
      notes: notes.trim() || 'Manual Purchase Order creation',
      createdBy: currentUser.name
    };

    onCreatePO(newPO);
    setShowModal(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Supplier Procurement & Purchase Orders (PO)
          </h2>
          <p className="text-xs text-slate-400">
            Supplier purchase orders, automated lead time tracking & 1-click receiving into warehouse stock
          </p>
        </div>

        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        )}
      </div>

      {/* PO List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Target Warehouse</th>
                <th className="px-4 py-3.5">Items & Order Qty</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No purchase orders recorded.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                      {po.poNumber}
                    </td>

                    <td className="px-4 py-3 font-medium text-white">
                      {po.supplierName}
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {po.warehouseName}
                    </td>

                    <td className="px-4 py-3">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="font-mono">
                          <span className="font-bold text-white">{item.sku}</span> ({item.orderedQty} units @ ${item.unitPrice.toFixed(2)})
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ${po.totalAmount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
                        po.status === 'Received' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        po.status === 'Approved' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {po.status !== 'Received' && currentUser.role !== 'Viewer' && (
                        <button
                          onClick={() => onReceivePO(po.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1 ml-auto"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Receive & Restock
                        </button>
                      )}
                      {po.status === 'Received' && (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ Goods Received</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                Issue New Supplier Purchase Order
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.leadTimeDays}d lead time)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Target Warehouse</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Product Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku} | Cost: ${p.purchasePrice})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Order Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Urgent restocking order"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
