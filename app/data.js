// Default household budget: the categories a household starts with and
// the monthly income the planner opens on. Amounts are unit-free — use
// any currency. main.js loads these, then lets the visitor change, add
// or remove rows; every change is saved to localStorage.

export const DEFAULT_INCOME = 5000;

export const DEFAULT_ROWS = [
  { name: 'Rent / mortgage', type: 'need', amount: 1500 },
  { name: 'Groceries', type: 'need', amount: 600 },
  { name: 'Utilities', type: 'need', amount: 220 },
  { name: 'Transport', type: 'need', amount: 180 },
  { name: 'Insurance', type: 'need', amount: 150 },
  { name: 'Eating out', type: 'want', amount: 240 },
  { name: 'Streaming & fun', type: 'want', amount: 60 },
  { name: 'Emergency fund', type: 'save', amount: 400 },
  { name: 'Investments', type: 'save', amount: 250 },
];
