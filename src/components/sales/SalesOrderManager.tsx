import React, { useState } from 'react';
import { Truck, Plus, CheckCircle2, Clock, DollarSign, TrendingUp, Building2 } from 'lucide-react';
import { SalesOrder, Warehouse, Product, User } from '../../types';

interface SalesOrderManagerProps {
  salesOrders: SalesOrder[];
  warehouses: Warehouse[];
  products: Product[];
  currentUser: User;
  onCreateSO: (so: SalesOrder) => void;
  onDispatchSO: (soId: string) => void;
}

export const SalesOrderManager: React.FC<SalesOrderManagerProps> = ({
  salesOrders,
  warehouses,
  products,
  currentUser,
  onCreateSO,
  onDispatchSO,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [orderQty, setOrderQty] = useState(5);

  const handleCreateSO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Customer Name required');
      return;
    }

    const wh = warehouses.find(w => w.id === warehouseId);
    const prod = products.find(p => p.id === productId);
    if (!wh || !prod) return;

    if (prod.currentStock < orderQty) {
      alert(`Warning: Requested order (${orderQty}) exceeds current stock (${prod.currentStock}).`);
    }

    const unitPrice = prod.sellingPrice;
    const totalAmount = unitPrice * Number(orderQty);
    const grossProfit = (prod.sellingPrice - prod.purchasePrice) * Number(orderQty);

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      soNumber: `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || 'client@corporate.com',
      warehouseId: wh.id,
      warehouseName: wh.name,
      orderDate: new Date().toISOString().split('T')[0],
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unitPrice,
          orderedQty: Number(orderQty)
        }
      ],
      totalAmount,
      grossProfit,
      status: 'Picking',
      createdBy: currentUser.name
    };

    onCreateSO(newSO);
    setShowModal(false);
    setCustomerName('');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            Sales Orders & Dispatch Fulfillment
          </h2>
          <p className="text-xs text-slate-400">
            Client sales order creation, stock picking, dispatching & automatic gross profit computation
          </p>
        </div>

        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Sales Order
          </button>
        )}
      </div>

      {/* SO List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">SO Number</th>
                <th className="px-4 py-3.5">Customer & Email</th>
                <th className="px-4 py-3.5">Fulfillment Warehouse</th>
                <th className="px-4 py-3.5">Items & Qty</th>
                <th className="px-4 py-3.5 text-right">Total Revenue</th>
                <th className="px-4 py-3.5 text-right font-bold text-emerald-400">Gross Profit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {salesOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No sales orders recorded.
                  </td>
                </tr>
              ) : (
                salesOrders.map(so => (
                  <tr key={so.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                      {so.soNumber}
                    </td>

                    <td className="px-4 py-3 font-medium text-white">
                      <p>{so.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{so.customerEmail}</p>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {so.warehouseName}
                    </td>

                    <td className="px-4 py-3">
                      {so.items.map((item, idx) => (
                        <div key={idx} className="font-mono">
                          <span className="font-bold text-white">{item.sku}</span> ({item.orderedQty} units @ ${item.unitPrice.toFixed(2)})
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      ${so.totalAmount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      +${so.grossProfit.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
                        so.status === 'Dispatched' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        so.status === 'Picking' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {so.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {so.status !== 'Dispatched' && currentUser.role !== 'Viewer' && (
                        <button
                          onClick={() => onDispatchSO(so.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5" /> Dispatch Order
                        </button>
                      )}
                      {so.status === 'Dispatched' && (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ Dispatched</span>
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
                <Truck className="w-5 h-5 text-indigo-400" />
                Create New Client Sales Order
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSO} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. TechCorp Solutions Inc"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="orders@client.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Fulfillment Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Product Item</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.sellingPrice})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold"
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
                  Save Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
