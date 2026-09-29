import React from 'react';
import {
  LayoutDashboard,
  PackageSearch,
  Sparkles,
  Activity,
  ArrowLeftRight,
  ShoppingBag,
  Truck,
  RotateCcw,
  Building2,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userRole: Role;
  criticalCount: number;
  lowStockCount: number;
  pendingTransfersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  criticalCount,
  lowStockCount,
  pendingTransfersCount,
}) => {
  const menuGroups = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory & Stock', icon: PackageSearch, badge: lowStockCount > 0 ? `${lowStockCount} low` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      ]
    },
    {
      title: 'INTELLIGENCE & AI',
      items: [
        { id: 'predictions', label: 'Demand Forecasting', icon: Sparkles, badge: criticalCount > 0 ? `${criticalCount} risk` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold animate-pulse' },
        { id: 'health', label: 'Inventory Health Score', icon: Activity },
      ]
    },
    {
      title: 'WAREHOUSE LOGISTICS',
      items: [
        { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight, badge: pendingTransfersCount > 0 ? `${pendingTransfersCount}` : null, badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
        { id: 'purchases', label: 'Purchase Orders (PO)', icon: ShoppingBag },
        { id: 'sales', label: 'Sales Dispatch (SO)', icon: Truck },
        { id: 'returns', label: 'Returns & Damaged', icon: RotateCcw },
        { id: 'warehouses', label: 'Warehouses & Locations', icon: Building2 },
      ]
    },
    {
      title: 'ANALYTICS & AUDIT',
      items: [
        { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
        { id: 'permissions', label: 'Role Permissions', icon: ShieldAlert },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="py-4 px-3 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-md border font-mono ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Role Badge Indicator */}
      <div className="p-3 m-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-semibold text-slate-300">System Online</span>
          </div>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
};
