import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';
let users = [];
if (fs.existsSync(USERS_FILE)) {
  users = fs.readJsonSync(USERS_FILE);
}
function saveUsers() {
  fs.writeJsonSync(USERS_FILE, users, { spaces: 2 });
}

const TRANSACTIONS_FILE = './transactions.json';
let transactions = [];
if (fs.existsSync(TRANSACTIONS_FILE)) {
  transactions = fs.readJsonSync(TRANSACTIONS_FILE);
}
function saveTransactions() {
  fs.writeJsonSync(TRANSACTIONS_FILE, transactions, { spaces: 2 });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Email, password, and name are required.' });
    if (users.find(user => user.email === email)) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), email, password: hashedPassword, name };
    users.push(user);
    saveUsers();
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.status(201).json({ message: 'User created successfully', token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Transactions CRUD
app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    if (!type || !amount || !category) return res.status(400).json({ message: 'Type, amount, and category are required' });
    const transaction = { id: uuidv4(), userId: req.user.userId, type, amount: parseFloat(amount), category, description: description || '', date: date || new Date().toISOString(), createdAt: new Date().toISOString() };
    transactions.push(transaction);
    saveTransactions();
    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/transactions', authenticateToken, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.userId);
  res.json({ transactions: userTransactions });
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;
    const transaction = transactions.find(t => t.id === id && t.userId === req.user.userId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    transaction.type = type || transaction.type;
    transaction.amount = amount ? parseFloat(amount) : transaction.amount;
    transaction.category = category || transaction.category;
    transaction.description = description !== undefined ? description : transaction.description;
    transaction.date = date || transaction.date;
    saveTransactions();
    res.json({ message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const transactionIndex = transactions.findIndex(t => t.id === id && t.userId === req.user.userId);
    if (transactionIndex === -1) return res.status(404).json({ message: 'Transaction not found' });
    transactions.splice(transactionIndex, 1);
    saveTransactions();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Summary endpoint
app.get('/api/summary', authenticateToken, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.userId);
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = userTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const categoryStats = {};
  userTransactions.forEach(t => {
    if (!categoryStats[t.category]) categoryStats[t.category] = { income: 0, expense: 0 };
    if (t.type === 'income') categoryStats[t.category].income += t.amount;
    else categoryStats[t.category].expense += t.amount;
  });
  const incomeByDate = {};
  const expenseByDate = {};
  userTransactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString();
    if (t.type === 'income') incomeByDate[date] = (incomeByDate[date] || 0) + t.amount;
    else if (t.type === 'expense') expenseByDate[date] = (expenseByDate[date] || 0) + t.amount;
  });
  res.json({ totalIncome, totalExpenses, balance, categoryStats, transactionCount: userTransactions.length, incomeByDate, expenseByDate });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 