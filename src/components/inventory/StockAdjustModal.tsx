import React, { useState } from 'react';
import { X, Sliders, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product, Warehouse, MovementType } from '../../types';

interface StockAdjustModalProps {
  product: Product | null;
  warehouses: Warehouse[];
  onClose: () => void;
  onConfirm: (
    productId: string,
    warehouseId: string,
    delta: number,
    type: 'IN' | 'OUT' | 'DAMAGED' | 'EXPIRED' | 'ADJUSTMENT',
    notes: string
  ) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  warehouses,
  onClose,
  onConfirm,
}) => {
  const [warehouseId, setWarehouseId] = useState<string>('wh-1');
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'DAMAGED' | 'EXPIRED' | 'ADJUSTMENT'>('IN');
  const [qty, setQty] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const delta = (movementType === 'IN' || movementType === 'RETURN') ? qty : -qty;
    onConfirm(product.id, warehouseId, delta, movementType, notes.trim() || `Manual stock update (${movementType})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Manual Stock Adjustment</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <p className="font-bold text-sm text-white">{product.name}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              SKU: <span className="text-indigo-400 font-bold">{product.sku}</span> | Current Total Stock: {product.currentStock} {product.unit}
            </p>
          </div>

          <div>
            <label className="block text-slate-400 font-mono font-bold mb-1">Target Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono font-bold mb-1">Adjustment Action Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('IN')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'IN' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Goods IN / Receive
              </button>

              <button
                type="button"
                onClick={() => setMovementType('OUT')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'OUT' ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Goods OUT / Pick
              </button>

              <button
                type="button"
                onClick={() => setMovementType('DAMAGED')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'DAMAGED' ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Mark Damaged
              </button>

              <button
                type="button"
                onClick={() => setMovementType('EXPIRED')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'EXPIRED' ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Scrap Expired
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono font-bold mb-1">Quantity ({product.unit})</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-base font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono font-bold mb-1">Reason / Reference Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unpacking audit check or client rush request"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
            >
              Confirm Adjustment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
