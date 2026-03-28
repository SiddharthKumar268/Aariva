const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/pages')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'aariva_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/aariva' }),
  cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/cases',      require('./routes/caseRoutes'));
app.use('/api/evaluation', require('./routes/evaluationRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/chat',       require('./routes/chatRoutes'));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/intro.html'));
});

app.get('/intro', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/intro.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login.html'));
});

app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/register.html'));
});

app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/dashboard.html'));
});

app.get('/submit-case', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/submit-case.html'));
});

app.get('/track-case', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/track-case.html'));
});

app.get('/evaluation', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/evaluation.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/admin.html'));
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(204).end();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Aariva running on http://localhost:${PORT}`);
});