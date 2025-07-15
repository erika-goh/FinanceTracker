import React, { useEffect, useState } from 'react';
import { budgetsAPI, summaryAPI } from '../../utils/api.js';
import { CATEGORIES } from '../../utils/apiPaths.js';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: '', month: getCurrentMonth(), amount: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await budgetsAPI.getAll();
      setBudgets(res.data.budgets);
    } catch (e) {
      setBudgets([]);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await summaryAPI.getSummary();
      setSummary(res.data);
    } catch (e) {
      setSummary(null);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchSummary();
  }, []);

  // Refetch summary after any budget change
  const refetchAll = async () => {
    await fetchBudgets();
    await fetchSummary();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.month || !form.amount) {
      setError('All fields required');
      return;
    }
    try {
      if (editingId) {
        await budgetsAPI.update(editingId, form);
      } else {
        await budgetsAPI.create(form);
      }
      setForm({ category: '', month: getCurrentMonth(), amount: '' });
      setEditingId(null);
      setError('');
      refetchAll();
    } catch (e) {
      setError('Error saving budget');
    }
  };

  const handleEdit = (b) => {
    setForm({ category: b.category, month: b.month, amount: b.amount });
    setEditingId(b.id);
  };

  const handleDelete = async (id) => {
    await budgetsAPI.delete(id);
    refetchAll();
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Budgets</h1>
      <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="input">
            <option value="">Select</option>
            {[...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Month</label>
          <input type="month" name="month" value={form.month} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} className="input" min="0" step="0.01" />
        </div>
        <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Budget</button>
        {error && <span className="text-red-500 ml-4">{error}</span>}
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4">Category</th>
              <th className="py-2 px-4">Month</th>
              <th className="py-2 px-4">Budget</th>
              <th className="py-2 px-4">Actions</th>
              <th className="py-2 px-4">Progress</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const spent = summary?.categoryStats?.[b.category]?.expense || 0;
              const percent = Math.min(100, (spent / b.amount) * 100);
              let barColor = 'bg-green-500';
              if (percent >= 90) barColor = 'bg-red-500';
              else if (percent >= 70) barColor = 'bg-yellow-400';
              return (
                <tr key={b.id}>
                  <td className="py-2 px-4">{b.category}</td>
                  <td className="py-2 px-4">{b.month}</td>
                  <td className="py-2 px-4">${parseFloat(b.amount).toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <button className="btn btn-xs btn-secondary mr-2" onClick={() => handleEdit(b)}>Edit</button>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                  </td>
                  <td className="py-2 px-4 w-1/3">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${barColor}`}
                        style={{ width: `${percent}%`, transition: 'width 0.5s' }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1">
                      Spent: ${spent.toFixed(2)} / ${parseFloat(b.amount).toFixed(2)}
                    </div>
                  </td>
                </tr>
              );
            })}
            {budgets.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">No budgets set.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets; 