import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation.jsx';
import Home from './pages/Dashboard/Home.jsx';
import Income from './pages/Dashboard/Income.jsx';
import Expense from './pages/Dashboard/Expense.jsx';
import Transactions from './pages/Dashboard/Transactions.jsx';
import Budgets from './pages/Dashboard/Budgets.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Home />
            </div>
          }
        />
        <Route
          path="/income"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Income />
            </div>
          }
        />
        <Route
          path="/expenses"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Expense />
            </div>
          }
        />
        <Route
          path="/transactions"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Transactions />
            </div>
          }
        />
        <Route
          path="/budgets"
          element={
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Budgets />
            </div>
          }
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;