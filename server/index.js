require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateRoute = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/generate', generateRoute);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Serve built React app in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
