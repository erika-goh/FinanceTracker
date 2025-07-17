import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import multer from 'multer';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

let transactions = [];

// Load budgets from budgets.json
const BUDGETS_FILE = './budgets.json';
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

// Image upload endpoint (public)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the public URL to the uploaded image
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Transactions
app.post('/api/transactions', (req, res) => {
  try {
    const { type, amount, category, description, date, imageUrl } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }

    const transaction = {
      id: uuidv4(),
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

// Get all transactions (public)
app.get('/api/transactions', (req, res) => {
  res.json({ transactions });
});

// Update transaction (public)
app.put('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date, imageUrl } = req.body;
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    transaction.type = type || transaction.type;
    transaction.amount = amount ? parseFloat(amount) : transaction.amount;
    transaction.category = category || transaction.category;
    transaction.description = description !== undefined ? description : transaction.description;
    transaction.date = date || transaction.date;
    transaction.imageUrl = imageUrl !== undefined ? imageUrl : transaction.imageUrl;
    res.json({ message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction (public)
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transactionIndex = transactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    transactions.splice(transactionIndex, 1);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary statistics (public)
app.get('/api/summary', (req, res) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const categoryStats = {};
  transactions.forEach(t => {
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
  transactions
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
    transactionCount: transactions.length,
    expenseByDate
  });
});

// Budgets (public)
app.post('/api/budgets', (req, res) => {
  try {
    const { category, month, amount } = req.body;
    if (!category || !month || !amount) {
      return res.status(400).json({ message: 'Category, month, and amount are required' });
    }
    const budget = {
      id: uuidv4(),
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

app.get('/api/budgets', (req, res) => {
  res.json({ budgets });
});

app.put('/api/budgets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category, month, amount } = req.body;
    const budget = budgets.find(b => b.id === id);
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

app.delete('/api/budgets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = budgets.findIndex(b => b.id === id);
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