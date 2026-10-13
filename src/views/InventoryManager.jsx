import React, { useState, useEffect } from 'react';
import {
  Package, Search, Plus, Upload, Download, Tag, AlertTriangle,
  Edit2, Check, X, ShieldAlert, Sparkles, SlidersHorizontal, Layers
} from 'lucide-react';
import BarcodeStickerModal from '../components/BarcodeStickerModal';

export default function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [abcFilter, setAbcFilter] = useState('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [selectedSlabProduct, setSelectedSlabProduct] = useState(null);

  // Inline editing state: { [id]: { retail_price, stock_quantity, shelf_location } }
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // New Part Form
  const [newPart, setNewPart] = useState({
    part_number: '',
    name: '',
    model_compat: 'CD70',
    category: 'Genuine Honda',
    brand: 'Atlas Honda',
    shelf_location: 'Rack A - Shelf 1',
    cost_price: '',
    retail_price: '',
    wholesale_price: '',
    stock_quantity: 10,
    min_stock_alert: 5,
    barcode: '',
    abc_category: 'A'
  });

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, modelFilter, categoryFilter, abcFilter]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (modelFilter !== 'All') params.append('model', modelFilter);
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (abcFilter !== 'All') params.append('abc', abcFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({
      name: prod.name,
      shelf_location: prod.shelf_location,
      cost_price: prod.cost_price,
      retail_price: prod.retail_price,
      wholesale_price: prod.wholesale_price,
      stock_quantity: prod.stock_quantity,
      min_stock_alert: prod.min_stock_alert,
      abc_category: prod.abc_category
    });
  };

  const handleSaveInlineEdit = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update product');
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!newPart.part_number || !newPart.name || !newPart.retail_price) {
      alert('Please fill mandatory fields: Part Number, Name, Retail Price');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPart)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add part');

      alert('Spare part added successfully to catalog!');
      setShowAddModal(false);
      setNewPart({
        part_number: '',
        name: '',
        model_compat: 'CD70',
        category: 'Genuine Honda',
        brand: 'Atlas Honda',
        shelf_location: 'Rack A - Shelf 1',
        cost_price: '',
        retail_price: '',
        wholesale_price: '',
        stock_quantity: 10,
        min_stock_alert: 5,
        barcode: '',
        abc_category: 'A'
      });
      fetchProducts();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import spreadsheet');

      setImportResult(data);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Critical Low Stock Count
  const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock_alert).length;

  return (
    <div>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={24} color="var(--honda-red)" />
            Spare Parts Catalog & Inventory
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Atlas Honda genuine & aftermarket parts, bulk spreadsheet import, barcode generation & ABC analysis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <a href="/api/products/export" className="btn btn-outline">
            <Download size={15} /> Export CSV
          </a>
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <Upload size={15} /> Bulk Import (Excel/CSV)
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Single Part
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Bar (If Low Stock Exists) */}
      {lowStockCount > 0 && (
        <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f43f5e' }}>
            <AlertTriangle size={18} />
            <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>
              Attention: {lowStockCount} essential spare parts are at or below minimum reorder levels!
            </span>
          </div>
          <button
            onClick={() => { setAbcFilter('All'); setSearch(''); }}
            className="btn btn-sm btn-outline"
            style={{ borderColor: 'rgba(225, 29, 72, 0.4)', color: '#f43f5e' }}
          >
            Review Low Stock
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card-panel" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search part name, OEM part #, barcode, shelf..."
              className="form-input"
              style={{ paddingLeft: '2.3rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Model Filter */}
          <div>
            <select className="form-select" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
              <option value="All">All Bike Models</option>
              <option value="CD70">Honda CD70</option>
              <option value="CG125">Honda CG125</option>
              <option value="Pridor">Honda Pridor</option>
              <option value="CB150F">Honda CB150F</option>
              <option value="Universal">Universal</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Genuine Honda">Genuine Atlas Honda</option>
              <option value="Aftermarket / Local">Aftermarket / Local</option>
              <option value="Engine Oil / Fluids">Engine Oil / Fluids</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          {/* ABC Class Filter */}
          <div>
            <select className="form-select" value={abcFilter} onChange={(e) => setAbcFilter(e.target.value)}>
              <option value="All">All ABC Tiers</option>
              <option value="A">Class A (Fast-Moving)</option>
              <option value="B">Class B (Medium)</option>
              <option value="C">Class C (Slow / Dead Stock)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Parts Table */}
      <div className="card-panel">
        <div className="table-wrapper">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Part Details</th>
                <th>Model</th>
                <th>Category / Brand</th>
                <th>Rack Location</th>
                <th>Cost (Rs)</th>
                <th>Retail (Rs)</th>
                <th>Wholesale (Rs)</th>
                <th>Stock</th>
                <th>ABC Tier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isEditing = editingId === p.id;
                const isLow = p.stock_quantity <= p.min_stock_alert;

                return (
                  <tr key={p.id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '700' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.part_number} {p.barcode ? `| Barcode: ${p.barcode}` : ''}
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="card-badge badge-blue">{p.model_compat}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem' }}>{p.category}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.brand}</div>
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.82rem', width: '110px' }}
                          value={editForm.shelf_location}
                          onChange={(e) => setEditForm({ ...editForm, shelf_location: e.target.value })}
                        />
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {p.shelf_location || '—'}
                        </span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem', width: '80px' }}
                          value={editForm.cost_price}
                          onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{p.cost_price}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem', width: '85px', fontWeight: '800' }}
                          value={editForm.retail_price}
                          onChange={(e) => setEditForm({ ...editForm, retail_price: e.target.value })}
                        />
                      ) : (
                        <span style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}>{p.retail_price}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem', width: '85px' }}
                          value={editForm.wholesale_price}
                          onChange={(e) => setEditForm({ ...editForm, wholesale_price: e.target.value })}
                        />
                      ) : (
                        <div>
                          <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>PKR {p.wholesale_price}</span>
                          {p.slabs && p.slabs.length > 0 && (
                            <div style={{ marginTop: '0.2rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedSlabProduct(p)}
                                className="card-badge badge-blue"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  background: 'rgba(59, 130, 246, 0.1)'
                                }}
                                title="Click to view wholesale volume tiers"
                              >
                                <Layers size={10} />
                                {p.slabs.length} Slabs
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem', width: '70px', fontWeight: '800' }}
                          value={editForm.stock_quantity}
                          onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                        />
                      ) : (
                        <span className={`card-badge ${isLow ? 'badge-red' : 'badge-emerald'}`}>
                          {p.stock_quantity} pcs
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`card-badge ${p.abc_category === 'A' ? 'badge-emerald' : p.abc_category === 'B' ? 'badge-blue' : 'badge-amber'}`}>
                        Class {p.abc_category}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveInlineEdit(p.id)} className="btn btn-success btn-sm" style={{ padding: '2px 8px' }}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px' }}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleStartEdit(p)} className="btn btn-outline btn-sm" title="Quick inline edit">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setBarcodeProduct(p)} className="btn btn-secondary btn-sm" title="Generate Barcode Sticker">
                              <Tag size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BULK IMPORT MODAL ================= */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} color="var(--honda-red)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Bulk Import Parts Spreadsheet</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Need standard Excel / CSV template?</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pre-formatted with Honda OEM part columns</p>
                  </div>
                  <a href="/api/products/template" download className="btn btn-outline btn-sm">
                    <Download size={14} /> Download Sample Template
                  </a>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Excel (.xlsx) or CSV File *</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="form-input"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    required
                  />
                </div>

                {importResult && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: '800', marginBottom: '0.2rem' }}>Import Completed Successfully!</div>
                    <div>New parts added: <strong>{importResult.imported}</strong></div>
                    <div>Existing parts updated: <strong>{importResult.updated}</strong></div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                  Close
                </button>
                <button type="submit" disabled={importLoading || !importFile} className="btn btn-primary">
                  <Upload size={16} /> {importLoading ? 'Importing Parts...' : 'Upload & Process Spreadsheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MANUAL SINGLE PART ADDITION MODAL ================= */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} color="var(--honda-red)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Add New Spare Part to Store</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-outline btn-sm">✕</button>
            </div>

            <form onSubmit={handleAddPart}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">OEM Part Number (or SKU) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 15412-MGS-D21"
                    className="form-input"
                    value={newPart.part_number}
                    onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Part Name / Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Engine Oil Filter Element"
                    className="form-input"
                    value={newPart.name}
                    onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Compatible Model</label>
                  <select
                    className="form-select"
                    value={newPart.model_compat}
                    onChange={(e) => setNewPart({ ...newPart, model_compat: e.target.value })}
                  >
                    <option value="CD70">Honda CD70</option>
                    <option value="CG125">Honda CG125</option>
                    <option value="Pridor">Honda Pridor</option>
                    <option value="CB150F">Honda CB150F</option>
                    <option value="Universal">Universal (All Bikes)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newPart.category}
                    onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                  >
                    <option value="Genuine Honda">Genuine Atlas Honda</option>
                    <option value="Aftermarket / Local">Aftermarket / Local</option>
                    <option value="Engine Oil / Fluids">Engine Oil / Fluids</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hardware / Body">Hardware / Body</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Rack / Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack B - Shelf 2"
                    className="form-input"
                    value={newPart.shelf_location}
                    onChange={(e) => setNewPart({ ...newPart, shelf_location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Barcode (Leave blank to auto-generate)</label>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    className="form-input"
                    value={newPart.barcode}
                    onChange={(e) => setNewPart({ ...newPart, barcode: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', gridColumn: 'span 2' }}>
                  <div className="form-group">
                    <label className="form-label">Cost Price (Rs)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="form-input"
                      value={newPart.cost_price}
                      onChange={(e) => setNewPart({ ...newPart, cost_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Retail Price (Rs) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="form-input"
                      style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}
                      value={newPart.retail_price}
                      onChange={(e) => setNewPart({ ...newPart, retail_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Wholesale Price (Rs)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="form-input"
                      value={newPart.wholesale_price}
                      onChange={(e) => setNewPart({ ...newPart, wholesale_price: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', gridColumn: 'span 2' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Qty</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPart.stock_quantity}
                      onChange={(e) => setNewPart({ ...newPart, stock_quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Stock Buffer Alert</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPart.min_stock_alert}
                      onChange={(e) => setNewPart({ ...newPart, min_stock_alert: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ABC Class</label>
                    <select
                      className="form-select"
                      value={newPart.abc_category}
                      onChange={(e) => setNewPart({ ...newPart, abc_category: e.target.value })}
                    >
                      <option value="A">Class A (Fast)</option>
                      <option value="B">Class B (Medium)</option>
                      <option value="C">Class C (Slow)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BARCODE STICKER MODAL ================= */}
      {barcodeProduct && (
        <BarcodeStickerModal
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {/* ================= WHOLESALE PRICING SLABS MODAL ================= */}
      {selectedSlabProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedSlabProduct(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>Atlas Honda Wholesale Slabs</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Official Quantity Volume Scheme Pricing Structure
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedSlabProduct(null)}
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PART CODE & NAME</div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {selectedSlabProduct.part_number}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {selectedSlabProduct.name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BASE RETAIL PRICE</div>
                  <div style={{ fontWeight: '800', color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>
                    PKR {selectedSlabProduct.retail_price}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Model: {selectedSlabProduct.model_compat}
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="pos-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Min Qty Slab</th>
                      <th style={{ textAlign: 'right' }}>Wholesale Price</th>
                      <th style={{ textAlign: 'right' }}>Retail Price</th>
                      <th style={{ textAlign: 'right' }}>Dealer Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSlabProduct.slabs && selectedSlabProduct.slabs.map((slab, idx) => {
                      const discount = selectedSlabProduct.retail_price > 0
                        ? (((selectedSlabProduct.retail_price - slab.dealer_price) / selectedSlabProduct.retail_price) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={idx} style={{ background: idx === 0 ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="card-badge badge-blue" style={{ fontWeight: '800' }}>
                                {slab.min_quantity}+ pcs
                              </span>
                              {idx === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Base Tier)</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-blue)' }}>
                            PKR {slab.dealer_price}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                            PKR {slab.retail_price || selectedSlabProduct.retail_price}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="card-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                              {discount}% OFF
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                💡 <strong>Dynamic POS Activation:</strong> When selecting B2B Wholesale stream in POS and adding {selectedSlabProduct.name}, entering a quantity equal to or greater than the tier threshold automatically activates the corresponding wholesale price.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedSlabProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
