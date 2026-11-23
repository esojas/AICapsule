require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
require('./db'); 

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1); // Render sits behind a proxy; needed for Secure cookies
app.use(express.json());
app.use(cookieParser());

// Public health check 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', require('./routes/auth'));

app.use('/api/capsules', require('./routes/capsules'));


const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});