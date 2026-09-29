import React from 'react';
import {
  Boxes,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  PackagePlus,
  QrCode,
  Sparkles,
  ArrowLeftRight,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  Flame,
  Skull,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Product, StockMovement, Warehouse, SystemNotification } from '../../types';
import { HealthEngine } from '../../services/healthEngine';
import { PredictionEngine } from '../../services/predictionEngine';

interface DashboardOverviewProps {
  products: Product[];
  warehouses: Warehouse[];
  movements: StockMovement[];
  notifications: SystemNotification[];
  onSelectTab: (tab: string) => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  warehouses,
  movements,
  notifications,
  onSelectTab,
  onOpenScanner,
  onOpenAddProduct,
}) => {

  // Computations
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalStockValuation = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);

  // Health Scores
  const healthScores = HealthEngine.calculateBatchHealthScores(products, []);
  const avgHealth = Math.round(healthScores.reduce((acc, h) => acc + h.overallScore, 0) / (totalProducts || 1));

  const healthyCount = healthScores.filter(h => h.status === 'Healthy').length;
  const warningCount = healthScores.filter(h => h.status === 'Warning').length;
  const criticalCount = healthScores.filter(h => h.status === 'Critical').length;

  // Shortage Risk & Out of Stock
  const predictions = PredictionEngine.calculateBatchPredictions(products, []);
  const shortageRiskCount = predictions.filter(p => p.shortageRisk === 'High Shortage Risk' || p.shortageRisk === 'Out of Stock').length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;

  // Pie chart data
  const healthPieData = [
    { name: 'Healthy (80-100)', value: healthyCount, color: '#10b981' },
    { name: 'Warning (50-79)', value: warningCount, color: '#f59e0b' },
    { name: 'Critical (0-49)', value: criticalCount, color: '#f43f5e' },
  ];

  // Category Valuation Bar chart data
  const categoryMap = new Map<string, { value: number; units: number }>();
  products.forEach(p => {
    const val = p.currentStock * p.sellingPrice;
    const curr = categoryMap.get(p.category) || { value: 0, units: 0 };
    categoryMap.set(p.category, { value: curr.value + val, units: curr.units + p.currentStock });
  });

  const categoryBarData = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat,
    Valuation: Math.round(val.value),
    StockUnits: val.units
  }));

  // Historical Sales Trend Simulation
  const salesTrendData = [
    { day: 'Aug 01', HistoricalSales: 320, ForecastedDemand: 310 },
    { day: 'Aug 03', HistoricalSales: 410, ForecastedDemand: 390 },
    { day: 'Aug 05', HistoricalSales: 380, ForecastedDemand: 420 },
    { day: 'Aug 07', HistoricalSales: 520, ForecastedDemand: 490 },
    { day: 'Aug 09', HistoricalSales: 490, ForecastedDemand: 510 },
    { day: 'Aug 11', HistoricalSales: 610, ForecastedDemand: 580 },
    { day: 'Aug 13 (Today)', HistoricalSales: 680, ForecastedDemand: 650 },
    { day: 'Aug 15 (AI)', ForecastedDemand: 720 },
    { day: 'Aug 17 (AI)', ForecastedDemand: 780 },
    { day: 'Aug 19 (AI)', ForecastedDemand: 810 },
  ];

  return (
    <div className="space-y-6">

      {/* Top Banner Critical Shortage Warning if active */}
      {shortageRiskCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-slate-900 border border-rose-500/40 flex items-center justify-between text-slate-100 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                🚨 Shortage Risk Alert: {shortageRiskCount} products below critical lead-time stock!
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                AI Demand Engine predicts potential stockouts within 4 days. Automated PO recommendations ready.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('predictions')}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow transition-all shrink-0"
          >
            Review AI Reorders →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Total Catalog Items</p>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-white font-mono">{totalProducts} SKUs</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{totalStockUnits.toLocaleString()}</span> total units in stock
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Total Stock Valuation</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-white font-mono">${totalStockValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Retail Potential: <span className="text-emerald-400 font-bold">${totalRetailValuation.toLocaleString('en-US')}</span>
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Smart Health Score</p>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <h3 className="text-2xl font-extrabold text-white font-mono">{avgHealth} / 100</h3>
              <p className="text-xs text-slate-400 mt-1">
                🟢 {healthyCount} Healthy | 🔴 {criticalCount} Critical
              </p>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded ${
              avgHealth >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {avgHealth >= 80 ? 'OPTIMAL' : 'ATTN NEEDED'}
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Shortage & Out of Stock</p>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-rose-400 font-mono">{shortageRiskCount} Critical</h3>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-200 font-semibold">{outOfStockCount}</span> completely out of stock
            </p>
          </div>
        </div>

      </div>

      {/* Quick Action Dock */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Quick Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
          >
            <QrCode className="w-3.5 h-3.5" /> Scan QR / Barcode
          </button>
          <button
            onClick={onOpenAddProduct}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <PackagePlus className="w-3.5 h-3.5 text-indigo-400" /> Add Product
          </button>
          <button
            onClick={() => onSelectTab('predictions')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Demand Forecast
          </button>
          <button
            onClick={() => onSelectTab('transfers')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" /> Transfer Stock
          </button>
          <button
            onClick={() => onSelectTab('purchases')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> New Purchase Order
          </button>
        </div>
      </div>

      {/* Main Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: 30-Day Demand & Sales Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Sales Velocity & AI Demand Forecasting Trend
              </h3>
              <p className="text-xs text-slate-400">Historical sales volume combined with 7-day predictive demand curve</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
              AI FORECAST ACTIVE
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="HistoricalSales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" name="Historical Sales" />
                <Area type="monotone" dataKey="ForecastedDemand" stroke="#a855f7" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorForecast)" name="AI Demand Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Health Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Inventory Health Breakdown
            </h3>
            <p className="text-xs text-slate-400">Score distribution based on velocity, stock & expiry</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {healthPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
              </span>
              <span className="font-mono font-bold text-white">{healthyCount} products ({Math.round((healthyCount/(totalProducts||1))*100)}%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
              </span>
              <span className="font-mono font-bold text-white">{warningCount} products ({Math.round((warningCount/(totalProducts||1))*100)}%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-800/60">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
              </span>
              <span className="font-mono font-bold text-white">{criticalCount} products ({Math.round((criticalCount/(totalProducts||1))*100)}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Category Bar Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Valuation Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Stock Valuation by Category ($)</h3>
            <button
              onClick={() => onSelectTab('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Export Report →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="Valuation" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Valuation ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Stock Movement Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Live Audit Trail Stream
            </h3>
            <button
              onClick={() => onSelectTab('audit')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View Log →
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
            {movements.slice(0, 5).map(m => (
              <div key={m.id} className="p-2.5 bg-slate-850 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                      m.type === 'IN' || m.type === 'TRANSFER_IN' ? 'bg-emerald-500/20 text-emerald-300' :
                      m.type === 'OUT' || m.type === 'TRANSFER_OUT' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {m.type}
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">{m.sku}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{m.notes}</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-extrabold ${
                    m.type === 'IN' || m.type === 'TRANSFER_IN' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {m.type === 'IN' || m.type === 'TRANSFER_IN' ? '+' : '-'}{m.quantity}
                  </span>
                  <p className="text-[10px] text-slate-500">{m.performedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
