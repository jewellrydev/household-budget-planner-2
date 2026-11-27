// Household Budget Planner — the page's logic (plain JavaScript, no
// libraries). Keeps the category rows and the monthly income, renders
// the table, totals needs / wants / savings against the 50/30/20 guide,
// and saves everything to localStorage so the numbers survive a reload.

import { DEFAULT_INCOME, DEFAULT_ROWS } from './data.js';

let rows = loadRows();
let income = loadIncome();

const tbody = document.getElementById('rows');
const incomeInput = document.getElementById('income');
const warnBox = document.getElementById('warn');

function loadRows() {
  try {
    const saved = JSON.parse(localStorage.getItem('hb-rows') || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (_) { /* fall through to defaults */ }
  return DEFAULT_ROWS.map((r) => ({ ...r }));
}

function loadIncome() {
  const saved = Number(localStorage.getItem('hb-income') || DEFAULT_INCOME);
  return Number.isFinite(saved) && saved >= 0 ? saved : DEFAULT_INCOME;
}

function save() {
  localStorage.setItem('hb-rows', JSON.stringify(rows));
  localStorage.setItem('hb-income', String(income));
}

const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function totals() {
  const sum = (k) =>
    rows.filter((r) => r.type === k).reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const needs = sum('need');
  const wants = sum('want');
  const saveAmt = sum('save');
  const planned = needs + wants + saveAmt;
  const left = income - planned;

  setTotal('t-needs', needs);
  setTotal('t-wants', wants);
  setTotal('t-save', saveAmt);
  setTotal('t-planned', planned);
  document.getElementById('t-left').textContent = fmt(left);

  const base = Math.max(income, planned, 1);
  setBar('b-needs', needs / base);
  setBar('b-wants', wants / base);
  setBar('b-save', saveAmt / base);
  setBar('b-left', Math.max(0, left) / base);

  const warnings = [];
  if (left < 0) warnings.push('Over budget by ' + fmt(-left) + ' — planned spending exceeds income.');
  if (income > 0 && needs / income > 0.5) warnings.push('Needs are above the 50% guide.');
  if (income > 0 && saveAmt / income < 0.2) warnings.push('Savings are below the 20% guide.');
  warnBox.textContent = warnings.join(' ');
}

function setTotal(id, value) {
  const el = document.getElementById(id);
  el.textContent = fmt(value);
  if (income > 0) el.textContent += ' (' + Math.round((value / income) * 100) + '%)';
}

function setBar(id, fraction) {
  document.getElementById(id).style.width = (fraction * 100).toFixed(1) + '%';
}

function render() {
  tbody.innerHTML = '';
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.value = row.name;
    nameInput.setAttribute('aria-label', 'Category name');
    nameInput.oninput = () => { row.name = nameInput.value; save(); };
    nameCell.appendChild(nameInput);

    const typeCell = document.createElement('td');
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Category type');
    for (const t of ['need', 'want', 'save']) {
      const option = document.createElement('option');
      option.value = t;
      option.textContent = t;
      if (t === row.type) option.selected = true;
      select.appendChild(option);
    }
    select.onchange = () => { row.type = select.value; save(); totals(); };
    typeCell.appendChild(select);

    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.step = 'any';
    amountInput.value = String(row.amount);
    amountInput.setAttribute('aria-label', 'Planned amount per month');
    amountInput.oninput = () => { row.amount = Number(amountInput.value) || 0; save(); totals(); };
    amountCell.appendChild(amountInput);

    const delCell = document.createElement('td');
    const delButton = document.createElement('button');
    delButton.className = 'del';
    delButton.textContent = '✕';
    delButton.title = 'Remove category';
    delButton.onclick = () => { rows.splice(i, 1); save(); render(); };
    delCell.appendChild(delButton);

    tr.append(nameCell, typeCell, amountCell, delCell);
    tbody.appendChild(tr);
  });
  totals();
}

incomeInput.value = income;
incomeInput.oninput = () => { income = Number(incomeInput.value) || 0; save(); totals(); };

document.getElementById('add').onclick = () => {
  rows.push({ name: 'New category', type: 'want', amount: 0 });
  save();
  render();
};

render();
