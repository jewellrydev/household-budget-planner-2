// Household Budget Planner — a site for make.fun's
// "Make the best household budget site" bounty.
//
// A dependency-free node:http server (node22, main.ts) that serves one
// self-contained page: a working household budget planner. Type in the
// monthly income and a planned amount per category; the page totals
// needs, wants and savings, shows what is left unplanned, flags
// anything that breaks the classic 50/30/20 guide, and draws the
// split as a bar. Amounts are unit-free — use any currency.
// All state lives in the visitor's browser (localStorage); the server
// holds nothing.
//
// No build step, no dependencies: plain node:http only.

import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3000);

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Household Budget Planner</title>
<style>
  body { margin:0; font-family: system-ui, sans-serif; background:#f2f6f2; color:#1d2b1d; }
  header { background:#166534; color:#fff; padding:28px 20px; text-align:center; }
  header h1 { margin:0 0 6px; font-size:28px; }
  header p { margin:0; opacity:.85; }
  main { max-width:880px; margin:0 auto; padding:20px; }
  .panel { background:#fff; border-radius:12px; padding:18px; box-shadow:0 2px 10px rgba(0,0,0,.06); margin-bottom:16px; }
  label { font-size:13px; color:#5b6b5b; display:block; margin-bottom:4px; }
  input { width:100%; box-sizing:border-box; padding:9px 10px; border:1px solid #cfd8cf; border-radius:8px; font-size:15px; }
  select { padding:7px 8px; border:1px solid #cfd8cf; border-radius:8px; font-size:14px; }
  table { width:100%; border-collapse:collapse; }
  td, th { padding:7px 6px; font-size:14px; text-align:left; }
  th { color:#5b6b5b; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  td input { padding:7px 8px; }
  .totals { display:flex; gap:14px; flex-wrap:wrap; }
  .tot { flex:1; min-width:150px; background:#eef5ee; border-radius:10px; padding:12px; text-align:center; }
  .tot .v { font-size:22px; font-weight:800; }
  .tot .l { font-size:12px; color:#5b6b5b; }
  .bar { display:flex; height:22px; border-radius:8px; overflow:hidden; margin-top:10px; }
  .bar div { height:100%; }
  .warn { color:#b91c1c; font-size:13px; min-height:18px; }
  button { background:#166534; color:#fff; border:0; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:600; }
  button.del { background:#dc2626; padding:6px 10px; }
  footer { text-align:center; color:#7a8798; font-size:12px; padding:20px; }
</style>
</head>
<body>
<header>
  <h1>Household Budget Planner</h1>
  <p>Plan the month in one page — needs, wants, savings, and what is left</p>
</header>
<main>
  <div class="panel">
    <label for="income">Monthly household income</label>
    <input id="income" type="number" min="0" step="any" placeholder="e.g. 5000">
  </div>
  <div class="panel">
    <table>
      <thead><tr><th>Category</th><th>Type</th><th>Planned / month</th><th></th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
    <button id="add">+ Add category</button>
    <p class="warn" id="warn"></p>
  </div>
  <div class="panel">
    <div class="totals">
      <div class="tot"><div class="v" id="t-needs">0</div><div class="l">Needs (guide &le; 50%)</div></div>
      <div class="tot"><div class="v" id="t-wants">0</div><div class="l">Wants (guide &le; 30%)</div></div>
      <div class="tot"><div class="v" id="t-save">0</div><div class="l">Savings (guide &ge; 20%)</div></div>
      <div class="tot"><div class="v" id="t-left">0</div><div class="l">Left unplanned</div></div>
      <div class="tot"><div class="v" id="t-planned">0</div><div class="l">Planned total</div></div>
    </div>
    <div class="bar"><div id="b-needs" style="background:#2563eb"></div><div id="b-wants" style="background:#d97706"></div><div id="b-save" style="background:#166534"></div><div id="b-left" style="background:#d4dcd4"></div></div>
  </div>
  <footer>Guide: the 50/30/20 rule of thumb. Amounts in any currency. Your numbers are stored only in this browser. Built for make.fun.</footer>
</main>
<script>
  const DEFAULTS = [
    { name: 'Rent / mortgage', type: 'need', amount: 1500 },
    { name: 'Groceries', type: 'need', amount: 600 },
    { name: 'Utilities', type: 'need', amount: 220 },
    { name: 'Transport', type: 'need', amount: 180 },
    { name: 'Insurance', type: 'need', amount: 150 },
    { name: 'Eating out', type: 'want', amount: 240 },
    { name: 'Streaming & fun', type: 'want', amount: 60 },
    { name: 'Emergency fund', type: 'save', amount: 400 },
    { name: 'Investments', type: 'save', amount: 250 }
  ];
  let rows = JSON.parse(localStorage.getItem('hb-rows') || 'null') || DEFAULTS.map(r => ({ ...r }));
  let income = Number(localStorage.getItem('hb-income') || 5000);
  const fmt = n => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const tbody = document.getElementById('rows');
  function save() {
    localStorage.setItem('hb-rows', JSON.stringify(rows));
    localStorage.setItem('hb-income', String(income));
  }
  function totals() {
    const sum = k => rows.filter(r => r.type === k).reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const needs = sum('need'), wants = sum('want'), saveAmt = sum('save');
    const planned = needs + wants + saveAmt, left = income - planned;
    document.getElementById('t-needs').textContent = fmt(needs);
    document.getElementById('t-wants').textContent = fmt(wants);
    document.getElementById('t-save').textContent = fmt(saveAmt);
    document.getElementById('t-left').textContent = fmt(left);
    document.getElementById('t-planned').textContent = fmt(planned);
    const pct = v => income > 0 ? ' (' + Math.round(v / income * 100) + '%)' : '';
    document.getElementById('t-needs').textContent += pct(needs);
    document.getElementById('t-wants').textContent += pct(wants);
    document.getElementById('t-save').textContent += pct(saveAmt);
    const base = Math.max(income, planned, 1);
    document.getElementById('b-needs').style.width = (needs / base * 100) + '%';
    document.getElementById('b-wants').style.width = (wants / base * 100) + '%';
    document.getElementById('b-save').style.width = (saveAmt / base * 100) + '%';
    document.getElementById('b-left').style.width = (Math.max(0, left) / base * 100) + '%';
    const w = [];
    if (left < 0) w.push('Over budget by ' + fmt(-left) + ' — planned spending exceeds income.');
    if (income > 0 && needs / income > 0.5) w.push('Needs are above the 50% guide.');
    if (income > 0 && saveAmt / income < 0.2) w.push('Savings are below the 20% guide.');
    document.getElementById('warn').textContent = w.join(' ');
  }
  function render() {
    tbody.innerHTML = '';
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      const nameIn = document.createElement('input');
      nameIn.value = r.name;
      nameIn.oninput = () => { r.name = nameIn.value; save(); };
      nameTd.appendChild(nameIn);
      const typeTd = document.createElement('td');
      const sel = document.createElement('select');
      ['need', 'want', 'save'].forEach(t => {
        const o = document.createElement('option');
        o.value = t; o.textContent = t;
        if (t === r.type) o.selected = true;
        sel.appendChild(o);
      });
      sel.onchange = () => { r.type = sel.value; save(); totals(); };
      typeTd.appendChild(sel);
      const amtTd = document.createElement('td');
      const amtIn = document.createElement('input');
      amtIn.type = 'number'; amtIn.min = '0'; amtIn.step = 'any';
      amtIn.value = String(r.amount);
      amtIn.oninput = () => { r.amount = Number(amtIn.value) || 0; save(); totals(); };
      amtTd.appendChild(amtIn);
      const delTd = document.createElement('td');
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '✕'; del.title = 'remove';
      del.onclick = () => { rows.splice(i, 1); save(); render(); };
      delTd.appendChild(del);
      tr.append(nameTd, typeTd, amtTd, delTd);
      tbody.appendChild(tr);
    });
    totals();
  }
  const inc = document.getElementById('income');
  inc.value = income;
  inc.oninput = () => { income = Number(inc.value) || 0; save(); totals(); };
  document.getElementById('add').onclick = () => { rows.push({ name: 'New category', type: 'want', amount: 0 }); save(); render(); };
  render();
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
  } else if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  } else {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
});

server.listen(PORT, () => {
  console.log(`Household Budget Planner is live at http://localhost:${PORT}/`);
});
