import React, { useState } from 'react';
import { ArrowLeftRight, Plus, CheckCircle2, Clock, Truck, Building2, Layers } from 'lucide-react';
import { StockTransfer, Warehouse, Product, User } from '../../types';

interface StockTransferManagerProps {
  transfers: StockTransfer[];
  warehouses: Warehouse[];
  products: Product[];
  currentUser: User;
  onCreateTransfer: (t: StockTransfer) => void;
  onCompleteTransfer: (id: string) => void;
}

export const StockTransferManager: React.FC<StockTransferManagerProps> = ({
  transfers,
  warehouses,
  products,
  currentUser,
  onCreateTransfer,
  onCompleteTransfer,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [sourceWH, setSourceWH] = useState(warehouses[0]?.id || 'wh-1');
  const [destWH, setDestWH] = useState(warehouses[1]?.id || 'wh-2');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(20);
  const [notes, setNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceWH === destWH) {
      alert('Source and Destination warehouses must be different!');
      return;
    }

    const srcObj = warehouses.find(w => w.id === sourceWH);
    const destObj = warehouses.find(w => w.id === destWH);
    const prodObj = products.find(p => p.id === selectedProductId);

    if (!srcObj || !destObj || !prodObj) return;

    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      sourceWarehouseId: srcObj.id,
      sourceWarehouseName: srcObj.name,
      destWarehouseId: destObj.id,
      destWarehouseName: destObj.name,
      items: [
        {
          productId: prodObj.id,
          productName: prodObj.name,
          sku: prodObj.sku,
          quantity: Number(transferQty)
        }
      ],
      status: 'In Transit',
      requestedBy: currentUser.name,
      requestDate: new Date().toISOString().split('T')[0],
      notes: notes.trim() || 'Inter-warehouse stock balancing transfer'
    };

    onCreateTransfer(newTransfer);
    setShowModal(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
            Inter-Warehouse Stock Transfers
          </h2>
          <p className="text-xs text-slate-400">
            Rebalance inventory between hubs, track transfers in transit & auto-update warehouse stock
          </p>
        </div>

        {currentUser.role !== 'Viewer' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Request New Stock Transfer
          </button>
        )}
      </div>

      {/* Transfer List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Transfer Ref #</th>
                <th className="px-4 py-3.5">Route (Source → Destination)</th>
                <th className="px-4 py-3.5">Items & Quantity</th>
                <th className="px-4 py-3.5">Requested By & Date</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No active stock transfers recorded.
                  </td>
                </tr>
              ) : (
                transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                      {tr.transferNumber}
                    </td>

                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{tr.sourceWarehouseName}</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{tr.destWarehouseName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {tr.items.map((item, idx) => (
                        <div key={idx} className="font-mono">
                          <span className="font-bold text-white">{item.sku}</span> ({item.quantity} units)
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      <p className="font-medium text-slate-200">{tr.requestedBy}</p>
                      <p className="text-[10px] font-mono">{tr.requestDate}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
                        tr.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        tr.status === 'In Transit' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {tr.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {tr.status === 'In Transit' && currentUser.role !== 'Viewer' && (
                        <button
                          onClick={() => onCompleteTransfer(tr.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Receive & Balance
                        </button>
                      )}
                      {tr.status === 'Completed' && (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ Balances Updated</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                Initiate Inter-Warehouse Stock Transfer
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Source Warehouse (FROM)</label>
                  <select
                    value={sourceWH}
                    onChange={(e) => setSourceWH(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono font-bold mb-1">Destination (TO)</label>
                  <select
                    value={destWH}
                    onChange={(e) => setDestWH(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Select Product to Transfer</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku} | Total Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Transfer Purpose / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Surge demand balancing or stock re-allocation"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                >
                  Dispatch Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
