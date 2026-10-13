import React, { useState, useEffect } from 'react';
import {
  Search, X, ShoppingBag, Plus, Percent, Tag, User,
  DollarSign, Bookmark, RotateCcw, Lock, ArrowRightLeft,
  Trash2, Wrench, Store
} from 'lucide-react';
import ThermalReceipt from '../components/ThermalReceipt';

export default function PosTerminal({ onOpenShiftModal }) {
  // Cart Items State: [{ product_id, part_number, name, quantity, unit_price, total_price, unit_cost }]
  const [cart, setCart] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // Selected Service Type & Payment Method
  const [serviceType, setServiceType] = useState('retail'); // 'retail', 'inhouse', 'b2b_wholesale', 'after_sale'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'khata'

  // Selected Customer / Workshop Bike / Local Shop
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);

  // Top Bar Search
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [newQty, setNewQty] = useState('1');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashTendered, setCashTendered] = useState('');

  // Workshop & B2B Data
  const [workshopJobs, setWorkshopJobs] = useState([]);
  const [b2bShops, setB2bShops] = useState([]);

  // Completed Invoice Data for Thermal Receipt
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchProducts();
    fetchWorkshopJobs();
    fetchB2BShops();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setAllProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkshopJobs = async () => {
    try {
      const res = await fetch('/api/workshop/jobs?status=ready');
      const data = await res.json();
      if (data.length === 0) {
        const inProg = await fetch('/api/workshop/jobs?status=in_progress');
        const inProgData = await inProg.json();
        setWorkshopJobs(inProgData);
      } else {
        setWorkshopJobs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchB2BShops = async () => {
    try {
      const res = await fetch('/api/khata/b2b-shops');
      const data = await res.json();
      setB2bShops(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard Shortcuts (F3: Search, F4: Quantity, F8: New Sale, F2: Discount, F10: Payment, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setNewQty(String(cart[selectedItemIndex]?.quantity || 1));
          setShowQtyModal(true);
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowDiscountModal(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleOpenPayment();
      } else if (e.key === 'F12') {
        e.preventDefault();
        setPaymentMethod('cash');
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleDeleteItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedItemIndex, selectedJob]);

  // Handle Search Input in Top Bar
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.part_number.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
    setSearchResults(matches.slice(0, 8));
  };

  // Handle Enter on Top Search Bar
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        addItemToCart(searchResults[0]);
        setSearchInput('');
        setSearchResults([]);
      } else {
        setShowSearchModal(true);
      }
    }
  };

  // Add Item to Cart
  const addItemToCart = (product) => {
    if (product.stock_quantity <= 0) {
      alert(`Out of stock: ${product.name}`);
      return;
    }

    const price = serviceType === 'b2b_wholesale' ? product.wholesale_price : product.retail_price;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product_id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        if (current.quantity >= product.stock_quantity) {
          alert(`Maximum store stock reached (${product.stock_quantity})`);
          return prev;
        }
        updated[existingIdx] = {
          ...current,
          quantity: current.quantity + 1,
          total_price: (current.quantity + 1) * price
        };
        setSelectedItemIndex(existingIdx);
        return updated;
      }

      const newItem = {
        product_id: product.id,
        part_number: product.part_number,
        name: product.name,
        quantity: 1,
        unit_price: price,
        total_price: price,
        unit_cost: product.cost_price,
        stock_quantity: product.stock_quantity
      };
      setSelectedItemIndex(prev.length);
      return [...prev, newItem];
    });
  };

  // Delete Selected Item
  const handleDeleteItem = () => {
    if (cart.length === 0) return;
    setCart(prev => prev.filter((_, idx) => idx !== selectedItemIndex));
    setSelectedItemIndex(prev => Math.max(0, prev - 1));
  };

  // Start New Sale (F8)
  const handleNewSale = () => {
    setCart([]);
    setSelectedItemIndex(0);
    setDiscountValue(0);
    setSelectedJob(null);
    setSelectedCustomer(null);
    setSearchInput('');
  };

  // Update Quantity of Selected Item (F4)
  const handleApplyQty = () => {
    const qty = parseInt(newQty);
    if (!qty || qty <= 0) return;

    setCart(prev => {
      const updated = [...prev];
      if (updated[selectedItemIndex]) {
        const item = updated[selectedItemIndex];
        if (qty > item.stock_quantity) {
          alert(`Only ${item.stock_quantity} available in stock!`);
          return prev;
        }
        updated[selectedItemIndex] = {
          ...item,
          quantity: qty,
          total_price: qty * item.unit_price
        };
      }
      return updated;
    });
    setShowQtyModal(false);
  };

  // Calculate Totals
  const subtotal = serviceType === 'inhouse' && selectedJob
    ? selectedJob.grand_total
    : cart.reduce((acc, item) => acc + item.total_price, 0);

  const discountAmount = Number(discountValue) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const changeDue = cashTendered ? Math.max(0, Number(cashTendered) - grandTotal) : 0;

  // Open Payment Dialog (F10)
  const handleOpenPayment = () => {
    if (serviceType === 'inhouse' && !selectedJob) {
      alert('Please select a workshop motorcycle/job card first');
      setShowServiceTypeModal(true);
      return;
    }
    if (serviceType !== 'inhouse' && cart.length === 0) {
      alert('Cart is empty. Add products before payment.');
      return;
    }
    setCashTendered(String(grandTotal));
    setShowPaymentModal(true);
  };

  // Finalize Checkout
  const handleCompleteSale = async () => {
    setLoading(true);
    try {
      const payload = {
        stream: serviceType === 'inhouse' ? 'inhouse' : serviceType === 'b2b_wholesale' ? 'b2b_wholesale' : serviceType === 'after_sale' ? 'after_sale' : 'counter_retail',
        customer_name: selectedJob ? selectedJob.customer_name : selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customer_phone: selectedJob ? selectedJob.customer_phone : selectedCustomer ? selectedCustomer.phone : '',
        b2b_shop_id: serviceType === 'b2b_wholesale' && selectedShop ? selectedShop.id : null,
        job_card_id: serviceType === 'inhouse' && selectedJob ? selectedJob.id : null,
        items: serviceType === 'inhouse' ? [] : cart,
        discount: discountAmount,
        payment_method: paymentMethod,
        cash_tendered: cashTendered ? Number(cashTendered) : grandTotal,
        cashier_id: 2
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      // Fetch invoice for printable receipt & Gate pass
      const invRes = await fetch(`/api/pos/invoices/${data.sale_id}`);
      const invData = await invRes.json();
      setCompletedInvoice(invData);

      setShowPaymentModal(false);
      handleNewSale();
      fetchProducts();
      fetchWorkshopJobs();
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aronium-pos-container">
      
      {/* ================= LEFT RECEIPT / ORDER TABLE ================= */}
      <section className="aronium-receipt-area">
        {/* Table Columns Header */}
        <div className="aronium-table-header">
          <div className="col-prod-name">Product name</div>
          <div className="col-qty">Quantity</div>
          <div className="col-price">Price</div>
          <div className="col-amount">Amount</div>
        </div>

        {/* Table Items Body */}
        <div className="aronium-table-body">
          {serviceType === 'inhouse' && selectedJob ? (
            /* In-House Workshop Active Job View */
            <div style={{ padding: '16px' }}>
              <div style={{ background: 'var(--aronium-surface)', border: '1px solid var(--aronium-border)', borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--honda-red)' }}>
                    {selectedJob.reg_number} ({selectedJob.vehicle_model})
                  </span>
                  <span className="card-badge badge-purple">Job #{selectedJob.job_number}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Customer: <strong>{selectedJob.customer_name}</strong> ({selectedJob.customer_phone}) | Mechanic: <strong>{selectedJob.mechanic_name}</strong>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Parts Fitted by Mechanic:
              </div>
              {selectedJob.parts && selectedJob.parts.map((p, idx) => (
                <div key={idx} className="aronium-row">
                  <div className="col-prod-name">
                    <strong>{p.part_name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.part_number}</div>
                  </div>
                  <div className="col-qty">{p.quantity}</div>
                  <div className="col-price">{p.unit_price.toFixed(2)}</div>
                  <div className="col-amount">{p.total_price.toFixed(2)}</div>
                </div>
              ))}

              <div className="aronium-row" style={{ background: 'rgba(0, 120, 212, 0.1)', color: '#38bdf8', marginTop: '8px' }}>
                <div className="col-prod-name">
                  <strong>Work & Dynamic Labor Charges</strong>
                  <div style={{ fontSize: '11px' }}>{selectedJob.work_type}</div>
                </div>
                <div className="col-qty">1</div>
                <div className="col-price">{selectedJob.dynamic_labor_amount.toFixed(2)}</div>
                <div className="col-amount">{selectedJob.dynamic_labor_amount.toFixed(2)}</div>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Composed Tactile Empty State */
            <div className="aronium-empty-state">
              <div className="aronium-empty-icon">
                <ShoppingBag size={28} />
              </div>
              <div className="aronium-empty-title">Register Ready for Next Customer</div>
              <div className="aronium-empty-subtitle">
                Scan barcode, search with <strong>F3</strong>, or click an essential Atlas Honda fast-mover below:
              </div>

              {/* Fast-Mover Quick-Add Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '440px', marginTop: '16px' }}>
                {allProducts.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => addItemToCart(p)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '6px 12px', gap: '6px', background: 'var(--aronium-surface)', borderColor: 'var(--aronium-border-light)' }}
                    title={`Add ${p.name} - PKR ${p.retail_price}`}
                  >
                    <Plus size={12} color="var(--accent-emerald)" />
                    <span>{p.name.length > 22 ? p.name.slice(0, 22) + '...' : p.name}</span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>Rs {p.retail_price}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F3</kbd> Search</span>
                <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F12</kbd> Cash</span>
                <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F10</kbd> Payment</span>
                <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F8</kbd> New</span>
              </div>
            </div>
          ) : (
            /* Items List */
            cart.map((item, idx) => {
              const isSelected = idx === selectedItemIndex;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedItemIndex(idx)}
                  className={`aronium-row ${isSelected ? 'selected' : ''}`}
                >
                  <div className="col-prod-name">
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: isSelected ? '#cbd5e1' : 'var(--text-muted)' }}>
                      {item.part_number}
                    </div>
                  </div>
                  <div className="col-qty" style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{item.quantity}</div>
                  <div className="col-price" style={{ fontFamily: 'var(--font-mono)' }}>{item.unit_price.toFixed(2)}</div>
                  <div className="col-amount" style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{item.total_price.toFixed(2)}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals Summary Footer matching Aronium layout */}
        <div className="aronium-totals-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="card-badge badge-blue">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} Items
              </span>
              <span className="card-badge badge-emerald" style={{ textTransform: 'uppercase' }}>
                {paymentMethod}
              </span>
              {serviceType !== 'retail' && (
                <span className="card-badge badge-purple" style={{ textTransform: 'capitalize' }}>
                  {serviceType.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="aronium-total-line">
              <span>Subtotal</span>
              <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>PKR {subtotal.toFixed(2)}</span>
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="aronium-total-line" style={{ color: '#f87171' }}>
              <span>Discount</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>-PKR {discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="aronium-total-line grand-total">
            <span>Total Payable</span>
            <span className="grand-total-amount" style={{ fontFamily: 'var(--font-mono)' }}>
              PKR {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* ================= RIGHT ARONIUM ACTION KEYPAD ================= */}
      <section className="aronium-keypad-area">
        
        {/* Row 1: Top 4 Action Tiles [Delete, F3 Search, F4 Quantity, F8 New sale] */}
        <div className="aronium-grid-4">
          <button onClick={handleDeleteItem} className="aronium-tile-btn">
            <X size={26} color="#94a3b8" />
            <span>Delete</span>
          </button>

          <button onClick={() => setShowSearchModal(true)} className="aronium-tile-btn">
            <span className="aronium-tile-badge">F3</span>
            <Search size={24} color="#38bdf8" />
            <span>Search</span>
          </button>

          <button
            onClick={() => {
              if (cart.length > 0) {
                setNewQty(String(cart[selectedItemIndex]?.quantity || 1));
                setShowQtyModal(true);
              }
            }}
            className="aronium-tile-btn"
          >
            <span className="aronium-tile-badge">F4</span>
            <ShoppingBag size={24} color="#f59e0b" />
            <span>Quantity</span>
          </button>

          <button onClick={handleNewSale} className="aronium-tile-btn">
            <span className="aronium-tile-badge">F8</span>
            <Plus size={26} color="#34d399" />
            <span>New sale</span>
          </button>
        </div>

        {/* Row 2: Payment / Quick Tender Mode Tiles (Cash, JazzCash, Easypaisa, Bank, Card, Khata) */}
        <div className="aronium-grid-3">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'cash' ? 'selected' : ''}`}
          >
            <span className="aronium-tile-badge">F12</span>
            <span>Cash</span>
          </button>

          <button
            onClick={() => setPaymentMethod('jazzcash')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'jazzcash' ? 'selected' : ''}`}
          >
            <span>JAZZCASH</span>
          </button>

          <button
            onClick={() => setPaymentMethod('easypaisa')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'easypaisa' ? 'selected' : ''}`}
          >
            <span>EASYPAISA</span>
          </button>

          <button
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
          >
            <span>BANK TRANSFER</span>
          </button>

          <button
            onClick={() => setPaymentMethod('card')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'card' ? 'selected' : ''}`}
          >
            <span>Card</span>
          </button>

          <button
            onClick={() => setPaymentMethod('khata')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'khata' ? 'selected' : ''}`}
          >
            <span>Khata (Credit)</span>
          </button>
        </div>

        {/* Subtle Brand Watermark */}
        <div className="aronium-watermark" style={{ letterSpacing: '0.2em' }}>
          MADINA HONDA
        </div>

        {/* Row 3 & 4: Lower Function Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          
          {/* Service Type Tile */}
          <button onClick={() => setShowServiceTypeModal(true)} className="aronium-tile-btn">
            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-blue)' }}>?</span>
            <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>
              {serviceType === 'inhouse' ? 'Workshop Bike' : serviceType === 'b2b_wholesale' ? 'B2B Wholesale' : 'Service type'}
            </span>
          </button>

          {/* F2 Discount */}
          <button onClick={() => setShowDiscountModal(true)} className="aronium-tile-btn">
            <span className="aronium-tile-badge">F2</span>
            <Percent size={20} color="#f59e0b" />
            <span>Discount</span>
          </button>

          {/* Price Override */}
          <button onClick={() => alert('Price override mode')} className="aronium-tile-btn">
            <Tag size={20} color="#94a3b8" />
            <span>Price</span>
          </button>

          {/* Customer */}
          <button onClick={() => setShowCustomerModal(true)} className="aronium-tile-btn">
            <User size={20} color="#60a5fa" />
            <span>Customer</span>
          </button>

          {/* Cash Drawer */}
          <button
            onClick={() => alert('Cash Drawer kick signal sent to printer')}
            className="aronium-tile-btn"
          >
            <DollarSign size={20} color="#34d399" />
            <span>Cash drawer</span>
          </button>

          {/* F9 Save Sale (Park/Hold) */}
          <button
            onClick={() => {
              if (cart.length > 0) alert('Sale parked & saved on hold!');
            }}
            className="aronium-tile-btn"
          >
            <span className="aronium-tile-badge">F9</span>
            <Bookmark size={20} color="#c084fc" />
            <span>Save sale</span>
          </button>

          {/* Refund */}
          <button onClick={() => alert('Refund / Return mode active')} className="aronium-tile-btn">
            <RotateCcw size={20} color="#f87171" />
            <span>Refund</span>
          </button>

          {/* Transfer */}
          <button onClick={() => alert('Order transfer')} className="aronium-tile-btn">
            <ArrowRightLeft size={20} color="#94a3b8" />
            <span>Transfer</span>
          </button>

          {/* Lock Screen */}
          <button onClick={onOpenShiftModal} className="aronium-tile-btn">
            <Lock size={20} color="#fbbf24" />
            <span>Lock</span>
          </button>

          {/* F10 Big Green Payment Button */}
          <button onClick={handleOpenPayment} className="btn-aronium-payment">
            <span style={{
              fontSize: '10.5px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '4px'
            }}>
              F10 • TENDER
            </span>
            <span style={{ fontSize: '19px', fontWeight: '800', letterSpacing: '-0.01em' }}>Pay &amp; Print</span>
          </button>

          {/* Void Order (Red) */}
          <button onClick={handleNewSale} className="btn-aronium-void">
            <Trash2 size={19} />
            <span>Void order</span>
          </button>

        </div>

      </section>

      {/* ================= MODAL: F3 PRODUCT SEARCH ================= */}
      {showSearchModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Search Products Catalog (F3)</h3>
              <button onClick={() => setShowSearchModal(false)} className="btn-outline" style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                autoFocus
                placeholder="Type part name, Honda OEM number, compatible model..."
                className="form-input"
                style={{ fontSize: '15px', padding: '10px 14px', marginBottom: '14px' }}
                value={searchInput}
                onChange={handleSearchChange}
              />
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Model</th>
                      <th>Rack</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchResults.length > 0 ? searchResults : allProducts).slice(0, 20).map(p => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.part_number}</div>
                        </td>
                        <td><span className="card-badge badge-blue">{p.model_compat}</span></td>
                        <td>{p.shelf_location || '—'}</td>
                        <td>
                          <span className={`card-badge ${p.stock_quantity <= p.min_stock_alert ? 'badge-red' : 'badge-emerald'}`}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>
                          PKR {serviceType === 'b2b_wholesale' ? p.wholesale_price : p.retail_price}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              addItemToCart(p);
                              setShowSearchModal(false);
                            }}
                            className="btn btn-primary btn-sm"
                            disabled={p.stock_quantity <= 0}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: F4 QUANTITY CHANGE ================= */}
      {showQtyModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '340px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Change Item Quantity (F4)</h3>
              <button onClick={() => setShowQtyModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                {cart[selectedItemIndex]?.name}
              </div>
              <input
                type="number"
                min="1"
                autoFocus
                className="form-input"
                style={{ fontSize: '26px', textAlign: 'center', fontWeight: '800' }}
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyQty()}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowQtyModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleApplyQty} className="btn btn-primary">Apply Quantity</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: F2 DISCOUNT ================= */}
      {showDiscountModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Apply Discount (F2)</h3>
              <button onClick={() => setShowDiscountModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <label className="form-label">Discount Amount in PKR</label>
              <input
                type="number"
                min="0"
                autoFocus
                className="form-input"
                style={{ fontSize: '20px', fontWeight: '700' }}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => { setDiscountValue(0); setShowDiscountModal(false); }} className="btn btn-secondary">Clear</button>
              <button onClick={() => setShowDiscountModal(false)} className="btn btn-primary">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SERVICE TYPE SELECTION ================= */}
      {showServiceTypeModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Select Service / Transaction Type</h3>
              <button onClick={() => setShowServiceTypeModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={() => { setServiceType('retail'); setSelectedJob(null); setShowServiceTypeModal(false); }}
                className={`aronium-tile-btn ${serviceType === 'retail' ? 'active' : ''}`}
                style={{ minHeight: '52px', flexDirection: 'row', justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
              >
                <ShoppingBag size={20} color="#34d399" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700' }}>1. Counter Parts Retail (Walk-in)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Regular spare parts and engine oil sales</div>
                </div>
              </button>

              <button
                onClick={() => { setServiceType('inhouse'); setShowServiceTypeModal(false); }}
                className={`aronium-tile-btn ${serviceType === 'inhouse' ? 'active' : ''}`}
                style={{ minHeight: '52px', flexDirection: 'row', justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
              >
                <Wrench size={20} color="var(--honda-red)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700' }}>2. In-House Workshop Delivery (Bike on Lift)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Checkout completed repair jobs and print official Gate Pass</div>
                </div>
              </button>

              <button
                onClick={() => { setServiceType('b2b_wholesale'); setSelectedJob(null); setShowServiceTypeModal(false); }}
                className={`aronium-tile-btn ${serviceType === 'b2b_wholesale' ? 'active' : ''}`}
                style={{ minHeight: '52px', flexDirection: 'row', justifyContent: 'flex-start', padding: '12px', gap: '12px' }}
              >
                <Store size={20} color="#38bdf8" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700' }}>3. Local Shop Wholesale (B2B)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Selling parts to third-party repair workshops on wholesale rates</div>
                </div>
              </button>

              {/* If In-House, show active motorcycle list */}
              {serviceType === 'inhouse' && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--aronium-border)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dim)' }}>
                    Select Motorcycle Ready for Collection:
                  </div>
                  {workshopJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setShowServiceTypeModal(false);
                      }}
                      style={{
                        padding: '10px',
                        background: selectedJob && selectedJob.id === job.id ? 'var(--aronium-table-selected)' : 'var(--aronium-bg)',
                        border: '1px solid var(--aronium-border)',
                        borderRadius: '4px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong>{job.reg_number}</strong> ({job.vehicle_model})
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Customer: {job.customer_name} | Mechanic: {job.mechanic_name}
                        </div>
                      </div>
                      <span style={{ fontWeight: '800', color: 'var(--accent-emerald)' }}>
                        PKR {job.grand_total}
                      </span>
                    </div>
                  ))}
                  {workshopJobs.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                      No active workshop bikes ready for checkout.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER SELECTION ================= */}
      {showCustomerModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Select Customer or B2B Shop</h3>
              <button onClick={() => setShowCustomerModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {serviceType === 'b2b_wholesale' ? (
                <div>
                  <label className="form-label">Select Registered Motorcycle Workshop</label>
                  <select
                    className="form-select"
                    value={selectedShop ? selectedShop.id : ''}
                    onChange={(e) => {
                      const s = b2bShops.find(sh => sh.id === Number(e.target.value));
                      setSelectedShop(s);
                    }}
                  >
                    {b2bShops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name} ({s.owner_name}) - Balance: PKR {s.current_balance}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label">Customer Mobile</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      className="form-input"
                      value={selectedCustomer ? selectedCustomer.phone : ''}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      className="form-input"
                      value={selectedCustomer ? selectedCustomer.name : ''}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCustomerModal(false)} className="btn btn-primary">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: F10 PAYMENT CHECKOUT ================= */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>F10 Payment & Checkout</h3>
              <button onClick={() => setShowPaymentModal(false)} className="btn-outline" style={{ border: 'none' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount Due</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-emerald)' }}>
                  PKR {grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'khata'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-outline'}`}
                      style={{ textTransform: 'capitalize', fontSize: '11px', padding: '6px 4px' }}
                    >
                      {m === 'bank_transfer' ? 'Bank Transfer' : m === 'khata' ? 'Khata (Credit)' : m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Cash Received (PKR)</label>
                  <input
                    type="number"
                    autoFocus
                    className="form-input"
                    style={{ fontSize: '22px', fontWeight: '800' }}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Change to Return:</span>
                    <span style={{ fontWeight: '800', color: '#38bdf8' }}>PKR {changeDue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCompleteSale} disabled={loading} className="btn btn-success btn-lg">
                <Printer size={18} /> {loading ? 'Processing...' : 'Complete & Print Bill (F10)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPLETED SALE PRINTABLE RECEIPT MODAL ================= */}
      {completedInvoice && (
        <ThermalReceipt
          invoiceData={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

    </div>
  );
}
