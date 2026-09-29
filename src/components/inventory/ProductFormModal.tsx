import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Edit2, Save, Building2, MapPin } from 'lucide-react';
import { Product, Warehouse, Supplier, User } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit: Product | null;
  warehouses: Warehouse[];
  suppliers: Supplier[];
  currentUser: User;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  warehouses,
  suppliers,
  currentUser,
  onClose,
  onSave,
}) => {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Accessories');
  const [brand, setBrand] = useState('Apex Tech');
  const [unit, setUnit] = useState('Pcs');
  const [purchasePrice, setPurchasePrice] = useState(20);
  const [sellingPrice, setSellingPrice] = useState(40);
  const [currentStock, setCurrentStock] = useState(50);
  const [minStock, setMinStock] = useState(20);
  const [maxStock, setMaxStock] = useState(200);
  const [reorderLevel, setReorderLevel] = useState(30);
  const [supplierId, setSupplierId] = useState('');
  const [rack, setRack] = useState('A-01');
  const [shelf, setShelf] = useState('S-01');
  const [bin, setBin] = useState('B-01');

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode);
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setCategory(productToEdit.category);
      setBrand(productToEdit.brand);
      setUnit(productToEdit.unit);
      setPurchasePrice(productToEdit.purchasePrice);
      setSellingPrice(productToEdit.sellingPrice);
      setCurrentStock(productToEdit.currentStock);
      setMinStock(productToEdit.minStock);
      setMaxStock(productToEdit.maxStock);
      setReorderLevel(productToEdit.reorderLevel);
      setSupplierId(productToEdit.supplierId);
      const loc = productToEdit.locations[0] || { rack: 'A-01', shelf: 'S-01', bin: 'B-01' };
      setRack(loc.rack);
      setShelf(loc.shelf);
      setBin(loc.bin);
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setSku(`SKU-${randNum}`);
      setBarcode(`890123456${randNum}`);
      setName('');
      setDescription('');
      setCategory('Computer Accessories');
      setBrand('Apex Tech');
      setUnit('Pcs');
      setPurchasePrice(25);
      setSellingPrice(50);
      setCurrentStock(40);
      setMinStock(20);
      setMaxStock(200);
      setReorderLevel(30);
      setSupplierId(suppliers[0]?.id || 'sup-1');
      setRack('A-01');
      setShelf('S-01');
      setBin('B-01');
    }
  }, [productToEdit, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      alert('Product Name and SKU are required.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === supplierId) || suppliers[0];
    const defaultWH = warehouses[0] || { id: 'wh-1', name: 'Alpha Logistics Center' };

    const newProd: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || `890123456${Math.floor(100+Math.random()*900)}`,
      name: name.trim(),
      description: description.trim(),
      category,
      brand: brand.trim() || 'Generic',
      unit,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      maxStock: Number(maxStock),
      reorderLevel: Number(reorderLevel),
      supplierId: supplierObj.id,
      supplierName: supplierObj.name,
      locations: [
        {
          warehouseId: defaultWH.id,
          warehouseName: defaultWH.name,
          rack: rack.toUpperCase(),
          shelf: shelf.toUpperCase(),
          bin: bin.toUpperCase(),
          quantity: Number(currentStock)
        }
      ],
      batches: productToEdit ? productToEdit.batches : [
        {
          batchNumber: `BAT-${new Date().getFullYear()}-01`,
          manufactureDate: new Date().toISOString().split('T')[0],
          expiryDate: '2029-12-31',
          quantity: Number(currentStock),
          warehouseId: defaultWH.id
        }
      ],
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      salesLast30Days: productToEdit ? productToEdit.salesLast30Days : 30,
      salesLast60Days: productToEdit ? productToEdit.salesLast60Days : 60,
      salesLast90Days: productToEdit ? productToEdit.salesLast90Days : 90,
      dailyAvgDemand: productToEdit ? productToEdit.dailyAvgDemand : 1.0,
      lastSaleDate: new Date().toISOString().split('T')[0]
    };

    onSave(newProd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            {productToEdit ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <PackagePlus className="w-5 h-5 text-indigo-400" />}
            <h3 className="font-bold text-base text-white">
              {productToEdit ? `Edit Product Details: ${productToEdit.sku}` : 'Add New Inventory Item'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Product SKU *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Barcode (EAN/UPC)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono font-bold mb-1">Product Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Ergonomic Mouse X1"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Computer Accessories">Computer Accessories</option>
                <option value="Office Furniture">Office Furniture</option>
                <option value="Pharma & Health">Pharma & Health</option>
                <option value="Industrial Tools">Industrial Tools</option>
                <option value="Automotive Parts">Automotive Parts</option>
                <option value="General Electronics">General Electronics</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Measurement Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Pcs, Boxes, Kg"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Cost Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Retail Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-indigo-300 font-mono uppercase">Inventory Thresholds & Reorder Limits</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Min Stock</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Max Stock</label>
                <input
                  type="number"
                  value={maxStock}
                  onChange={(e) => setMaxStock(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono text-amber-300 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Supplier & Warehouse Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-mono font-bold mb-1">Primary Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.leadTimeDays}d lead time)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Rack</label>
                <input
                  type="text"
                  value={rack}
                  onChange={(e) => setRack(e.target.value)}
                  placeholder="A-03"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Shelf</label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="S-02"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Bin</label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="B-14"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Product
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
