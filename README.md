# FinanceTracker

A modern personal finance management application built with React and Node.js. Track your income, expenses, and get insights into your financial health.

<img width="1270" height="821" alt="finance-example" src="https://github.com/user-attachments/assets/582aa086-bcee-496c-9390-ea1cf5d01296" />

## Features

- **User Authentication** - Secure login and registration system
- **Income Management** - Add, edit, and track income transactions
- **Expense Tracking** - Monitor and categorize your expenses
- **Financial Dashboard** - Overview of your financial status
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Clean and intuitive interface with Tailwind CSS

## Tech Stack

### Frontend
- React
- React Router DOM
- Tailwind CSS
- Lucide React (Icons)
- Axios (HTTP client)

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs (Password hashing)
- CORS enabled

### Running the Application

1. **Start the backend server**
   ```cd backend && npm install && npm run dev```
   
   The backend will run on `http://localhost:5000`

3. **Start the frontend development server**
   ```cd frontend/FinanceTracker && npm install && npm run dev```
   
   The frontend will run on `http://localhost:5173`

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

## Project Structure

```
FinanceTracker/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   └── FinanceTracker/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Navigation.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   │   ├── context/
│       │   │   │   └── AuthContext.jsx
│       │   │   ├── pages/
│       │   │   │   ├── Auth/
│       │   │   │   │   ├── Login.jsx
│       │   │   │   │   └── SignUp.jsx
│       │   │   │   └── Dashboard/
│       │   │   │       ├── Home.jsx
│       │   │   │       ├── Income.jsx
│       │   │   │       └── Expsense.jsx
│       │   │   ├── utils/
│       │   │   │   ├── api.js
│       │   │   │   └── apiPaths.js
│       │   │   ├── App.jsx
│       │   │   ├── main.jsx
│       │   │   └── index.css
│       │   ├── package.json
│       │   ├── tailwind.config.js
│       │   └── index.html
│       ├── README.md
│       └── ... (rest of the project structure)
└── README.md
```
