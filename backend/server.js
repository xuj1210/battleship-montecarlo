require('dotenv').config();

const PORT = 3000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');


// middlewares
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true }, () => { console.log('connected to mongo') })

// Import routes
const usersRoute = require('./api/routes/users');
const AiStatsRoute = require('./api/routes/ai-stats');

app.use('/users', usersRoute);
app.use('/ai-stats', AiStatsRoute);

const db = mongoose.connection;
db.on('error', (err) => {
  console.log(err.message);
});

db.once('open', () => {
  console.log('Connected to database');
});

app.listen(PORT, () => {
  console.log(`port started at ${PORT}`);
});