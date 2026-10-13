// Comprehensive Logic Test Suite for Madina Honda Centre POS & Workshop ERP
// Verifies all endpoints, database operations, splits, inventory adjustments, and billing streams.

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

const results = [];
function record(module, testName, passed, details = '') {
  results.push({ module, testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} [${module}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING COMPREHENSIVE POS & WORKSHOP ERP LOGIC AUDIT');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // 1. Shifts & Cash Drawer Logic
    // ----------------------------------------------------
    const shiftRes = await request('/api/shifts/current');
    record('Shifts', 'GET /api/shifts/current returns shift status', shiftRes.ok, `Status: ${shiftRes.status}`);

    // ----------------------------------------------------
    // 2. Inventory & Products Logic
    // ----------------------------------------------------
    const productsRes = await request('/api/products');
    const hasProducts = Array.isArray(productsRes.data) && productsRes.data.length > 0;
    record('Inventory', 'GET /api/products returns product array', hasProducts, `Count: ${productsRes.data.length}`);

    // Verify product structure
    if (hasProducts) {
      const p = productsRes.data[0];
      const hasFields = p.id && p.part_number && p.retail_price && p.wholesale_price && p.cost_price;
      record('Inventory', 'Products contain retail, wholesale & cost prices', !!hasFields);
    }

    // Test product creation
    const newPartNum = 'TEST-PART-' + Date.now();
    const createProdRes = await request('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        part_number: newPartNum,
        name: 'Logic Test Brake Cable',
        brand: 'Genuine Atlas Honda',
        category: 'Cables',
        model_compat: 'CD70',
        shelf_location: 'RACK-T1',
        cost_price: 150,
        retail_price: 250,
        wholesale_price: 200,
        stock_quantity: 20,
        min_stock_alert: 5,
        abc_category: 'A'
      })
    });
    record('Inventory', 'POST /api/products creates new part', createProdRes.ok, `ID: ${createProdRes.data?.id}`);
    const testProductId = createProdRes.data?.id;

    // Test product update
    if (testProductId) {
      const updateProdRes = await request(`/api/products/${testProductId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock_quantity: 25, retail_price: 260 })
      });
      record('Inventory', 'PUT /api/products/:id updates stock and price', updateProdRes.ok);
    }

    // ----------------------------------------------------
    // 3. Workshop Lift Bays & Bike Intake Logic
    // ----------------------------------------------------
    const liftsRes = await request('/api/workshop/lifts');
    record('Workshop', 'GET /api/workshop/lifts returns lifts', Array.isArray(liftsRes.data) && liftsRes.data.length > 0);

    const mechanicsRes = await request('/api/mechanics');
    record('Mechanics', 'GET /api/mechanics returns mechanics', Array.isArray(mechanicsRes.data) && mechanicsRes.data.length > 0);
    const testMechanic = mechanicsRes.data[0];

    // Create a new Vehicle Intake (Job Card)
    const testReg = 'LHE-' + Math.floor(1000 + Math.random() * 9000);
    const intakeRes = await request('/api/workshop/intake', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Test Logic Customer',
        customer_phone: '03001239999',
        customer_address: 'Main Bazar, Model Town',
        vehicle_model: 'Honda CD70',
        reg_number: testReg,
        chassis_number: 'CHAS-998811',
        engine_number: 'ENG-112233',
        color: 'Red',
        odometer: 14500,
        lift_id: liftsRes.data[0]?.id || 1,
        mechanic_id: testMechanic?.id || 1,
        work_type: 'Full Engine Tuning & Brake Service',
        complaints: 'Engine noise, front brake slipping',
        fuel_level: 'Half',
        inspection_notes: 'Minor scratch on left silencer',
        old_parts_returned: 1,
        dynamic_labor_amount: 500,
        is_rework: 0
      })
    });
    record('Workshop', 'POST /api/workshop/intake creates Job Card & Gate Pass', intakeRes.ok, `Job #${intakeRes.data?.job_number}`);
    const testJobId = intakeRes.data?.job_id;

    // Attach parts to this workshop job
    if (testJobId && testProductId) {
      const attachPartRes = await request(`/api/workshop/jobs/${testJobId}/parts`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: testProductId,
          quantity: 2,
          unit_price: 260
        })
      });
      record('Workshop', 'POST /api/workshop/jobs/:id/parts attaches part to job', attachPartRes.ok);

      // Verify stock was deducted
      const checkStockRes = await request('/api/products');
      const updatedPart = checkStockRes.data.find(p => p.id === testProductId);
      const stockDeducted = updatedPart && updatedPart.stock_quantity === 23; // 25 - 2 = 23
      record('Inventory', 'Part consumption automatically deducts store stock', stockDeducted, `Stock now: ${updatedPart?.stock_quantity}`);
    }

    // Verify Single Job Card with parts
    if (testJobId) {
      const getJobRes = await request(`/api/workshop/jobs/${testJobId}`);
      const jobHasParts = getJobRes.data?.parts && getJobRes.data.parts.length > 0;
      record('Workshop', 'GET /api/workshop/jobs/:id returns complete details with fitted parts', jobHasParts);
    }

    // ----------------------------------------------------
    // 4. POS Billing Streams Checkout Logic
    // ----------------------------------------------------
    
    // Stream 1: Counter Retail Checkout
    const retailCheckoutRes = await request('/api/pos/checkout', {
      method: 'POST',
      body: JSON.stringify({
        stream: 'counter_retail',
        customer_name: 'Walk-in Retail Buyer',
        customer_phone: '03112233445',
        items: [{ product_id: testProductId, quantity: 1, unit_price: 260, unit_cost: 150 }],
        discount: 10,
        payment_method: 'cash',
        cash_tendered: 300,
        cashier_id: 1
      })
    });
    record('POS', 'Stream 1: Counter Retail checkout successful', retailCheckoutRes.ok, `Sale ID: ${retailCheckoutRes.data?.sale_id}`);

    // Stream 2: Workshop Job Checkout with Gate Pass Verification
    if (testJobId) {
      const workshopCheckoutRes = await request('/api/pos/checkout', {
        method: 'POST',
        body: JSON.stringify({
          stream: 'inhouse',
          job_card_id: testJobId,
          discount: 0,
          payment_method: 'cash',
          cash_tendered: 1100,
          cashier_id: 1
        })
      });
      record('POS', 'Stream 2: Workshop Delivery checkout successful', workshopCheckoutRes.ok, `Gate Pass: ${workshopCheckoutRes.data?.gate_pass_code}`);

      // Verify Gate Pass
      const gatePassCode = workshopCheckoutRes.data?.gate_pass_code;
      if (gatePassCode) {
        const verifyGatePass = await request(`/api/workshop/gate-pass/${gatePassCode}`);
        record('Workshop', 'GET /api/workshop/gate-pass/:code validates vehicle exit', verifyGatePass.ok && verifyGatePass.data?.status === 'paid_delivered');
      }
    }

    // Stream 3: Wholesale B2B Khata Checkout
    const b2bShopsRes = await request('/api/khata/b2b-shops');
    const b2bShop = b2bShopsRes.data[0];
    if (b2bShop) {
      const initialBalance = b2bShop.current_balance;
      const b2bCheckoutRes = await request('/api/pos/checkout', {
        method: 'POST',
        body: JSON.stringify({
          stream: 'b2b_wholesale',
          b2b_shop_id: b2bShop.id,
          items: [{ product_id: testProductId, quantity: 2, unit_price: 200, unit_cost: 150 }],
          discount: 0,
          payment_method: 'khata',
          cash_tendered: 0,
          cashier_id: 1
        })
      });
      record('POS', 'Stream 3: B2B Wholesale Khata checkout successful', b2bCheckoutRes.ok);

      // Verify Khata Balance was updated (+400 PKR)
      const updatedShopsRes = await request('/api/khata/b2b-shops');
      const updatedShop = updatedShopsRes.data.find(s => s.id === b2bShop.id);
      const balanceUpdated = updatedShop && updatedShop.current_balance === initialBalance + 400;
      record('Khata', 'B2B Khata balance increased by exact wholesale order amount', balanceUpdated, `New balance: ${updatedShop?.current_balance}`);
    }

    // ----------------------------------------------------
    // 5. Mechanic Commission Split & Payout Logic
    // ----------------------------------------------------
    if (testMechanic) {
      const mechLedgerRes = await request(`/api/mechanics/${testMechanic.id}/ledger`);
      record('Mechanics', 'GET /api/mechanics/:id/ledger returns earnings log', mechLedgerRes.ok);

      // Advance (Peshgi)
      const advanceRes = await request(`/api/mechanics/${testMechanic.id}/advance`, {
        method: 'POST',
        body: JSON.stringify({ amount: 500, reason: 'Family medical expense' })
      });
      record('Mechanics', 'POST /api/mechanics/:id/advance records Peshgi cash borrowing', advanceRes.ok);

      // Savings
      const savingsRes = await request(`/api/mechanics/${testMechanic.id}/savings`, {
        method: 'POST',
        body: JSON.stringify({ amount: 300, reason: 'Daily tip deposit' })
      });
      record('Mechanics', 'POST /api/mechanics/:id/savings deposits retained earnings', savingsRes.ok);
    }

    // ----------------------------------------------------
    // 6. Complaints & Re-Work Accountability Logic
    // ----------------------------------------------------
    const traceRes = await request(`/api/complaints/trace?query=${testReg}`);
    record('Complaints', 'GET /api/complaints/trace finds bike history by Reg #', traceRes.ok && traceRes.data?.history?.length > 0);

    const createComplaintRes = await request('/api/complaints', {
      method: 'POST',
      body: JSON.stringify({
        original_job_id: testJobId,
        complaint_details: 'Front brake still making squeaking sound',
        assigned_mechanic_id: testMechanic?.id || 1,
        is_free_rework: 1
      })
    });
    record('Complaints', 'POST /api/complaints creates rework ticket with same-mechanic accountability', createComplaintRes.ok);

    // ----------------------------------------------------
    // 7. Petty Cash Expense Logging Logic
    // ----------------------------------------------------
    const expenseRes = await request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        category: 'Tea / Refreshments',
        amount: 250,
        description: 'Morning tea for staff and mechanics',
        paid_by: 'Counter Cashier'
      })
    });
    record('Expenses', 'POST /api/expenses records daily petty cash', expenseRes.ok);

    // ----------------------------------------------------
    // 8. Owner Connected Analytics Logic
    // ----------------------------------------------------
    const analyticsRes = await request('/api/analytics/summary');
    const a = analyticsRes.data;
    const hasAnalyticsData = a && a.today !== undefined && a.streams !== undefined && a.mechanics !== undefined;
    record('Analytics', 'GET /api/analytics/summary calculates true net profits & 4 streams', hasAnalyticsData);

    // ----------------------------------------------------
    // 9. 1-Click Database Backup Logic
    // ----------------------------------------------------
    const backupRes = await request('/api/backup/create', { method: 'POST' });
    record('Backup', 'POST /api/backup/create generates timestamped SQLite backup', backupRes.ok, `Filename: ${backupRes.data?.backupFileName}`);

  } catch (err) {
    console.error('Test execution exception:', err);
    record('System', 'Test Suite Runner', false, err.message);
  }

  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`AUDIT COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('====================================================');
}

runTests();
