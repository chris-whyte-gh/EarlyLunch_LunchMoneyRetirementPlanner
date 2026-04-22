# Contributing to Retirement Modeler

Thank you for your interest in contributing to the Retirement Modeler! This document provides guidelines and information for contributors.

## 🎯 Project Overview

The Retirement Modeler is a sophisticated retirement planning tool that connects with LunchMoney API for real financial data integration. It helps users model complex scenarios including Roth conversions, SEPP strategies, and tax optimization.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Basic knowledge of React, TypeScript, and Next.js
- Understanding of personal finance concepts (helpful but not required)

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/EarlyLunch_LunchMoneyRetirementPlanner.git
   cd EarlyLunch_LunchMoneyRetirementPlanner
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── ConfigPanel.tsx   # Configuration interface
│   ├── Dashboard.tsx      # Main dashboard
│   └── ...               # Other UI components
├── lib/                  # Utility libraries
│   ├── lunchmoney.ts     # LunchMoney API client
│   ├── modeling.ts       # Financial calculations
│   └── utils.ts         # Helper functions
└── public/               # Static assets
```

## 🤝 How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** using the bug report template
3. **Include:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node.js version)
   - Screenshots if relevant

### Suggesting Features

1. **Check the roadmap** and existing issues
2. **Create a feature request** using the template
3. **Describe:**
   - Use case and motivation
   - Proposed implementation (if you have ideas)
   - Potential impact on users

### Submitting Changes

1. **Create a new branch** for your feature/fix
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards
3. **Test thoroughly**:
   - Run `npm run lint` to check code style
   - Test the UI changes manually
   - Add tests for new functionality

4. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add Roth conversion calculator"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/amazing-feature
   ```

## 📝 Coding Standards

### Code Style

- **TypeScript** for all new code
- **ESLint** configuration is provided - run `npm run lint`
- **Prettier** for formatting (configured in `.prettierrc`)
- **Descriptive variable and function names**
- **JSDoc comments** for complex functions

### Component Guidelines

- **Use functional components** with hooks
- **TypeScript interfaces** for props
- **Consistent styling** with Tailwind CSS
- **Responsive design** considerations
- **Accessibility** best practices

### File Naming

- **PascalCase** for components (`ConfigPanel.tsx`)
- **camelCase** for utilities (`formatCurrency.ts`)
- **kebab-case** for CSS classes when needed

## 🧪 Testing

### Running Tests
```bash
npm test          # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests

- **Unit tests** for utility functions
- **Component tests** for UI components
- **Integration tests** for critical user flows
- **Test files** should be `*.test.ts` or `*.test.tsx`

## 📊 Areas Where We Need Help

### High Priority
- **Additional financial calculators** (Social Security optimization, etc.)
- **More chart types** and visualizations
- **Mobile responsiveness** improvements
- **Performance optimization** for large datasets

### Medium Priority
- **Export functionality** (PDF reports, CSV data)
- **Additional API integrations** (Plaid, YNAB, etc.)
- **Advanced scenario modeling**
- **Internationalization** support

### Documentation
- **API documentation** improvements
- **User guides** and tutorials
- **Developer documentation**
- **Video demonstrations**

## 🏷️ Labels and Milestones

- **`bug`** - Bug reports and fixes
- **`enhancement`** - New features and improvements
- **`documentation`** - Documentation changes
- **`good first issue`** - Great for newcomers
- **`help wanted`** - Community assistance needed

## 📋 Pull Request Process

1. **Ensure your PR description:**
   - Clearly describes the change
   - References related issues
   - Includes screenshots for UI changes
   - Lists testing performed

2. **Keep PRs focused** on a single feature/fix
3. **Update documentation** if needed
4. **Pass all CI checks** before merging
5. **Be responsive** to feedback and reviews

## 🎉 Recognition

Contributors are recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub's contributor statistics**

## 📞 Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **Discussions** - For general questions and ideas
- **Email/DM** - For sensitive security issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Retirement Modeler! 🎯
