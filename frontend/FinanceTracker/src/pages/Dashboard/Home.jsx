import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  Calendar,
  Tag
} from 'lucide-react';
import { summaryAPI, transactionsAPI, budgetsAPI } from '../../utils/api.js';
import { CATEGORIES } from '../../utils/apiPaths.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Home = () => {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [budgets, setBudgets] = useState([]);
  const location = useLocation();

  useEffect(() => {
    fetchData();
    fetchBudgets();
    // Listen for transaction changes
    const handler = () => fetchData();
    window.addEventListener('transactionsChanged', handler);
    return () => window.removeEventListener('transactionsChanged', handler);
  }, []);

  // Refetch data when route changes to dashboard
  useEffect(() => {
    fetchData();
    fetchBudgets();
  }, [location.pathname]);

  // Debug summary state
  useEffect(() => {
    console.log('Summary state changed:', summary);
  }, [summary]);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [summaryRes, transactionsRes] = await Promise.all([
        summaryAPI.getSummary(),
        transactionsAPI.getAll()
      ]);
      
      console.log('Summary response:', summaryRes);
      console.log('Transactions response:', transactionsRes);
      
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data.transactions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await budgetsAPI.getAll();
      setBudgets(res.data.budgets);
    } catch (e) {
      setBudgets([]);
    }
  };

  const formatCurrency = (amount) => {
    console.log('formatCurrency called with:', amount, typeof amount);
    if (amount === null || amount === undefined || isNaN(amount)) {
      console.log('Invalid amount, returning $0.00');
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryIcon = (category) => {
    // You can add more category-specific icons here
    return <Tag className="h-4 w-4" />;
  };

  // Prepare data for Income Bar Chart (by category)
  const incomeByCategory = summary?.categoryStats
    ? Object.entries(summary.categoryStats)
        .filter(([cat, stat]) => stat.income > 0)
        .map(([cat, stat]) => ({ category: cat, amount: stat.income }))
    : [];
  const incomeBarData = {
    labels: incomeByCategory.map((c) => c.category),
    datasets: [
      {
        label: 'Income by Category',
        data: incomeByCategory.map((c) => c.amount),
        backgroundColor: [
          'rgba(40, 253, 118, 0.7)',
          'rgba(5, 123, 44, 0.7)',
          'rgba(34,197,94,0.7)',
          'rgba(71, 109, 85, 0.7)',
          'rgba(10, 102, 44, 0.7)',
          'rgba(13, 79, 37, 0.7)',
          'rgba(134, 227, 168, 0.7)',
          'rgba(28, 91, 51, 0.7)',
          'rgba(5, 40, 18, 0.7)',       
        ],
        borderWidth: 2,
      },
    ],
  };
  const incomeBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Income by Category' },
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
  };

  // Prepare data for Expense Line Chart
  const expenseLineData = {
    labels: summary?.expenseByDate ? Object.keys(summary.expenseByDate).map(dateStr => {
      // Convert the long date string to a simple format
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }) : [],
    datasets: [
      {
        label: 'Expenses',
        data: summary?.expenseByDate ? Object.values(summary.expenseByDate) : [],
        fill: false,
        borderColor: 'rgba(239,68,68,0.8)',
        backgroundColor: 'rgba(239,68,68,0.3)',
        tension: 0.4,
      },
    ],
  };
  const expenseLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Expenses Over Time' },
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0
        }
      }
    },
  };

  // Add handler to export all transactions to Excel
  const handleExportExcel = async () => {
    try {
      const response = await transactionsAPI.getAll();
      const allTransactions = response.data.transactions;
      if (!allTransactions || allTransactions.length === 0) return;
      const data = allTransactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Type: t.type,
        Category: t.category,
        Description: t.description,
        Amount: t.amount
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'transactions.xlsx');
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalIncome || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Balance</p>
              <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary?.balance || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budgets</p>
              <p className="text-2xl font-bold text-gray-900">
                <Link to="/budgets" className="text-yellow-600 hover:underline">Manage Budgets</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/income"
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-green-800">Add Income</span>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </Link>
            
            <Link
              to="/expenses"
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-red-800">Add Expense</span>
              </div>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold">{summary?.transactionCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Income Categories</span>
              <span className="font-semibold">{Object.keys(summary?.categoryStats || {}).filter(cat => 
                CATEGORIES.INCOME.includes(cat)
              ).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expense Categories</span>
              <span className="font-semibold">{Object.keys(summary?.categoryStats || {}).filter(cat => 
                CATEGORIES.EXPENSE.includes(cat)
              ).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-4 flex flex-col items-center justify-center w-full">
          <div className="w-full h-64">
            <Bar data={incomeBarData} options={incomeBarOptions} />
          </div>
        </div>
        <div className="card p-4 w-full">
          <div className="w-full h-64">
            <Line data={expenseLineData} options={expenseLineOptions} />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportExcel}
              className="btn btn-secondary text-sm px-4 py-2"
              disabled={recentTransactions.length === 0}
            >
              Export to Excel
            </button>
            <Link
              to="/transactions"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions yet. Start by adding your first income or expense!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.category}</p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;