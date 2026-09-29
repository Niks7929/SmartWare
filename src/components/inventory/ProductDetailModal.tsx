import React from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Activity,
  History,
  QrCode,
  Tag,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Product, Warehouse, Supplier, StockMovement } from '../../types';
import { HealthEngine } from '../../services/healthEngine';
import { PredictionEngine } from '../../services/predictionEngine';

interface ProductDetailModalProps {
  product: Product | null;
  warehouses: Warehouse[];
  suppliers: Supplier[];
  movements: StockMovement[];
  onClose: () => void;
  onOpenQR: (p: Product) => void;
  onOpenAdjust: (p: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  warehouses,
  suppliers,
  movements,
  onClose,
  onOpenQR,
  onOpenAdjust,
}) => {
  if (!product) return null;

  const supplier = suppliers.find(s => s.id === product.supplierId);
  const health = HealthEngine.calculateHealthScore(product, supplier);
  const pred = PredictionEngine.calculatePrediction(product, supplier);
  const prodMovements = movements.filter(m => m.productId === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold">
              {product.sku.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{product.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 rounded font-bold">
                  {product.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                SKU: <span className="text-indigo-400 font-bold">{product.sku}</span> | Barcode: {product.barcode} | Brand: {product.brand}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs / Scroll area */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Stock Level</p>
              <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                {product.currentStock} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Reorder Level: {product.reorderLevel}</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Health Score</p>
              <p className={`text-xl font-extrabold font-mono mt-0.5 ${
                health.overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {health.overallScore} / 100
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{health.status} Status</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Daily Sales Avg</p>
              <p className="text-xl font-extrabold text-indigo-400 font-mono mt-0.5">
                {pred.dailyAvgDemand} <span className="text-xs font-normal text-slate-400">/ day</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">30D Total: {product.salesLast30Days}</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Est Stock Duration</p>
              <p className={`text-xl font-extrabold font-mono mt-0.5 ${
                pred.estimatedDaysRemaining <= (supplier?.leadTimeDays || 5) ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {pred.estimatedDaysRemaining} <span className="text-xs font-normal text-slate-400">days</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Lead Time: {supplier?.leadTimeDays || 5} days</p>
            </div>
          </div>

          {/* AI Reorder & Shortage Analysis Box */}
          <div className="p-4 rounded-xl bg-slate-850 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Reorder Recommendation & Demand Engine
              </h4>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                pred.shortageRisk === 'High Shortage Risk' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                Risk: {pred.shortageRisk}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-slate-400 font-mono text-[10px]">Predicted 7-Day Demand</p>
                <p className="font-bold text-white text-sm font-mono mt-0.5">{pred.predictedDemand7Days} units</p>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-slate-400 font-mono text-[10px]">Safety Stock Buffer</p>
                <p className="font-bold text-white text-sm font-mono mt-0.5">{pred.safetyStock} units</p>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-slate-400 font-mono text-[10px]">Recommended Reorder Qty</p>
                <p className="font-bold text-emerald-400 text-sm font-mono mt-0.5">{pred.recommendedOrderQty} units</p>
              </div>
            </div>

            {/* Health Engine Issues/Recommendations */}
            <div className="space-y-1.5 pt-1 text-xs">
              <p className="font-bold text-slate-300">SmartWare Insights:</p>
              {health.recommendations.map((rec, idx) => (
                <p key={idx} className="text-indigo-200 bg-indigo-950/40 p-2 rounded border border-indigo-500/20 flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span> {rec}
                </p>
              ))}
            </div>
          </div>

          {/* Warehouse Rack / Shelf / Bin Allocation Map */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Warehouse Location & Location Breakdown
            </h4>
            <div className="space-y-2">
              {product.locations.map((loc, idx) => (
                <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{loc.warehouseName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Rack: <span className="text-indigo-300 font-bold">{loc.rack}</span> | Shelf: <span className="text-indigo-300 font-bold">{loc.shelf}</span> | Bin: <span className="text-indigo-300 font-bold">{loc.bin}</span>
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    {loc.quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Batch & Expiry Info */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Batch Numbers & Expiry Schedule
            </h4>
            <div className="space-y-2">
              {product.batches.map((batch, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-white">{batch.batchNumber}</span>
                    <p className="text-[10px] text-slate-400">Mfg: {batch.manufactureDate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold">Expires: {batch.expiryDate}</span>
                    <p className="text-[10px] text-slate-400">{batch.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Movement History Log for this item */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-400" />
              Recent Movement Audit Trail for {product.sku}
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {prodMovements.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No recorded movements for this product yet.</p>
              ) : (
                prodMovements.map(m => (
                  <div key={m.id} className="p-2 bg-slate-900 rounded border border-slate-800 text-xs flex items-center justify-between font-mono">
                    <div>
                      <span className="font-bold text-white">{m.type}</span> ({m.referenceDoc})
                      <p className="text-[10px] text-slate-400">{m.notes}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-300">{m.quantity} units</span>
                      <p className="text-[10px] text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onOpenQR(product)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4 text-indigo-400" /> Print Label Badge
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenAdjust(product)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
            >
              Adjust Stock
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
