const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174' // Allow the alternate port
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/ai-assistant', require('./routes/ai-assistant'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});