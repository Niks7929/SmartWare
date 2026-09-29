import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { Product, Supplier } from '../../types';
import { HealthEngine } from '../../services/healthEngine';

interface StockHealthScoreViewProps {
  products: Product[];
  suppliers: Supplier[];
  onSelectProduct: (p: Product) => void;
}

export const StockHealthScoreView: React.FC<StockHealthScoreViewProps> = ({
  products,
  suppliers,
  onSelectProduct,
}) => {
  const supplierMap = new Map<string, Supplier>();
  suppliers.forEach(s => supplierMap.set(s.id, s));

  const healthScores = products.map(p => HealthEngine.calculateHealthScore(p, supplierMap.get(p.supplierId)));

  const avgScore = Math.round(healthScores.reduce((acc, h) => acc + h.overallScore, 0) / (healthScores.length || 1));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" />
          Smart Inventory Health Score Engine (0 - 100)
        </h2>
        <p className="text-xs text-slate-400">
          Algorithmic health score combining Stock Level + Demand Velocity + Expiry Risk + Lead Time Coverage + Dead Stock Risk
        </p>
      </div>

      {/* Executive Health Overview Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-indigo-500 flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-2xl font-extrabold text-white font-mono">{avgScore}</span>
            <span className="text-[10px] text-slate-400 font-mono">/ 100 AVG</span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Overall Warehouse Health Index</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {avgScore >= 80 ? '🟢 Warehouse inventory is operating in optimal health ranges.' : '🟠 Inventory needs attention regarding stockouts or dead stock.'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">🟢 {healthScores.filter(h => h.status === 'Healthy').length} Healthy</span>
              <span className="text-amber-400 font-bold">🟠 {healthScores.filter(h => h.status === 'Warning').length} Warning</span>
              <span className="text-rose-400 font-bold">🔴 {healthScores.filter(h => h.status === 'Critical').length} Critical</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs w-full md:w-auto">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-[10px] uppercase font-mono font-bold">Stock Level Weight</p>
            <p className="font-bold text-white text-sm">25%</p>
          </div>
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-[10px] uppercase font-mono font-bold">Demand Velocity</p>
            <p className="font-bold text-white text-sm">25%</p>
          </div>
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-[10px] uppercase font-mono font-bold">Expiry Margin</p>
            <p className="font-bold text-white text-sm">20%</p>
          </div>
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-[10px] uppercase font-mono font-bold">Dead Stock Risk</p>
            <p className="font-bold text-white text-sm">30%</p>
          </div>
        </div>
      </div>

      {/* Individual Product Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthScores.map(h => {
          const prod = products.find(p => p.id === h.productId);

          return (
            <div
              key={h.productId}
              onClick={() => prod && onSelectProduct(prod)}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">{h.productName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">SKU: {h.sku}</p>
                </div>
                <div className={`px-2.5 py-1 text-xs font-mono font-extrabold rounded-lg border ${
                  h.status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  h.status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                }`}>
                  {h.overallScore}/100
                </div>
              </div>

              {/* Sub Score Bars */}
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Stock Level:</span>
                  <span className="font-bold text-white">{h.subScores.stockLevelScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${h.subScores.stockLevelScore}%` }} />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Sales Velocity:</span>
                  <span className="font-bold text-white">{h.subScores.demandVelocityScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${h.subScores.demandVelocityScore}%` }} />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Expiry Margin:</span>
                  <span className="font-bold text-white">{h.subScores.expiryRiskScore}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${h.subScores.expiryRiskScore}%` }} />
                </div>
              </div>

              {/* Recommendations */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-indigo-200 bg-indigo-950/30 p-2 rounded border border-indigo-500/20 truncate">
                  💡 {h.recommendations[0] || 'Health status optimal.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
