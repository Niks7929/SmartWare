import React, { useState, useEffect } from 'react';
import { X, Printer, QrCode, Tag, MapPin, Calendar, Building2 } from 'lucide-react';
import { Product } from '../types';
import { QRService } from '../services/qrGenerator';

interface QRGeneratorModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({ product, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (product) {
      const payload = QRService.createProductPayload(product);
      QRService.generateQRCodeDataUrl(payload).then(setQrCodeDataUrl);
    }
  }, [product]);

  if (!product) return null;

  const firstLoc = product.locations[0] || { rack: 'A-01', shelf: 'S-01', bin: 'B-01', warehouseName: 'Alpha Logistics' };
  const firstBatch = product.batches[0] || { expiryDate: '2029-12-31' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Printable Warehouse Label</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Badge Container (Styled for printing/visual badge) */}
        <div className="p-6">
          <div id="printable-qr-badge" className="bg-white text-slate-900 p-6 rounded-xl shadow-lg border-2 border-slate-300 space-y-4 font-sans">
            
            {/* Top Brand & SKU */}
            <div className="flex items-start justify-between border-b pb-3 border-slate-200">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase font-mono">
                  SMARTWARE INVENTORY
                </span>
                <h4 className="font-extrabold text-lg text-slate-900 leading-tight">{product.name}</h4>
                <p className="text-xs text-slate-500 font-mono font-semibold">{product.category} • {product.brand}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 text-xs font-mono font-extrabold bg-slate-900 text-white rounded">
                  {product.sku}
                </span>
              </div>
            </div>

            {/* QR Code + Location Details */}
            <div className="flex items-center gap-4">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-28 h-28 object-contain border rounded p-1 bg-white" />
              ) : (
                <div className="w-28 h-28 bg-slate-100 animate-pulse rounded flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}

              <div className="flex-1 space-y-1.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Rack Location</p>
                  <p className="font-mono font-extrabold text-indigo-900 text-sm bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                    {firstLoc.rack} - {firstLoc.shelf} - {firstLoc.bin}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Barcode</p>
                  <p className="font-mono font-bold text-slate-800">{product.barcode}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Expiry / Batch</p>
                  <p className="font-mono text-slate-700">{firstBatch.expiryDate}</p>
                </div>
              </div>
            </div>

            {/* Barcode Strip Graphic */}
            <div className="pt-2 border-t border-slate-200 text-center">
              <div className="h-8 bg-slate-900 flex items-center justify-center font-mono text-[10px] text-white tracking-widest uppercase">
                |||| | ||||| || |||| |||||| ||| ||||
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">SmartWare ID: {product.id}</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 shadow transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Label Badge
          </button>
        </div>

      </div>
    </div>
  );
};
