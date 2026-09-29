import React, { useState } from 'react';
import { RotateCcw, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReturnItem, Product, User } from '../../types';

interface ReturnManagerProps {
  returns: ReturnItem[];
  products: Product[];
  currentUser: User;
  onAddReturn: (ret: ReturnItem) => void;
}

export const ReturnManager: React.FC<ReturnManagerProps> = ({
  returns,
  products,
  currentUser,
  onAddReturn,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'Customer' | 'Supplier'>('Customer');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'Damaged' | 'Defective' | 'Wrong Product' | 'Expired' | 'Overstock'>('Damaged');
  const [action, setAction] = useState<'Replace' | 'Refund' | 'Repair' | 'Quarantine'>('Replace');
  const [orderRef, setOrderRef] = useState('SO-2026-1088');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newRet: ReturnItem = {
      id: `ret-${Date.now()}`,
      returnNumber: `RET-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type,
      orderRef,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: Number(quantity),
      reason,
      action,
      status: 'Approved',
      date: new Date().toISOString().split('T')[0],
      reportedBy: currentUser.name
    };

    onAddReturn(newRet);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-amber-400" />
            Returns & Damaged / Quarantine Stock Management
          </h2>
          <p className="text-xs text-slate-400">
            Handle customer/supplier returns, defective items, replacements & quarantine segregation
          </p>
        </div>

        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Log New Return
          </button>
        )}
      </div>

      {/* Return List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Return #</th>
                <th className="px-4 py-3.5">Type & Order Ref</th>
                <th className="px-4 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5 text-center">Qty</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Remedial Action</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No returns logged.
                  </td>
                </tr>
              ) : (
                returns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-300">
                      {ret.returnNumber}
                    </td>

                    <td className="px-4 py-3 font-medium text-white">
                      <p>{ret.type} Return</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {ret.orderRef}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{ret.productName}</p>
                      <p className="text-[10px] font-mono text-indigo-300">SKU: {ret.sku}</p>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                      {ret.quantity}
                    </td>

                    <td className="px-4 py-3 text-rose-300 font-medium">
                      {ret.reason}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                      {ret.action}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Log Return Item
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Return Source</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Customer">Customer Return</option>
                    <option value="Supplier">Supplier Return</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Order / PO Reference</label>
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Select Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Return Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Defective">Defective</option>
                    <option value="Wrong Product">Wrong Product</option>
                    <option value="Expired">Expired</option>
                    <option value="Overstock">Overstock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Action to Take</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Replace">Replace Item</option>
                    <option value="Refund">Refund Client</option>
                    <option value="Repair">Repair / Restock</option>
                    <option value="Quarantine">Quarantine Scrap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Quantity Returned</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow"
                >
                  Confirm Return Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
