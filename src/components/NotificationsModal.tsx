import React from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onSelectTab: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">System Notifications</h3>
            <span className="px-2 py-0.5 text-xs font-mono bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              {notifications.filter(n => !n.read).length} unread
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Live SmartWare Intelligence Stream</span>
          <button
            onClick={onMarkAllRead}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Mark all as read
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No notifications right now.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  onMarkRead(n.id);
                  if (n.linkTab) {
                    onSelectTab(n.linkTab);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  n.read
                    ? 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/70'
                    : 'bg-slate-800 border-indigo-500/30 text-slate-200 hover:border-indigo-500 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-white truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-indigo-400 rounded-full" />}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
