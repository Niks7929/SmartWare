import React, { useState } from 'react';
import {
  PackageSearch,
  Plus,
  QrCode,
  MapPin,
  Tag,
  AlertTriangle,
  MoreVertical,
  Edit2,
  Sliders,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Boxes,
  Printer
} from 'lucide-react';
import { Product, Warehouse, Supplier, Role } from '../../types';
import { HealthEngine } from '../../services/healthEngine';
import { PredictionEngine } from '../../services/predictionEngine';

interface InventoryListProps {
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  userRole: Role;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenAdjustModal: (product: Product) => void;
  onOpenQRModal: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  products,
  warehouses,
  suppliers,
  userRole,
  searchQuery,
  onSearchChange,
  selectedWarehouseId,
  onSelectWarehouse,
  onOpenAddModal,
  onOpenEditModal,
  onOpenAdjustModal,
  onOpenQRModal,
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter logic
  const filteredProducts = products.filter(p => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      const matchSupplier = p.supplierName.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchLocation = p.locations.some(l => 
        `${l.rack}-${l.shelf}-${l.bin}`.toLowerCase().includes(q) || l.warehouseName.toLowerCase().includes(q)
      );

      if (!matchName && !matchSku && !matchBarcode && !matchSupplier && !matchCategory && !matchLocation) {
        return false;
      }
    }

    // Warehouse scope
    if (selectedWarehouseId !== 'ALL') {
      const hasLoc = p.locations.some(l => l.warehouseId === selectedWarehouseId && l.quantity > 0);
      if (!hasLoc) return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
      return false;
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      const pred = PredictionEngine.calculatePrediction(p);
      const health = HealthEngine.calculateHealthScore(p);

      if (statusFilter === 'CRITICAL' && pred.shortageRisk !== 'High Shortage Risk' && pred.shortageRisk !== 'Out of Stock') return false;
      if (statusFilter === 'LOW_STOCK' && p.currentStock > p.reorderLevel) return false;
      if (statusFilter === 'DEAD_STOCK' && !pred.deadStockFlag) return false;
      if (statusFilter === 'SLOW_MOVING' && !pred.slowMovingFlag) return false;
      if (statusFilter === 'HEALTHY' && health.status !== 'Healthy') return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-indigo-400" />
            Smart Inventory & Multi-Warehouse Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stock levels, rack/shelf locations, health scores & barcode scanning
          </p>
        </div>

        {userRole !== 'Viewer' && (
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter by SKU, Name, Barcode, Rack..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Warehouse Selector */}
          <div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Warehouses (Consolidated)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Health / Stock Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="CRITICAL">🚨 Critical Shortage Risk</option>
              <option value="LOW_STOCK">⚠️ Low Stock (&lt; Reorder Level)</option>
              <option value="DEAD_STOCK">⚠️ Dead Stock (No Sales 90D)</option>
              <option value="SLOW_MOVING font-bold">🐌 Slow Moving</option>
              <option value="HEALTHY">🟢 Healthy Stock</option>
            </select>
          </div>

        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <span>
            Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} catalog items
          </span>
          <button
            onClick={() => {
              onSearchChange('');
              setSelectedCategory('ALL');
              setStatusFilter('ALL');
              onSelectWarehouse('ALL');
            }}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Locations (Rack-Shelf-Bin)</th>
                <th className="px-4 py-3.5 text-right">Price / Value</th>
                <th className="px-4 py-3.5 text-center">Stock Level vs Max</th>
                <th className="px-4 py-3.5 text-center">Health Score</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No products matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const health = HealthEngine.calculateHealthScore(p);
                  const pred = PredictionEngine.calculatePrediction(p);
                  const firstLoc = p.locations[0] || { rack: 'A-01', shelf: 'S-01', bin: 'B-01', warehouseName: 'Main' };

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    >
                      {/* Name & SKU */}
                      <td 
                        onClick={() => onSelectProduct(p)}
                        className="px-4 py-3 font-medium text-slate-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 shrink-0 font-mono text-xs">
                            {p.sku.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate max-w-[200px] group-hover:text-indigo-300 transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: <span className="text-indigo-400 font-semibold">{p.sku}</span> | Barcode: {p.barcode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
                          {p.category}
                        </span>
                      </td>

                      {/* Locations */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            Rack {firstLoc.rack} • Shelf {firstLoc.shelf} • Bin {firstLoc.bin}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {firstLoc.warehouseName}
                          </p>
                        </div>
                      </td>

                      {/* Price & Value */}
                      <td className="px-4 py-3 text-right font-mono">
                        <p className="font-bold text-white">${p.sellingPrice.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">
                          Cost: ${p.purchasePrice.toFixed(2)}
                        </p>
                      </td>

                      {/* Stock Level vs Max Progress */}
                      <td className="px-4 py-3 text-center">
                        <div className="max-w-[120px] mx-auto space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={`font-bold ${
                              p.currentStock === 0 ? 'text-rose-400 font-extrabold animate-pulse' :
                              p.currentStock <= p.reorderLevel ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {p.currentStock} {p.unit}
                            </span>
                            <span className="text-slate-500">Max {p.maxStock}</span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.currentStock === 0 ? 'bg-rose-500' :
                                p.currentStock <= p.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (p.currentStock / p.maxStock) * 100)}%` }}
                            />
                          </div>

                          {pred.deadStockFlag && (
                            <span className="inline-block px-1.5 py-0.2 text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                              DEAD STOCK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Health Score Badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 text-xs font-bold font-mono rounded-lg border inline-flex items-center gap-1 ${
                          health.status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          health.status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                        }`}>
                          {health.overallScore}/100
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenQRModal(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Print Label & QR Code"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {userRole !== 'Viewer' && (
                            <>
                              <button
                                onClick={() => onOpenAdjustModal(p)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Adjust Stock (Receive/Issue)"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit Product Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
