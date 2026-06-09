# 🎯 Retirement Modeler with Real Data Integration

A sophisticated retirement planning tool that connects with your actual financial data through LunchMoney API. Get personalized retirement projections based on your real account balances and spending patterns.

**Perfect for:** Tech-savvy individuals who want data-driven retirement planning beyond simple calculators.

## Why Choose This Tool?

- **Real Data Integration** - Connects with LunchMoney API for actual balances and transactions
- **Beginner-Friendly QuickStart** - 4 simple questions to get personalized retirement projections
- **User-Configurable Categories** - Select which LunchMoney categories represent your retirement contributions
- **Accurate Savings Calculation** - Uses actual transaction data from your selected categories
- **Simplified Input** - Birth year only (no birth month needed) for easier onboarding
- **Smart Spending Estimates** - Monthly/yearly spending sync with lifestyle benchmarks
- **Beautiful Visualizations** - Interactive charts for portfolio growth and withdrawal strategies
- **Privacy First** - Your financial data stays on your machine when running locally

## 🎯 Perfect For

- **Early retirees** planning complex withdrawal strategies
- **Tech professionals** with multiple account types (401k, Roth, taxable)
- **Financial optimization enthusiasts** who want to model "what-if" scenarios
- **Developers** interested in personal finance and retirement planning tools

## 🛠️ Tech Stack & Architecture

- **Next.js 16** with React 19 and TypeScript
- **Real-time calculations** with advanced financial modeling
- **LunchMoney API** integration for live financial data
- **Responsive design** with Tailwind CSS and shadcn/ui
- **Data validation** with Zod schemas
- **Interactive charts** powered by Recharts

## Dashboard Experience

### QuickStart Mode
- **4 Simple Questions:** Age, retirement age, current savings, monthly savings
- **Auto-Populated Data:** Integrates with LunchMoney for real account balances
- **Smart Spending Estimates:** Monthly/yearly spending sync with lifestyle benchmarks
- **Clear Results:** Shows when you can retire and expected monthly income
- **Perfect for:** First-time users and quick retirement checks

### Dashboard Features
- **Real Account Data:** Automatically imports your LunchMoney account balances
- **Retirement Categories:** Select which categories represent your retirement contributions
- **Accurate Calculations:** Uses actual transaction data for retirement savings
- **Simplified Input:** Birth year only for easier onboarding
- **Visual Timeline:** Easy-to-understand progress visualization
- **Detailed Analysis:** Option to view comprehensive charts and projections

### User Flow
1. **Connect LunchMoney** - Enter your access token and birth year
2. **Select Categories** - Choose which categories represent retirement contributions
3. **QuickStart** - Answer 4 simple questions for personalized projections
4. **View Results** - See when you can retire and expected monthly income
5. **Detailed Analysis** - Explore comprehensive charts and projections

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📸 Screenshots

### QuickStart Mode
*Beginner-friendly onboarding with 4 simple questions*
<img width="1160" height="670" alt="image" src="https://github.com/user-attachments/assets/7f2857f6-436b-4b0e-8b29-d94fd32410df" />

<img width="709" height="580" alt="image" src="https://github.com/user-attachments/assets/adde737e-36b0-4be5-addc-aa32aebfbd69" />

### Details Dashboard
<img width="949" height="691" alt="image" src="https://github.com/user-attachments/assets/509c4e0c-ae10-4a08-b2e4-9a38d912742c" />

### Advanced Dashboard
*Full control with all tax optimization features*
<img width="1061" height="745" alt="image" src="https://github.com/user-attachments/assets/a7807160-01a4-4c71-b382-09af6ba55a75" />


## 🤝 Contributing

We welcome contributions! This is a great project for developers interested in:

- **Personal finance** applications
- **Data visualization** with Recharts
- **API integrations** (LunchMoney, financial data)
- **Retirement planning** algorithms
- **TypeScript/React** development

### Recent Improvements

- **User-configurable retirement categories** - Select which LunchMoney categories represent retirement contributions
- **Accurate savings calculation** - Uses actual transaction data instead of budget estimates
- **Simplified input** - Birth year only (removed birth month for easier onboarding)
- **Smart spending estimates** - Monthly/yearly spending sync with lifestyle benchmarks
- **Improved UX** - Fixed decimal point handling, back button behavior, and input formatting

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
