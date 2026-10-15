import React, { useState, useEffect } from 'react';
import {
  Search, X, ShoppingBag, Plus, Percent, Tag, User,
  DollarSign, Bookmark, RotateCcw, Lock, ArrowRightLeft,
  Trash2, Wrench, Store, Printer, RefreshCw, Check,
  Edit3, Minus
} from 'lucide-react';
import ThermalReceipt from '../components/ThermalReceipt';

export default function PosTerminal({
  activeShift,
  onOpenShiftModal,
  onOpenSidebar,
  headerSearch,
  setHeaderSearch,
  onRegisterAddItem,
  onNavigateView,
  onOpenPrintEditor,
  onFocusSearch
}) {
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
  const [showItemEditModal, setShowItemEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editModalTab, setEditModalTab] = useState('all'); // 'all', 'qty', 'price'
  const [customPrice, setCustomPrice] = useState('');
  const [promptOnAdd, setPromptOnAdd] = useState(() => localStorage.getItem('pos_prompt_on_add') === 'true');
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
      const res = await fetch('/api/workshop/jobs');
      const data = await res.json();
      const openJobs = data.filter(j => j.status === 'ready' || j.status === 'in_progress');
      setWorkshopJobs(openJobs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchB2BShops = async () => {
    try {
      const res = await fetch('/api/khata/b2b-shops');
      const data = await res.json();
      setB2bShops(data);
      if (data.length > 0 && !selectedShop) {
        setSelectedShop(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select Full Workshop Job Card with fitted parts
  const handleSelectWorkshopJob = async (job) => {
    try {
      const res = await fetch(`/api/workshop/jobs/${job.id}`);
      const fullJob = await res.json();
      setSelectedJob(fullJob);
      setCart([]);
    } catch (err) {
      console.error(err);
      setSelectedJob(job);
      setCart([]);
    }
  };

  // Dynamic Wholesale Volume Slab Pricing Resolver
  const getProductUnitPrice = (product, qty = 1, stream = serviceType) => {
    if (!product) return 0;
    if (stream !== 'b2b_wholesale') {
      return Number(product.retail_price) || 0;
    }
    // Check if product has volume wholesale slabs from June price list
    if (product.slabs && product.slabs.length > 0) {
      const matchingSlab = [...product.slabs]
        .filter(s => qty >= s.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0];
      if (matchingSlab && matchingSlab.dealer_price) {
        return Number(matchingSlab.dealer_price);
      }
    }
    return Number(product.wholesale_price) || Number(product.retail_price) || 0;
  };

  // Switch 3-in-1 POS Stream Mode
  const handleSelectServiceType = (type) => {
    setServiceType(type);
    if (type === 'retail') {
      setSelectedJob(null);
      // Recalculate cart items with retail prices
      setCart(prev => prev.map(item => {
        const prod = allProducts.find(p => p.id === item.product_id) || item;
        const price = prod.retail_price || item.unit_price;
        return { ...item, unit_price: price, total_price: item.quantity * price };
      }));
    } else if (type === 'inhouse') {
      setSelectedShop(null);
      fetchWorkshopJobs();
    } else if (type === 'b2b_wholesale') {
      setSelectedJob(null);
      if (!selectedShop && b2bShops.length > 0) {
        setSelectedShop(b2bShops[0]);
      }
      setPaymentMethod('khata');
      // Recalculate cart items with wholesale slab prices
      setCart(prev => prev.map(item => {
        const prod = allProducts.find(p => p.id === item.product_id) || item;
        const price = getProductUnitPrice(prod, item.quantity, 'b2b_wholesale');
        return { ...item, unit_price: price, total_price: item.quantity * price };
      }));
    }
  };

  // Sync with headerSearch from App.jsx if provided
  useEffect(() => {
    if (headerSearch !== undefined && headerSearch !== null) {
      setSearchInput(headerSearch);
      if (!headerSearch.trim()) {
        setSearchResults([]);
        return;
      }
      const q = headerSearch.toLowerCase();
      const matches = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.part_number.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
      setSearchResults(matches.slice(0, 8));
    }
  }, [headerSearch, allProducts]);

  // Keyboard Shortcuts (F3: Search, F4: Quantity, F8: New Sale, F2: Discount, F10: Payment, Delete, Alt+1/2/3 Streams)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        handleSelectServiceType('retail');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        handleSelectServiceType('inhouse');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        handleSelectServiceType('b2b_wholesale');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (onFocusSearch) {
          onFocusSearch();
        } else {
          setShowSearchModal(true);
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenItemEdit(selectedItemIndex, 'qty');
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenItemEdit(selectedItemIndex, 'price');
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
  }, [cart, selectedItemIndex, selectedJob, allProducts, b2bShops]);

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

    const existingIdx = cart.findIndex(item => item.product_id === product.id);
    let itemToCustomize;

    if (existingIdx >= 0) {
      const current = cart[existingIdx];
      if (current.quantity >= product.stock_quantity) {
        alert(`Maximum store stock reached (${product.stock_quantity})`);
        return;
      }
      const nextQty = current.quantity + 1;
      const unitPrice = current.is_price_overridden
        ? current.unit_price
        : getProductUnitPrice(product, nextQty, serviceType);

      itemToCustomize = {
        ...current,
        quantity: nextQty,
        unit_price: unitPrice,
        total_price: nextQty * unitPrice,
        slabs: product.slabs || current.slabs || []
      };

      setCart(prev => {
        const copy = [...prev];
        copy[existingIdx] = itemToCustomize;
        return copy;
      });
      setSelectedItemIndex(existingIdx);
    } else {
      const unitPrice = getProductUnitPrice(product, 1, serviceType);
      itemToCustomize = {
        product_id: product.id,
        part_number: product.part_number,
        name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        original_price: unitPrice,
        total_price: unitPrice,
        unit_cost: product.cost_price,
        stock_quantity: product.stock_quantity,
        slabs: product.slabs || [],
        is_price_overridden: false
      };

      setCart(prev => [...prev, itemToCustomize]);
      setSelectedItemIndex(cart.length);
    }

    // If "Prompt on Add" is enabled, immediately prompt to change price and select quantity
    if (promptOnAdd && itemToCustomize) {
      setEditingItem(itemToCustomize);
      setNewQty(String(itemToCustomize.quantity));
      setCustomPrice(String(itemToCustomize.unit_price));
      setEditModalTab('all');
      setShowItemEditModal(true);
    }
  };

  // Toggle "Prompt Price & Qty on Add" setting
  const handleTogglePromptOnAdd = () => {
    setPromptOnAdd(prev => {
      const next = !prev;
      localStorage.setItem('pos_prompt_on_add', String(next));
      return next;
    });
  };

  // Open Item Customization Modal (Price, Quantity, or Both)
  const handleOpenItemEdit = (index, tab = 'all') => {
    const item = cart[index];
    if (!item) return;
    setSelectedItemIndex(index);
    setEditingItem(item);
    setNewQty(String(item.quantity));
    setCustomPrice(String(item.unit_price));
    setEditModalTab(tab);
    setShowItemEditModal(true);
  };

  // Apply Price & Quantity Changes from Modal
  const handleApplyItemCustomization = () => {
    const qty = parseInt(newQty);
    const price = parseFloat(customPrice);

    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity of 1 or more.');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price in PKR.');
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      const targetItem = editingItem || updated[selectedItemIndex];
      const idx = targetItem
        ? updated.findIndex(i => i.product_id === targetItem.product_id)
        : selectedItemIndex;

      if (idx >= 0 && updated[idx]) {
        const item = updated[idx];
        if (qty > item.stock_quantity) {
          alert(`Warning: Only ${item.stock_quantity} available in stock!`);
        }
        const originalPrice = item.original_price || item.unit_price;
        const isOverridden = Math.abs(price - originalPrice) > 0.01;
        updated[idx] = {
          ...item,
          quantity: qty,
          unit_price: price,
          total_price: qty * price,
          is_price_overridden: isOverridden
        };
        setSelectedItemIndex(idx);
      }
      return updated;
    });

    setShowItemEditModal(false);
    setEditingItem(null);
  };

  // Direct Inline Quantity Stepper (+ / -) on Cart Rows
  const handleUpdateItemQty = (index, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      setSelectedItemIndex(prev => Math.max(0, prev - 1));
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      if (newQuantity > item.stock_quantity) {
        alert(`Maximum store stock reached (${item.stock_quantity})`);
        return prev;
      }
      const prod = allProducts.find(p => p.id === item.product_id) || item;
      const unitPrice = item.is_price_overridden
        ? item.unit_price
        : getProductUnitPrice(prod, newQuantity, serviceType);

      updated[index] = {
        ...item,
        quantity: newQuantity,
        unit_price: unitPrice,
        total_price: newQuantity * unitPrice
      };
      return updated;
    });
  };

  // Legacy F4 Qty Handler
  const handleApplyQty = () => {
    handleApplyItemCustomization();
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
    <div className="pos-terminal-root">
      <div className="aronium-pos-container">
        
        {/* ================= LEFT RECEIPT / ORDER TABLE ================= */}
        <section className="aronium-receipt-area">
          
          {/* ================= 3-IN-1 STREAM SEGMENTED TABS ================= */}
          <div className="pos-stream-tabs">
            <button
              type="button"
              onClick={() => handleSelectServiceType('retail')}
              className={`pos-stream-tab ${serviceType === 'retail' ? 'active-retail' : ''}`}
              title="Counter Retail Parts (Alt+1)"
            >
              <ShoppingBag size={14} />
              <span>Counter Retail</span>
              <span className="tab-kbd">Alt+1</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectServiceType('inhouse')}
              className={`pos-stream-tab ${serviceType === 'inhouse' ? 'active-workshop' : ''}`}
              title="Workshop Delivery & Gate Pass (Alt+2)"
            >
              <Wrench size={14} />
              <span>Workshop Delivery</span>
              {workshopJobs.length > 0 && (
                <span className="tab-ready-badge">{workshopJobs.length} Ready</span>
              )}
              <span className="tab-kbd">Alt+2</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectServiceType('b2b_wholesale')}
              className={`pos-stream-tab ${serviceType === 'b2b_wholesale' ? 'active-b2b' : ''}`}
              title="Wholesale Dealers B2B (Alt+3)"
            >
              <Store size={14} />
              <span>Wholesale (B2B)</span>
              <span className="tab-kbd">Alt+3</span>
            </button>
          </div>

          {/* Stream Context Sub-Bar */}
          <div className="pos-stream-context">
            {serviceType === 'retail' && (
              <>
                <div className="context-left">
                  <span className="context-label">Customer:</span>
                  <span className="context-name">
                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                  </span>
                  {selectedCustomer?.phone && (
                    <span className="context-sub">({selectedCustomer.phone})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className="context-action-btn"
                  >
                    <User size={11} /> {selectedCustomer ? 'Change' : 'Assign'}
                  </button>
                </div>
                <div className="context-right">
                  <span className="context-pill pill-retail-mrp">Retail MRP Active</span>
                </div>
              </>
            )}

            {serviceType === 'inhouse' && (
              <>
                <div className="context-left">
                  {selectedJob ? (
                    <span className="context-bike-active">
                      🏍️ <strong>{selectedJob.reg_number}</strong> ({selectedJob.vehicle_model}) • Job #{selectedJob.job_number}
                    </span>
                  ) : (
                    <span className="context-warning">
                      ⚠️ Select a motorcycle below to load Job Card:
                    </span>
                  )}
                </div>
                <div className="context-right">
                  {selectedJob && (
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="context-action-btn"
                    >
                      ⇄ Switch Bike
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={fetchWorkshopJobs}
                    className="context-action-btn"
                    title="Refresh open workshop jobs"
                  >
                    ↻ Refresh
                  </button>
                  <span className="context-pill pill-gate-pass">Gate Pass Delivery</span>
                </div>
              </>
            )}

            {serviceType === 'b2b_wholesale' && (
              <>
                <div className="context-left">
                  <span className="context-label">Dealer:</span>
                  <select
                    className="context-dealer-select"
                    value={selectedShop ? selectedShop.id : ''}
                    onChange={(e) => {
                      const shop = b2bShops.find(s => s.id === Number(e.target.value));
                      setSelectedShop(shop || null);
                    }}
                  >
                    {b2bShops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name} ({s.owner_name})
                      </option>
                    ))}
                  </select>
                  {selectedShop && (
                    <span className="context-khata">
                      Khata: <strong>PKR {selectedShop.current_balance}</strong>
                    </span>
                  )}
                </div>
                <div className="context-right">
                  <span className="context-pill pill-b2b-trade">Trade Rates Active</span>
                </div>
              </>
            )}
          </div>

          {/* Table Columns Header */}
          <div className="aronium-table-header">
            <div className="col-prod-name">Product name</div>
            <div className="col-qty">Quantity</div>
            <div className="col-price">Price</div>
            <div className="col-amount">Amount</div>
          </div>

          {/* Table Items Body */}
          <div className="aronium-table-body">
            {serviceType === 'inhouse' ? (
              selectedJob ? (
                /* In-House Workshop Active Job View */
                <div style={{ padding: '16px' }}>
                  <div style={{ background: 'var(--aronium-surface)', border: '1px solid var(--aronium-border)', borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--honda-red)' }}>
                        {selectedJob.reg_number} ({selectedJob.vehicle_model})
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="card-badge badge-purple">Job #{selectedJob.job_number}</span>
                        <span className="card-badge badge-blue">Gate Pass: {selectedJob.gate_pass_code}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Customer: <strong>{selectedJob.customer_name}</strong> ({selectedJob.customer_phone}) | Mechanic: <strong>{selectedJob.mechanic_name}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Parts Fitted by Mechanic ({selectedJob.parts ? selectedJob.parts.length : 0}):
                  </div>
                  {selectedJob.parts && selectedJob.parts.length > 0 ? (
                    selectedJob.parts.map((p, idx) => (
                      <div key={idx} className="aronium-row">
                        <div className="col-prod-name">
                          <strong>{p.part_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.part_number}</div>
                        </div>
                        <div className="col-qty">{p.quantity}</div>
                        <div className="col-price">{Number(p.unit_price).toFixed(2)}</div>
                        <div className="col-amount">{Number(p.total_price).toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                      No replacement parts billed for this job.
                    </div>
                  )}

                  <div className="aronium-row" style={{ background: 'rgba(0, 120, 212, 0.1)', color: '#38bdf8', marginTop: '8px' }}>
                    <div className="col-prod-name">
                      <strong>Work & Dynamic Labor Charges</strong>
                      <div style={{ fontSize: '11px' }}>{selectedJob.work_type}</div>
                    </div>
                    <div className="col-qty">1</div>
                    <div className="col-price">{Number(selectedJob.dynamic_labor_amount || 0).toFixed(2)}</div>
                    <div className="col-amount">{Number(selectedJob.dynamic_labor_amount || 0).toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                /* Interactive Workshop Jobs Picker when no bike is selected */
                <div className="workshop-jobs-picker">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--aronium-border)'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wrench size={17} color="var(--honda-red)" />
                        Motorcycles in Workshop Ready for Delivery ({workshopJobs.length})
                      </h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Select any repaired motorcycle to load fitted parts, dynamic labor, and print official Gate Pass.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchWorkshopJobs}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      ↻ Refresh
                    </button>
                  </div>

                  {workshopJobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <Wrench size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#f59e0b' }} />
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                        No Active Workshop Bikes
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        All workshop bikes have been checked out, or a new intake needs to be recorded.
                      </div>
                      {onNavigateView && (
                        <button
                          type="button"
                          onClick={() => onNavigateView('workshop')}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '16px', fontSize: '12px' }}
                        >
                          Go to Workshop Lift Bays &amp; Intake
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {workshopJobs.map(job => (
                        <div
                          key={job.id}
                          onClick={() => handleSelectWorkshopJob(job)}
                          className="workshop-job-card"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              background: 'rgba(225, 29, 72, 0.15)',
                              border: '1px solid rgba(225, 29, 72, 0.3)',
                              color: '#fb7185',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontWeight: '900',
                              fontSize: '15px',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {job.reg_number}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
                                {job.vehicle_model} <span className="card-badge badge-purple" style={{ fontSize: '10px', marginLeft: '6px' }}>Job #{job.job_number}</span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                Customer: <strong>{job.customer_name}</strong> ({job.customer_phone}) • Mechanic: <strong>{job.mechanic_name}</strong>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Work: {job.work_type} • Fuel: {job.fuel_level}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                              PKR {job.grand_total ? Number(job.grand_total).toFixed(2) : '0.00'}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectWorkshopJob(job);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                            >
                              ✔ Load for Delivery
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : cart.length === 0 ? (
              headerSearch && headerSearch.trim() ? (
                /* Instant Search Results Panel in Receipt View */
                <div style={{ padding: '16px', overflowY: 'auto', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--aronium-border)' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                        Search matches for "{headerSearch}"
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        ({searchResults.length} {searchResults.length === 1 ? 'part' : 'parts'} found)
                      </span>
                    </div>
                    {setHeaderSearch && (
                      <button
                        onClick={() => setHeaderSearch('')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>

                  {searchResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>No products matching "{headerSearch}"</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Check spelling, part number or barcode. Or press F3 for full catalog.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResults.map(p => {
                        const price = serviceType === 'b2b_wholesale' ? p.wholesale_price : p.retail_price;
                        const isOutOfStock = p.stock_quantity <= 0;
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--aronium-surface)',
                              border: '1px solid var(--aronium-border)',
                              borderRadius: '6px',
                              padding: '10px 14px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>{p.name}</span>
                                {p.model_compat && (
                                  <span className="card-badge badge-blue" style={{ fontSize: '9px', padding: '1px 5px' }}>{p.model_compat}</span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#fb7185' }}>{p.part_number}</span>
                                {p.shelf_location && <span>📍 {p.shelf_location}</span>}
                                <span>Stock: <strong style={{ color: isOutOfStock ? '#ef4444' : '#10b981' }}>{p.stock_quantity}</strong></span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                                PKR {price}
                              </span>
                              <button
                                onClick={() => {
                                  addItemToCart(p);
                                  if (setHeaderSearch) setHeaderSearch('');
                                }}
                                disabled={isOutOfStock}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '11.5px', padding: '6px 14px', gap: '6px' }}
                              >
                                <Plus size={13} />
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Composed Tactile Empty State for Retail & Wholesale */
                <div className="aronium-empty-state">
                  <div className="aronium-empty-icon">
                    {serviceType === 'b2b_wholesale' ? <Store size={28} /> : <ShoppingBag size={28} />}
                  </div>
                  <div className="aronium-empty-title">
                    {serviceType === 'b2b_wholesale'
                      ? `Wholesale Order for ${selectedShop ? selectedShop.shop_name : 'Partner Dealer'}`
                      : 'Register Ready for Next Customer'}
                  </div>
                  <div className="aronium-empty-subtitle">
                    {serviceType === 'b2b_wholesale'
                      ? 'Scan barcode or click fast-mover parts below to add on wholesale trade pricing:'
                      : 'Scan barcode, search with F3, or click an essential Atlas Honda fast-mover below:'}
                  </div>

                  {/* Fast-Mover Quick-Add Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '460px', marginTop: '16px' }}>
                    {allProducts.slice(0, 4).map(p => {
                      const price = serviceType === 'b2b_wholesale' ? p.wholesale_price : p.retail_price;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addItemToCart(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '6px 12px', gap: '6px', background: 'var(--aronium-surface)', borderColor: 'var(--aronium-border-light)' }}
                          title={`Add ${p.name} - PKR ${price}`}
                        >
                          <Plus size={12} color="var(--accent-emerald)" />
                          <span>{p.name.length > 22 ? p.name.slice(0, 22) + '...' : p.name}</span>
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>Rs {price}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '14px', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F3</kbd> Search</span>
                    <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F12</kbd> Cash</span>
                    <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F10</kbd> Payment</span>
                    <span><kbd style={{ background: 'var(--aronium-surface)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--aronium-border)', fontFamily: 'var(--font-mono)' }}>F8</kbd> New</span>
                  </div>
                </div>
              )
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600' }}>{item.name}</span>
                        {item.is_price_overridden && (
                          <span className="card-badge badge-amber" style={{ fontSize: '9px', padding: '1px 5px' }} title="Price overridden by cashier">
                            Custom Price
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#cbd5e1' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.part_number}</span>
                        {serviceType === 'b2b_wholesale' && item.slabs && item.slabs.length > 1 && (
                          (() => {
                            const activeSlab = [...item.slabs].filter(s => item.quantity >= s.min_quantity).sort((a,b) => b.min_quantity - a.min_quantity)[0];
                            return activeSlab && activeSlab.min_quantity > 1 ? (
                              <span className="card-badge badge-emerald" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                Slab {activeSlab.min_quantity}+ Applied
                              </span>
                            ) : null;
                          })()
                        )}
                      </div>
                    </div>

                    {/* Quantity with inline steppers & click-to-select */}
                    <div className="col-qty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                      <button
                        type="button"
                        className="btn-stepper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateItemQty(idx, item.quantity - 1);
                        }}
                        title="Decrease quantity"
                      >
                        <Minus size={11} />
                      </button>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItemEdit(idx, 'qty');
                        }}
                        style={{
                          cursor: 'pointer',
                          minWidth: '22px',
                          textAlign: 'center',
                          fontWeight: '700',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.04)'
                        }}
                        title="Click to select quantity"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="btn-stepper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateItemQty(idx, item.quantity + 1);
                        }}
                        title="Increase quantity"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Price with click-to-edit */}
                    <div
                      className="col-price"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItemEdit(idx, 'price');
                      }}
                      style={{
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}
                      title="Click to change price"
                    >
                      <span style={{ borderBottom: '1px dashed var(--aronium-border-light)', paddingBottom: '1px', color: item.is_price_overridden ? '#38bdf8' : 'inherit' }}>
                        {item.unit_price.toFixed(2)}
                      </span>
                      <Edit3 size={11} style={{ opacity: 0.5, color: item.is_price_overridden ? '#38bdf8' : 'inherit' }} />
                    </div>

                    <div className="col-amount" style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                      {item.total_price.toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Selected Item Quick-Action Toolbar */}
          {cart.length > 0 && cart[selectedItemIndex] && (
            <div className="cart-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Item:</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cart[selectedItemIndex].name}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                  (Rs {cart[selectedItemIndex].unit_price} × {cart[selectedItemIndex].quantity})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleOpenItemEdit(selectedItemIndex, 'price')}
                  className="btn btn-outline btn-xs"
                  style={{ fontSize: '11px', padding: '3px 8px', gap: '4px', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                  title="Change unit price for this item (F6)"
                >
                  <Tag size={12} />
                  <span>Change Price</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenItemEdit(selectedItemIndex, 'qty')}
                  className="btn btn-outline btn-xs"
                  style={{ fontSize: '11px', padding: '3px 8px', gap: '4px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                  title="Select quantity for this item (F4)"
                >
                  <ShoppingBag size={12} />
                  <span>Select Qty</span>
                </button>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: promptOnAdd ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    marginLeft: '4px',
                    background: promptOnAdd ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid ' + (promptOnAdd ? 'rgba(56, 189, 248, 0.3)' : 'transparent')
                  }}
                  title="When turned on, adding any product opens the Price & Quantity window automatically"
                >
                  <input
                    type="checkbox"
                    checked={promptOnAdd}
                    onChange={handleTogglePromptOnAdd}
                    style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span>Prompt on Add</span>
                </label>
              </div>
            </div>
          )}

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
          <button onClick={handleDeleteItem} className="aronium-tile-btn tile-delete" title="Delete selected item (Delete)">
            <X size={20} color="#94a3b8" />
            <span>Delete</span>
          </button>

          <button onClick={() => { if (onFocusSearch) { onFocusSearch(); } else { setShowSearchModal(true); } }} className="aronium-tile-btn" title="Search products catalog (F3)">
            <span className="aronium-tile-badge">F3</span>
            <Search size={20} color="#38bdf8" />
            <span>Search</span>
          </button>

          <button
            onClick={() => {
              if (cart.length > 0) {
                handleOpenItemEdit(selectedItemIndex, 'qty');
              } else {
                alert('Add an item to cart first to select quantity.');
              }
            }}
            className="aronium-tile-btn"
            title="Change item quantity (F4)"
          >
            <span className="aronium-tile-badge">F4</span>
            <ShoppingBag size={20} color="#f59e0b" />
            <span>Quantity</span>
          </button>

          <button onClick={handleNewSale} className="aronium-tile-btn" title="Start new clean sale (F8)">
            <span className="aronium-tile-badge">F8</span>
            <Plus size={20} color="#34d399" />
            <span>New sale</span>
          </button>
        </div>

        {/* Row 2: Payment / Tender Selection (Cash, Card, Bank Transfer, JazzCash, EasyPaisa, Khata) */}
        <div className="aronium-grid-3">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'cash' ? 'selected' : ''}`}
            title="Tender as Cash (F12)"
          >
            <span className="aronium-tile-badge">F12</span>
            <span>Cash</span>
          </button>

          <button
            onClick={() => setPaymentMethod('card')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'card' ? 'selected' : ''}`}
            title="Tender via POS Card Machine"
          >
            <span>Card</span>
          </button>

          <button
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
            title="Tender via Bank Online Transfer"
          >
            <span>Bank Transfer</span>
          </button>

          <button
            onClick={() => setPaymentMethod('jazzcash')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'jazzcash' ? 'selected' : ''}`}
            title="Tender via JazzCash QR / Wallet"
          >
            <span>JazzCash</span>
          </button>

          <button
            onClick={() => setPaymentMethod('easypaisa')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'easypaisa' ? 'selected' : ''}`}
            title="Tender via EasyPaisa"
          >
            <span>EasyPaisa</span>
          </button>

          <button
            onClick={() => setPaymentMethod('khata')}
            className={`aronium-tile-btn payment-tile ${paymentMethod === 'khata' ? 'selected' : ''}`}
            title="Charge to Customer/Dealer Khata ledger"
          >
            <span>Khata (Credit)</span>
          </button>
        </div>

        {/* Row 3: Standard POS Operations (Discount F2, Customer, Cash Drawer, Save Sale F9) */}
        <div className="aronium-grid-4">
          <button onClick={() => setShowDiscountModal(true)} className="aronium-tile-btn" title="Add Discount (F2)">
            <span className="aronium-tile-badge">F2</span>
            <Percent size={18} color="#f59e0b" />
            <span>Discount</span>
          </button>

          <button onClick={() => setShowCustomerModal(true)} className="aronium-tile-btn" title="Select Customer / Dealer">
            <User size={18} color="#60a5fa" />
            <span>Customer</span>
          </button>

          <button
            onClick={() => alert('Cash Drawer kick signal sent to receipt printer')}
            className="aronium-tile-btn"
            title="Open Cash Drawer"
          >
            <DollarSign size={18} color="#34d399" />
            <span>Cash drawer</span>
          </button>

          <button
            onClick={() => {
              if (cart.length > 0) alert('Sale parked & saved on hold!');
            }}
            className="aronium-tile-btn"
            title="Park & Save Sale (F9)"
          >
            <span className="aronium-tile-badge">F9</span>
            <Bookmark size={18} color="#c084fc" />
            <span>Save sale</span>
          </button>
        </div>

        {/* Row 4: Auxiliary Functions (Refund, Transfer, Lock, Price) */}
        <div className="aronium-grid-4">
          <button onClick={() => alert('Refund / Return mode active')} className="aronium-tile-btn" title="Process Refund">
            <RotateCcw size={18} color="#f87171" />
            <span>Refund</span>
          </button>

          <button onClick={() => alert('Order transfer to another counter')} className="aronium-tile-btn" title="Transfer Order">
            <ArrowRightLeft size={18} color="#94a3b8" />
            <span>Transfer</span>
          </button>

          <button onClick={onOpenShiftModal} className="aronium-tile-btn" title="Lock Register / Shift Status">
            <Lock size={18} color="#fbbf24" />
            <span>Lock</span>
          </button>

          <button
            onClick={() => {
              if (cart.length > 0) {
                handleOpenItemEdit(selectedItemIndex, 'price');
              } else {
                alert('Add an item to cart first to change its price.');
              }
            }}
            className="aronium-tile-btn"
            title="Change item price / Price override (F6)"
          >
            <span className="aronium-tile-badge">F6</span>
            <Tag size={18} color="#38bdf8" />
            <span>Price</span>
          </button>
        </div>

        {/* Row 5: Bottom Command Row (F10 Pay & Print + Void Order) */}
        <div className="aronium-bottom-actions">
          <button onClick={handleOpenPayment} className="btn-aronium-payment" title="Tender, Checkout & Print (F10)">
            <span className="tender-badge">F10 • TENDER</span>
            <span className="tender-label">Pay &amp; Print</span>
          </button>

          <button onClick={handleNewSale} className="btn-aronium-void" title="Void current order">
            <Trash2 size={18} />
            <span>Void order</span>
          </button>
        </div>

      </section>
    </div>

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

      {/* ================= MODAL: CUSTOMIZE ITEM PRICE & QUANTITY ================= */}
      {showItemEditModal && (() => {
        const currentItem = editingItem || cart[selectedItemIndex];
        if (!currentItem) return null;
        return (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800' }}>
                    {currentItem.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                    <span>Part: <strong style={{ color: '#fb7185' }}>{currentItem.part_number}</strong></span>
                    <span>Stock: <strong style={{ color: '#34d399' }}>{currentItem.stock_quantity} available</strong></span>
                  </div>
                </div>
                <button onClick={() => { setShowItemEditModal(false); setEditingItem(null); }} className="btn-outline" style={{ border: 'none' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--aronium-bg)', borderBottom: '1px solid var(--aronium-border)' }}>
                <button
                  type="button"
                  className={`item-edit-tab ${editModalTab === 'all' ? 'active' : ''}`}
                  onClick={() => setEditModalTab('all')}
                >
                  Price &amp; Quantity
                </button>
                <button
                  type="button"
                  className={`item-edit-tab ${editModalTab === 'qty' ? 'active' : ''}`}
                  onClick={() => setEditModalTab('qty')}
                >
                  Selecting Quantity
                </button>
                <button
                  type="button"
                  className={`item-edit-tab ${editModalTab === 'price' ? 'active' : ''}`}
                  onClick={() => setEditModalTab('price')}
                >
                  Change Price
                </button>
              </div>

              <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Quantity Section */}
                {(editModalTab === 'all' || editModalTab === 'qty') && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: '700' }}>
                        Selecting Quantity
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Store Stock: {currentItem.stock_quantity}
                      </span>
                    </div>

                    {/* Quantity Stepper & Direct Input */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '800' }}
                        onClick={() => setNewQty(q => String(Math.max(1, (parseInt(q) || 1) - 5)))}
                        title="-5"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '800' }}
                        onClick={() => setNewQty(q => String(Math.max(1, (parseInt(q) || 1) - 1)))}
                        title="-1"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ flex: 1, fontSize: '20px', textAlign: 'center', fontWeight: '800', fontFamily: 'var(--font-mono)' }}
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyItemCustomization();
                          }
                        }}
                        autoFocus={editModalTab === 'qty'}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '800' }}
                        onClick={() => setNewQty(q => String(Math.min(currentItem.stock_quantity, (parseInt(q) || 0) + 1)))}
                        title="+1"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontWeight: '800' }}
                        onClick={() => setNewQty(q => String(Math.min(currentItem.stock_quantity, (parseInt(q) || 0) + 5)))}
                        title="+5"
                      >
                        +5
                      </button>
                    </div>

                    {/* Quick Preset Quantity Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[1, 2, 3, 4, 5, 10, 12, 20, 50].map(qtyVal => (
                        <button
                          key={qtyVal}
                          type="button"
                          onClick={() => setNewQty(String(qtyVal))}
                          className="quick-chip"
                          style={{
                            background: parseInt(newQty) === qtyVal ? 'rgba(56, 189, 248, 0.2)' : 'var(--aronium-surface)',
                            borderColor: parseInt(newQty) === qtyVal ? 'var(--accent-blue)' : 'var(--aronium-border)'
                          }}
                        >
                          {qtyVal}{qtyVal === 12 ? ' (Doz)' : ''}
                        </button>
                      ))}
                    </div>

                    {/* Wholesale slab hint if applicable */}
                    {serviceType === 'b2b_wholesale' && currentItem?.slabs?.length > 1 && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'var(--aronium-bg)', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--aronium-border)' }}>
                        <div style={{ fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '3px' }}>Wholesale Volume Slabs:</div>
                        {currentItem.slabs.map((s, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: parseInt(newQty) >= s.min_quantity ? '#34d399' : 'var(--text-muted)' }}>
                            <span>Qty ≥ {s.min_quantity} pcs:</span>
                            <strong>PKR {s.dealer_price}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Section */}
                {(editModalTab === 'all' || editModalTab === 'price') && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: '700' }}>
                        Change Unit Price (PKR)
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Original MRP: <strong>PKR {currentItem.original_price || currentItem.unit_price}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        PKR
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        style={{ flex: 1, fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyItemCustomization();
                          }
                        }}
                        autoFocus={editModalTab === 'price'}
                      />
                    </div>

                    {/* Price Quick Adjustment Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = Number(currentItem.original_price || currentItem.unit_price);
                          setCustomPrice(String(Math.max(0, orig - 10)));
                        }}
                        className="quick-chip chip-discount"
                      >
                        -Rs 10
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = Number(currentItem.original_price || currentItem.unit_price);
                          setCustomPrice(String(Math.max(0, orig - 20)));
                        }}
                        className="quick-chip chip-discount"
                      >
                        -Rs 20
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = Number(currentItem.original_price || currentItem.unit_price);
                          setCustomPrice(String(Math.max(0, Math.round(orig * 0.95))));
                        }}
                        className="quick-chip chip-discount"
                      >
                        -5%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = Number(currentItem.original_price || currentItem.unit_price);
                          setCustomPrice(String(Math.max(0, Math.round(orig * 0.90))));
                        }}
                        className="quick-chip chip-discount"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = currentItem.original_price || currentItem.unit_price;
                          setCustomPrice(String(orig));
                        }}
                        className="quick-chip chip-reset"
                        title="Reset back to standard MRP"
                      >
                        Reset MRP (Rs {currentItem.original_price || currentItem.unit_price})
                      </button>
                    </div>

                    {/* Below cost alert */}
                    {currentItem.unit_cost && Number(customPrice) < Number(currentItem.unit_cost) && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        ⚠️ Warning: Unit price is below cost (Cost: PKR {currentItem.unit_cost})
                      </div>
                    )}
                  </div>
                )}

                {/* Calculation Preview Banner */}
                <div style={{
                  background: 'var(--aronium-bg)',
                  border: '1px solid var(--aronium-border)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total for this Item:
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                    PKR {((parseInt(newQty) || 1) * (parseFloat(customPrice) || 0)).toFixed(2)}
                  </span>
                </div>

              </div>

              <div className="modal-footer">
                <button onClick={() => { setShowItemEditModal(false); setEditingItem(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleApplyItemCustomization} className="btn btn-primary" style={{ gap: '6px' }}>
                  <Check size={14} />
                  <span>Apply &amp; Update Cart (Enter)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
          onOpenPrintEditor={onOpenPrintEditor}
        />
      )}

    </div>
  );
}
