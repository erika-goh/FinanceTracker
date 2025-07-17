import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import multer from 'multer';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Only allow this user
const ONLY_EMAIL = 'erika_goh@ymail.com';
const ONLY_PASSWORD = 'mg5Y!UAUK4sqhBB';
const ONLY_NAME = 'Erika Goh';

// Pre-hash the password for in-memory storage
const ONLY_HASHED_PASSWORD = bcrypt.hashSync(ONLY_PASSWORD, 10);

// In-memory storage for the single user
let users = [
  {
    id: uuidv4(),
    email: ONLY_EMAIL,
    password: ONLY_HASHED_PASSWORD,
    name: ONLY_NAME
  }
];
let transactions = [];

// Load budgets from budgets.json
const BUDGETS_FILE = '../budgets.json';
let budgets = [];
try {
  if (fs.existsSync(BUDGETS_FILE)) {
    budgets = fs.readJsonSync(BUDGETS_FILE);
  }
} catch (err) {
  console.error('Error loading budgets:', err);
  budgets = [];
}

function saveBudgets() {
  try {
    fs.writeJsonSync(BUDGETS_FILE, budgets, { spaces: 2 });
  } catch (err) {
    console.error('Error saving budgets:', err);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Set up multer for file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'backend', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve uploads as static files
app.use('/uploads', express.static(UPLOADS_DIR));

// Image upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the public URL to the uploaded image
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Register (only allow the one account)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (email !== ONLY_EMAIL) {
      return res.status(400).json({ message: 'Registration is only allowed for a specific account.' });
    }
    if (users.find(user => user.email === ONLY_EMAIL)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (password !== ONLY_PASSWORD) {
      return res.status(400).json({ message: 'Password does not match the required password.' });
    }

    const user = {
      id: uuidv4(),
      email: ONLY_EMAIL,
      password: ONLY_HASHED_PASSWORD,
      name: name || ONLY_NAME
    };
    users.push(user);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (only allow the one account)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== ONLY_EMAIL) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = users.find(user => user.email === ONLY_EMAIL);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Transactions
app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { type, amount, category, description, date, imageUrl } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }

    const transaction = {
      id: uuidv4(),
      userId: req.user.userId,
      type, // 'income' or 'expense'
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageUrl: imageUrl || null
    };

    transactions.push(transaction);
    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.userId);
  res.json({ transactions: userTransactions });
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    const transaction = transactions.find(t => t.id === id && t.userId === req.user.userId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.type = type || transaction.type;
    transaction.amount = amount ? parseFloat(amount) : transaction.amount;
    transaction.category = category || transaction.category;
    transaction.description = description !== undefined ? description : transaction.description;
    transaction.date = date || transaction.date;

    res.json({ message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const transactionIndex = transactions.findIndex(t => t.id === id && t.userId === req.user.userId);
    
    if (transactionIndex === -1) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transactions.splice(transactionIndex, 1);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary statistics
app.get('/api/summary', authenticateToken, (req, res) => {
  const userTransactions = transactions.filter(t => t.userId === req.user.userId);
  
  const totalIncome = userTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = userTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  const categoryStats = {};
  userTransactions.forEach(t => {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      categoryStats[t.category].income += t.amount;
    } else {
      categoryStats[t.category].expense += t.amount;
    }
  });

  // Calculate expenses by date
  const expenseByDate = {};
  userTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = t.date.split('T')[0]; // Use only the date part
      if (!expenseByDate[date]) expenseByDate[date] = 0;
      expenseByDate[date] += t.amount;
    });

  res.json({
    totalIncome,
    totalExpenses,
    balance,
    categoryStats,
    transactionCount: userTransactions.length,
    expenseByDate
  });
});

// Create a budget
app.post('/api/budgets', authenticateToken, (req, res) => {
  try {
    const { category, month, amount } = req.body;
    if (!category || !month || !amount) {
      return res.status(400).json({ message: 'Category, month, and amount are required' });
    }
    const budget = {
      id: uuidv4(),
      userId: req.user.userId,
      category,
      month, // format: YYYY-MM
      amount: parseFloat(amount)
    };
    budgets.push(budget);
    saveBudgets();
    res.status(201).json({ message: 'Budget created', budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all budgets for user
app.get('/api/budgets', authenticateToken, (req, res) => {
  const userBudgets = budgets.filter(b => b.userId === req.user.userId);
  res.json({ budgets: userBudgets });
});

// Update a budget
app.put('/api/budgets/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { category, month, amount } = req.body;
    const budget = budgets.find(b => b.id === id && b.userId === req.user.userId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    if (category) budget.category = category;
    if (month) budget.month = month;
    if (amount) budget.amount = parseFloat(amount);
    saveBudgets();
    res.json({ message: 'Budget updated', budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a budget
app.delete('/api/budgets/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = budgets.findIndex(b => b.id === id && b.userId === req.user.userId);
    if (index === -1) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    budgets.splice(index, 1);
    saveBudgets();
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 