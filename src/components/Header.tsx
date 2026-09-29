import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Bell,
  QrCode,
  RotateCcw,
  UserCheck,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';
import { User, Role, Warehouse } from '../types';

interface HeaderProps {
  currentUser: User;
  onSwitchRole: (role: Role) => void;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenScanner: () => void;
  onResetData: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  warehouses,
  activeWarehouseId,
  onSelectWarehouse,
  unreadCount,
  onOpenNotifications,
  onOpenScanner,
  onResetData,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showWHDropdown, setShowWHDropdown] = useState(false);

  const roles: { role: Role; label: string; desc: string; icon: string }[] = [
    { role: 'Admin', label: 'System Admin', desc: 'Full access to all operations & settings', icon: '👑' },
    { role: 'Warehouse Manager', label: 'Warehouse Manager', desc: 'Stock control, PO, SO & Transfers', icon: '🏢' },
    { role: 'Warehouse Staff', label: 'Warehouse Staff', desc: 'Scan, pick, receive & stock update', icon: '📦' },
    { role: 'Viewer', label: 'Viewer', desc: 'Read-only access to dashboards & reports', icon: '👁️' },
  ];

  const activeWH = warehouses.find(w => w.id === activeWarehouseId);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white font-mono">SmartWare</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                    AI v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block font-sans">Intelligent Warehouse & ML Platform</p>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 relative hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activeTab !== 'inventory' && e.target.value.trim().length > 0) {
                    onTabChange('inventory');
                  }
                }}
                placeholder="Smart Search by Product Name, SKU, Barcode, Rack (A-03), Supplier..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-200 placeholder-slate-400 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Warehouse Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWHDropdown(!showWHDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 transition-colors"
                title="Select Active Warehouse View"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {activeWarehouseId === 'ALL' ? 'All Warehouses' : activeWH?.code || 'Warehouse'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showWHDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-700/60 uppercase tracking-wider">
                    Filter Warehouse Scope
                  </div>
                  <button
                    onClick={() => {
                      onSelectWarehouse('ALL');
                      setShowWHDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700 ${
                      activeWarehouseId === 'ALL' ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <span>All Consolidated Warehouses</span>
                    {activeWarehouseId === 'ALL' && <span className="text-indigo-400">✓</span>}
                  </button>
                  {warehouses.map(wh => (
                    <button
                      key={wh.id}
                      onClick={() => {
                        onSelectWarehouse(wh.id);
                        setShowWHDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700 ${
                        activeWarehouseId === wh.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{wh.name}</p>
                        <p className="text-[10px] text-slate-400">{wh.city} ({wh.code})</p>
                      </div>
                      {activeWarehouseId === wh.id && <span className="text-indigo-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Barcode / QR Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm hover:shadow transition-all"
              title="Open QR & Barcode Scanner"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors text-left"
                title="Switch Active Role for Testing Permissions"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-indigo-400/40"
                />
                <div className="hidden lg:block">
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-400 font-medium leading-tight">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-700/60 bg-slate-850">
                    <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Role-Based Access Tester
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Switch role to test app permissions live:</p>
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        onSwitchRole(r.role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-start gap-2.5 transition-colors ${
                        currentUser.role === r.role ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-200'
                      }`}
                    >
                      <span className="text-base">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{r.label}</p>
                          {currentUser.role === r.role && (
                            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-700/60 mt-1 pt-1 px-1">
                    <button
                      onClick={() => {
                        if (confirm('Reset demo data back to default initial seed?')) {
                          onResetData();
                          setShowRoleDropdown(false);
                        }
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Demo Seed Data
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
