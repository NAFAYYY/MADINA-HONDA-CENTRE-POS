const BASE = 'http://localhost:5000';

async function checkFailures() {
  // 1. PUT product
  const putRes = await fetch(`${BASE}/api/products/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_quantity: 25 })
  });
  console.log('PUT product error:', putRes.status, await putRes.text());

  // 2. Retail checkout
  const retRes = await fetch(`${BASE}/api/pos/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stream: 'counter_retail',
      customer_name: 'Walk-in Retail Buyer',
      customer_phone: '03112233445',
      items: [{ product_id: 1, quantity: 1, unit_price: 260, unit_cost: 150 }],
      discount: 10,
      payment_method: 'cash',
      cash_tendered: 300,
      cashier_id: 1
    })
  });
  console.log('Retail checkout error:', retRes.status, await retRes.text());

  // 3. Gate pass
  const gpRes = await fetch(`${BASE}/api/workshop/gate-pass/GP-997718`);
  console.log('Gate pass error:', gpRes.status, await gpRes.text());

  // 4. Mechanics ledger
  const mechRes = await fetch(`${BASE}/api/mechanics/1/ledger`);
  console.log('Mechanic ledger error:', mechRes.status, await mechRes.text());

  // 5. Complaints trace
  const compRes = await fetch(`${BASE}/api/complaints/trace?query=LHE`);
  console.log('Complaints trace error:', compRes.status, await compRes.text());

  // 6. Analytics summary
  const anRes = await fetch(`${BASE}/api/analytics/summary`);
  console.log('Analytics error:', anRes.status, await anRes.text());
}

checkFailures();
