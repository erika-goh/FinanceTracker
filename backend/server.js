import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Transactions API
app.post('/api/transactions', async (req, res) => {
  try {
    const { type, amount, category, description, date, imageUrl } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }

    const query = `
      INSERT INTO transactions (type, amount, category, description, date, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [type, parseFloat(amount), category, description || '', date || new Date().toISOString(), imageUrl || null];
    
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Transaction created', transaction: result.rows[0] });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const query = 'SELECT * FROM transactions ORDER BY date DESC';
    const result = await pool.query(query);
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date, imageUrl } = req.body;
    
    const query = `
      UPDATE transactions 
      SET type = $1, amount = $2, category = $3, description = $4, date = $5, image_url = $6
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [type, parseFloat(amount), category, description, date, imageUrl, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction updated', transaction: result.rows[0] });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM transactions WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary statistics
app.get('/api/summary', async (req, res) => {
  try {
    // Get total income and expenses
    const incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_income 
      FROM transactions 
      WHERE type = 'income'
    `;
    const expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_expenses 
      FROM transactions 
      WHERE type = 'expense'
    `;
    
    const [incomeResult, expenseResult] = await Promise.all([
      pool.query(incomeQuery),
      pool.query(expenseQuery)
    ]);
    
    const totalIncome = parseFloat(incomeResult.rows[0].total_income);
    const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses);
    const balance = totalIncome - totalExpenses;
    
    // Get category statistics
    const categoryQuery = `
      SELECT category, type, SUM(amount) as total
      FROM transactions
      GROUP BY category, type
      ORDER BY category, type
    `;
    const categoryResult = await pool.query(categoryQuery);
    
    const categoryStats = {};
    categoryResult.rows.forEach(row => {
      if (!categoryStats[row.category]) {
        categoryStats[row.category] = { income: 0, expense: 0 };
      }
      if (row.type === 'income') {
        categoryStats[row.category].income += parseFloat(row.total);
      } else {
        categoryStats[row.category].expense += parseFloat(row.total);
      }
    });
    
    // Get expenses by date
    const dateQuery = `
      SELECT DATE(date) as date, SUM(amount) as total
      FROM transactions
      WHERE type = 'expense'
      GROUP BY DATE(date)
      ORDER BY date
    `;
    const dateResult = await pool.query(dateQuery);
    
    const expenseByDate = {};
    dateResult.rows.forEach(row => {
      expenseByDate[row.date] = parseFloat(row.total);
    });
    
    // Get transaction count
    const countQuery = 'SELECT COUNT(*) as count FROM transactions';
    const countResult = await pool.query(countQuery);
    
    res.json({
      totalIncome,
      totalExpenses,
      balance,
      categoryStats,
      transactionCount: parseInt(countResult.rows[0].count),
      expenseByDate
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Budgets API
app.post('/api/budgets', async (req, res) => {
  try {
    const { category, month, amount } = req.body;
    
    if (!category || !month || !amount) {
      return res.status(400).json({ message: 'Category, month, and amount are required' });
    }
    
    const query = `
      INSERT INTO budgets (category, month, amount)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [category, month, parseFloat(amount)];
    const result = await pool.query(query, values);
    
    res.status(201).json({ message: 'Budget created', budget: result.rows[0] });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/budgets', async (req, res) => {
  try {
    const query = 'SELECT * FROM budgets ORDER BY month DESC, category';
    const result = await pool.query(query);
    res.json({ budgets: result.rows });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, month, amount } = req.body;
    
    const query = `
      UPDATE budgets 
      SET category = $1, month = $2, amount = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [category, month, parseFloat(amount), id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget updated', budget: result.rows[0] });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM budgets WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 