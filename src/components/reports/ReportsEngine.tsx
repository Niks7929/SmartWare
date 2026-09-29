import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, Filter, Boxes, AlertTriangle, Skull, Calendar, DollarSign, FileText } from 'lucide-react';
import { Product, AuditLog, SalesOrder, StockMovement } from '../../types';
import { HealthEngine } from '../../services/healthEngine';
import { PredictionEngine } from '../../services/predictionEngine';

interface ReportsEngineProps {
  products: Product[];
  auditLogs: AuditLog[];
  salesOrders: SalesOrder[];
  movements: StockMovement[];
}

export const ReportsEngine: React.FC<ReportsEngineProps> = ({
  products,
  auditLogs,
  salesOrders,
  movements,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('stock_valuation');

  const reportTypes = [
    { id: 'stock_valuation', name: 'Stock Valuation & Catalog Report', icon: Boxes, desc: 'Current stock, purchase cost, retail value & margin per SKU' },
    { id: 'shortage_risk', name: 'Low Stock & Shortage Risk Report', icon: AlertTriangle, desc: 'Items below reorder point & lead-time stockouts' },
    { id: 'dead_stock', name: 'Dead Stock & Slow Moving Audit', icon: Skull, desc: 'Excess inventory with low velocity or zero 90D sales' },
    { id: 'expiry_schedule', name: 'Batch Expiry Schedule Report', icon: Calendar, desc: 'Batch numbers and upcoming expiry dates' },
    { id: 'profitability', name: 'Sales Revenue & Gross Profit Report', icon: DollarSign, desc: 'Revenue, cost of goods sold & margin per order' },
    { id: 'audit_trail', name: 'System Operations Audit Log', icon: FileText, desc: 'Complete historical log of user actions & stock adjustments' },
  ];

  // CSV Generator Utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (selectedReport === 'stock_valuation') {
      csvContent += 'SKU,Barcode,Product Name,Category,Current Stock,Unit,Purchase Price,Selling Price,Total Valuation Cost,Total Valuation Retail\n';
      products.forEach(p => {
        csvContent += `"${p.sku}","${p.barcode}","${p.name}","${p.category}",${p.currentStock},"${p.unit}",${p.purchasePrice},${p.sellingPrice},${(p.currentStock * p.purchasePrice).toFixed(2)},${(p.currentStock * p.sellingPrice).toFixed(2)}\n`;
      });
    } else if (selectedReport === 'shortage_risk') {
      csvContent += 'SKU,Product Name,Current Stock,Reorder Level,Daily Avg Demand,Estimated Days Remaining,Shortage Risk\n';
      products.forEach(p => {
        const pred = PredictionEngine.calculatePrediction(p);
        csvContent += `"${p.sku}","${p.name}",${p.currentStock},${p.reorderLevel},${pred.dailyAvgDemand},${pred.estimatedDaysRemaining},"${pred.shortageRisk}"\n`;
      });
    } else if (selectedReport === 'audit_trail') {
      csvContent += 'Timestamp,User,Role,Category,Action,Details\n';
      auditLogs.forEach(a => {
        csvContent += `"${a.timestamp}","${a.user}","${a.userRole}","${a.category}","${a.action}","${a.details.replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += 'SKU,Name,Category,Current Stock,Price\n';
      products.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.category}",${p.currentStock},${p.sellingPrice}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartWare_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            Reports Engine & CSV / Data Exporter
          </h2>
          <p className="text-xs text-slate-400">
            Generate customizable inventory, shortage, expiry & profitability audit reports with 1-click export
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-indigo-400" /> Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reportTypes.map(rt => {
          const Icon = rt.icon;
          const isSelected = selectedReport === rt.id;

          return (
            <button
              key={rt.id}
              onClick={() => setSelectedReport(rt.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                <p className="font-bold text-xs">{rt.name}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{rt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
            Report Preview: {reportTypes.find(r => r.id === selectedReport)?.name}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          {selectedReport === 'stock_valuation' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-center">Stock</th>
                  <th className="px-3 py-2 text-right">Cost Price</th>
                  <th className="px-3 py-2 text-right">Retail Price</th>
                  <th className="px-3 py-2 text-right font-bold text-indigo-300">Total Cost Valuation</th>
                  <th className="px-3 py-2 text-right font-bold text-emerald-300">Total Retail Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-bold text-indigo-400">{p.sku}</td>
                    <td className="px-3 py-2 font-sans font-medium text-white">{p.name}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2 text-center font-bold text-white">{p.currentStock} {p.unit}</td>
                    <td className="px-3 py-2 text-right">${p.purchasePrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${p.sellingPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-200">${(p.currentStock * p.purchasePrice).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-400">${(p.currentStock * p.sellingPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'shortage_risk' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2 text-center">Current Stock</th>
                  <th className="px-3 py-2 text-center">Reorder Level</th>
                  <th className="px-3 py-2 text-center">Est Duration</th>
                  <th className="px-3 py-2 text-center">Shortage Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {products.map(p => {
                  const pred = PredictionEngine.calculatePrediction(p);
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-bold text-indigo-400">{p.sku}</td>
                      <td className="px-3 py-2 font-sans font-medium text-white">{p.name}</td>
                      <td className="px-3 py-2 text-center font-bold">{p.currentStock}</td>
                      <td className="px-3 py-2 text-center text-amber-300 font-bold">{p.reorderLevel}</td>
                      <td className="px-3 py-2 text-center">{pred.estimatedDaysRemaining} days</td>
                      <td className="px-3 py-2 text-center font-bold">{pred.shortageRisk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {selectedReport === 'audit_trail' && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">User & Role</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map(a => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{new Date(a.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2 font-semibold text-white">{a.user} ({a.userRole})</td>
                    <td className="px-3 py-2 font-mono text-indigo-300">{a.category}</td>
                    <td className="px-3 py-2 font-bold text-slate-200">{a.action}</td>
                    <td className="px-3 py-2 text-slate-300 text-[11px]">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport !== 'stock_valuation' && selectedReport !== 'shortage_risk' && selectedReport !== 'audit_trail' && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Preview mode active. Click "Download CSV" or "Print Report" above to export full data dataset.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
