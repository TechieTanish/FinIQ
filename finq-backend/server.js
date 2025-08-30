const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 1) Global middleware
app.use(cors());                // allow frontend to call the API [2]
app.use(express.json());        // parse JSON request bodies [5]

// 2) In-memory data
let transactions = [];          // [{id, amount, type, category, mode, notes, date}] [5]
let budget = 10000;             // default monthly budget [5]

// 3) Health check
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' })); // [1]

// 4) Budget routes
app.get('/api/v1/budget', (req, res) => res.json({ budget }));       // [5]
app.post('/api/v1/budget', (req, res) => {                           // [5]
  const { budget: b } = req.body;
  if (!b || b <= 0) return res.status(400).json({ error: 'Invalid budget' });
  budget = b;
  res.json({ budget });
});

// 5) Transaction routes
app.get('/api/v1/transactions', (req, res) => res.json(transactions)); // [5]
app.post('/api/v1/transactions', (req, res) => {                        // [5]
  const { amount, type, category, mode, notes } = req.body;
  if (!amount || !type) return res.status(400).json({ error: 'amount and type required' });
  const tx = {
    id: Date.now().toString(),
    amount,
    type, category, mode, notes,
    date: new Date().toISOString()
  };
  transactions.push(tx);
  res.status(201).json(tx);
});
app.put('/api/v1/transactions/:id', (req, res) => {                     // [5]
  const { id } = req.params;
  const i = transactions.findIndex(t => t.id === id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  transactions[i] = { ...transactions[i], ...req.body, id };
  res.json(transactions[i]);
});
app.delete('/api/v1/transactions/:id', (req, res) => {                  // [5]
  const { id } = req.params;
  const i = transactions.findIndex(t => t.id === id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  const removed = transactions.splice(i, 1); // return a single object [5]
  res.json(removed);
});

// 6) Root route (simple text)
app.get('/', (req, res) => {
  res.send('FINQ API is running');
}); // [6]

// 7) OPTIONAL: Serve the frontend via Express (Index.html at FINIQ root)
app.use(express.static(path.join(__dirname, '..')));                    // static assets [2]
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Index.html'));              // dashboard page [7]
});

// 8) Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('API running on', PORT));
