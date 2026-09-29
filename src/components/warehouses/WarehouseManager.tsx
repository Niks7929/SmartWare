import React from 'react';
import { Building2, MapPin, Users, PackageCheck, Layers, ChevronRight } from 'lucide-react';
import { Warehouse, Product } from '../../types';

interface WarehouseManagerProps {
  warehouses: Warehouse[];
  products: Product[];
}

export const WarehouseManager: React.FC<WarehouseManagerProps> = ({
  warehouses,
  products,
}) => {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-400" />
          Multi-Warehouse Logistics & Storage Locations
        </h2>
        <p className="text-xs text-slate-400">
          Capacity utilization, rack/shelf/bin storage maps & warehouse manager assignments
        </p>
      </div>

      {/* Warehouse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map(wh => {
          // Calculate current stock units in this WH
          let whStockUnits = 0;
          products.forEach(p => {
            p.locations.forEach(l => {
              if (l.warehouseId === wh.id) {
                whStockUnits += l.quantity;
              }
            });
          });

          const fillPercent = Math.min(100, Math.round((whStockUnits / wh.capacityUnits) * 100));

          return (
            <div key={wh.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                    {wh.code}
                  </span>
                  <h3 className="font-bold text-base text-white mt-1">{wh.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-indigo-400" /> {wh.city} • {wh.address}
                  </p>
                </div>
                <span className="px-2 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                  {wh.status}
                </span>
              </div>

              {/* Capacity Usage Bar */}
              <div className="space-y-1.5 p-3 bg-slate-850 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Storage Capacity:</span>
                  <span className="font-bold text-white">{whStockUnits.toLocaleString()} / {wh.capacityUnits.toLocaleString()} units</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fillPercent > 85 ? 'bg-rose-500' :
                      fillPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-right font-mono text-indigo-300 font-bold">{fillPercent}% Utilization</p>
              </div>

              {/* Manager Details */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Facility Manager</p>
                  <p className="font-bold text-white">{wh.managerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{wh.contactEmail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rack / Shelf / Bin Mapping Matrix Explanation */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Standardized Storage Location Nomenclature (Rack - Shelf - Bin)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          SmartWare uses a precise 3-tiered aisle mapping format for fast picking efficiency:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="font-bold text-indigo-300">1. Rack Aisle (e.g., A-03, B-12)</p>
            <p className="text-slate-400 text-[11px] mt-1">Identifies the heavy industrial shelving aisle in the facility floor plan.</p>
          </div>
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="font-bold text-indigo-300">2. Shelf Level (e.g., S-01 to S-08)</p>
            <p className="text-slate-400 text-[11px] mt-1">Identifies vertical height level from floor level (S-01) upwards.</p>
          </div>
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
            <p className="font-bold text-indigo-300">3. Storage Bin (e.g., B-01 to B-20)</p>
            <p className="text-slate-400 text-[11px] mt-1">Identifies exact individual picking container/bin on the designated shelf.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
