import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, Search, PackageCheck, MapPin, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product, Warehouse } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouses: Warehouse[];
  onAdjustStock: (productId: string, warehouseId: string, delta: number, type: 'IN' | 'OUT') => void;
  onViewProductDetail: (product: Product) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouses,
  onAdjustStock,
  onViewProductDetail,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [activeCamera, setActiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setScannedProduct(null);
      setManualInput('');
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setActiveCamera(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable in iframe or permission denied. Please use simulated scan or manual input below.');
      setActiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setActiveCamera(false);
  };

  const handleSearchOrScan = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim().toLowerCase();
    
    // Check match by SKU, barcode, ID, or JSON payload
    const found = products.find(p => {
      if (p.sku.toLowerCase() === clean) return true;
      if (p.barcode.toLowerCase() === clean) return true;
      if (p.id.toLowerCase() === clean) return true;
      if (p.name.toLowerCase().includes(clean)) return true;
      try {
        const parsed = JSON.parse(term);
        if (parsed.sku && parsed.sku.toLowerCase() === p.sku.toLowerCase()) return true;
      } catch {}
      return false;
    });

    if (found) {
      setScannedProduct(found);
    } else {
      alert(`No product matching SKU or Barcode "${term}" found in SmartWare database.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">QR / Barcode Scanner</h3>
              <p className="text-xs text-slate-400">Scan product label for instant location & stock management</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Camera Viewport / Simulator */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center">
            {activeCamera ? (
              <div className="relative w-full h-full">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-indigo-500/60 rounded-xl flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-lg animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-indigo-400 border border-slate-700">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Camera Scanner Ready</p>
                  <p className="text-xs text-slate-400 mt-1">Use camera or select sample item to test barcode lookup</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Enable Live Camera
                </button>
                {cameraError && (
                  <p className="text-[11px] text-amber-400 mt-2 max-w-sm mx-auto">{cameraError}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Demo Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              ⚡ Quick Demo Scan (Select any SKU):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSearchOrScan(p.sku)}
                  className={`p-2 text-left border rounded-lg text-xs transition-all ${
                    scannedProduct?.id === p.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-mono text-indigo-300 font-bold">{p.sku}</p>
                  <p className="truncate text-[11px] text-slate-400">{p.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
              Or Manual Barcode / SKU Entry:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchOrScan(manualInput)}
                placeholder="e.g. WM-001 or 890123456701"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSearchOrScan(manualInput)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Lookup
              </button>
            </div>
          </div>

          {/* Scanned Result Card */}
          {scannedProduct && (
            <div className="bg-slate-800/90 border-2 border-indigo-500/50 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-semibold">
                    SCANNED MATCH
                  </span>
                  <h4 className="font-bold text-base text-white mt-1">{scannedProduct.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: <span className="text-indigo-300 font-bold">{scannedProduct.sku}</span> | Barcode: {scannedProduct.barcode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Current Stock</p>
                  <p className="text-xl font-extrabold text-white font-mono">{scannedProduct.currentStock} {scannedProduct.unit}</p>
                </div>
              </div>

              {/* Warehouse Rack / Shelf / Bin Locations */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 font-mono uppercase">
                  <MapPin className="w-3.5 h-3.5" /> Warehouse Location Map:
                </p>
                {scannedProduct.locations.map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800 last:border-none">
                    <span className="text-slate-300 font-medium">{loc.warehouseName}:</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                      Rack: {loc.rack} | Shelf: {loc.shelf} | Bin: {loc.bin} ({loc.quantity} {scannedProduct.unit})
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Stock Adjustment Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAdjustStock(scannedProduct.id, scannedProduct.locations[0]?.warehouseId || 'wh-1', 10, 'IN')}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Receive +10
                  </button>
                  <button
                    onClick={() => onAdjustStock(scannedProduct.id, scannedProduct.locations[0]?.warehouseId || 'wh-1', -1, 'OUT')}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" /> Pick / Dispatch -1
                  </button>
                </div>

                <button
                  onClick={() => {
                    onViewProductDetail(scannedProduct);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  Full Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
