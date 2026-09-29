import React from 'react';
import { Users, ShieldCheck, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { User, UserRole } from '../../types';

interface UserRoleViewProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
}

export const UserRoleView: React.FC<UserRoleViewProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const users: User[] = [
    { id: 'usr-1', name: 'Alex Rivera', role: 'Admin', email: 'alex.admin@smartware.io', department: 'Executive Logistics' },
    { id: 'usr-2', name: 'Sarah Chen', role: 'Warehouse Manager', email: 'sarah.m@smartware.io', department: 'Alpha Facility Operations' },
    { id: 'usr-3', name: 'Marcus Vance', role: 'Staff Worker', email: 'marcus.v@smartware.io', department: 'Inventory & Receiving' },
    { id: 'usr-4', name: 'Elena Rostova', role: 'Viewer', email: 'elena.r@smartware.io', department: 'External Audit' },
  ];

  const permissionsMatrix = [
    { feature: 'View Dashboard & Analytics', Admin: true, 'Warehouse Manager': true, 'Staff Worker': true, Viewer: true },
    { feature: 'Edit Inventory & Products', Admin: true, 'Warehouse Manager': true, 'Staff Worker': true, Viewer: false },
    { feature: 'Perform Stock Adjustments', Admin: true, 'Warehouse Manager': true, 'Staff Worker': true, Viewer: false },
    { feature: 'Approve & Receive Purchase Orders', Admin: true, 'Warehouse Manager': true, 'Staff Worker': false, Viewer: false },
    { feature: 'Initiate Stock Transfers', Admin: true, 'Warehouse Manager': true, 'Staff Worker': false, Viewer: false },
    { feature: 'Export CSV & Financial Audits', Admin: true, 'Warehouse Manager': true, 'Staff Worker': false, Viewer: false },
    { feature: 'Manage System Users & Security', Admin: true, 'Warehouse Manager': false, 'Staff Worker': false, Viewer: false },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          Role-Based Access Control (RBAC) & Active User Profile
        </h2>
        <p className="text-xs text-slate-400">
          Switch live session profiles to test Admin, Warehouse Manager, Staff Worker, and Auditor permissions
        </p>
      </div>

      {/* Profile Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map(u => {
          const isActive = currentUser.id === u.id;

          return (
            <div
              key={u.id}
              onClick={() => onSwitchUser(u)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-xl ring-2 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                  u.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  u.role === 'Warehouse Manager' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  u.role === 'Staff Worker' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {u.role}
                </span>

                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                    <UserCheck className="w-3.5 h-3.5" /> ACTIVE SESSION
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">{u.name}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{u.department}</p>
              </div>

              <button
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isActive ? 'Current Profile' : 'Switch to Profile'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security Permissions Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          System Authorization & Role Permission Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Capabilities & Features</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Warehouse Manager</th>
                <th className="px-4 py-3 text-center">Staff Worker</th>
                <th className="px-4 py-3 text-center">Viewer / Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{row.feature}</td>
                  <td className="px-4 py-3 text-center">{row.Admin ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✕</span>}</td>
                  <td className="px-4 py-3 text-center">{row['Warehouse Manager'] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✕</span>}</td>
                  <td className="px-4 py-3 text-center">{row['Staff Worker'] ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✕</span>}</td>
                  <td className="px-4 py-3 text-center">{row.Viewer ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✕</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
