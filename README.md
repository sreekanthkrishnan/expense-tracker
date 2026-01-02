# 💰 Personal Finance Tracker

A comprehensive frontend-only Personal Finance Tracker Web Application built with React, Redux Toolkit, and IndexedDB. Track your income, expenses, loans, savings goals, and get AI-powered expense reduction advice.

## ✨ Features

### 📊 Dashboard
- Real-time financial overview
- Income vs Expenses trends (6-month view)
- Category-wise expense breakdown with charts
- Savings goals progress tracking
- Net income calculations

### 👤 Profile & Preferences
- Personal information
- Currency selection (USD, EUR, GBP, INR, JPY, CAD, AUD)
- Monthly income setting
- Risk level preference

### 💰 Income Module
- Track recurring and one-time income
- Monthly and yearly summaries
- Income source management
- Automatic monthly income calculations

### 💸 Expense Module
- Add expenses with categories, dates, and payment methods
- Custom category management
- Monthly expense tracking
- Category breakdown visualization
- Spending pattern detection

### 🏦 Loans Module
- Track loans taken and loans given
- Automatic EMI calculation (Flat & Reducing balance)
- Interest loss tracking
- Outstanding balance management
- Loan status tracking

### 🎯 Savings Goals Module
- Create multiple savings goals
- Target amount and date setting
- Current savings tracking
- Automatic feasibility calculation
- Monthly saving requirement
- Goal status indicators (Achievable / Achievable with cuts / Unrealistic)

### 💡 Expense Reduction Engine
- Rule-based spending analysis
- Subscription detection
- Impulse buy identification
- High-frequency spending alerts
- Category-wise reduction suggestions
- Step-by-step action plans
- **AI-powered advice** (OpenAI ChatGPT integration)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone or navigate to the project directory:
```bash
cd "expense tracker"
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up OpenAI API key for AI advice:
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   ```
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **IndexedDB** - Primary data storage (with LocalStorage fallback)
- **OpenAI API** - AI-powered expense reduction advice

## 📦 Data Storage

All data is stored locally in your browser:
- **Primary**: IndexedDB (for structured data)
- **Fallback**: LocalStorage (if IndexedDB is unavailable)

No backend required! All your financial data stays on your device.

## 🎨 Features in Detail

### Expense Pattern Detection
- **Subscriptions**: Automatically detects recurring expenses with similar amounts and regular intervals
- **Impulse Buys**: Identifies high-value, low-frequency purchases in non-essential categories
- **High-Frequency Spending**: Flags categories with many transactions

### Loan Calculations
- **EMI Calculation**: Supports both flat and reducing balance interest methods
- **Interest Tracking**: Shows total interest loss for loans taken
- **Automatic Expense Integration**: EMI appears as monthly expenses

### Savings Goals Feasibility
- Calculates monthly saving required based on target date
- Compares with available income after expenses
- Provides feasibility score (0-100%)
- Status indicators:
  - **Achievable**: Can be met with current income
  - **Achievable with cuts**: Requires expense reduction
  - **Unrealistic**: Needs significant changes

## 📱 Usage

1. **Set up your profile** - Go to Profile tab and enter your details
2. **Add income** - Track all your income sources
3. **Record expenses** - Add expenses as you spend
4. **Manage loans** - Track any loans you have
5. **Set savings goals** - Define what you're saving for
6. **Get advice** - Visit "Reduce Expenses" tab for personalized suggestions

## 🔒 Privacy

- All data is stored locally in your browser
- No data is sent to any server (except OpenAI API for advice, which only receives anonymized spending patterns)
- No authentication required
- Your financial data never leaves your device

## 📝 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

Built with ❤️ using React, Redux Toolkit, and modern web technologies.
