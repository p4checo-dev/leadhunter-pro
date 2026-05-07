const express = require('express');
const cors = require('cors');
const { scrapeGoogleMaps } = require('./scraper');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/leads', (req, res) => {
  const leads = db.getAllLeads();
  res.json(leads);
});

app.post('/api/search', async (req, res) => {
  const { query, limit } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const results = await scrapeGoogleMaps(query, limit || 20);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
