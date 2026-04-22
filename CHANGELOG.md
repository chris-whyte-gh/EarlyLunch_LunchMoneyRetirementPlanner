# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release preparation
- Enhanced README with comprehensive project description
- Contributing guidelines and documentation
- MIT License for open source distribution

### Changed
- Improved project structure and organization
- Enhanced security practices for API token handling

## [0.1.0] - 2026-04-15

### Added
- LunchMoney API integration for real financial data
- Advanced retirement modeling with multiple tax buckets
- Roth conversion strategy modeling
- SEPP (Substantially Equal Periodic Payments) support
- Interactive charts and visualizations
- Real vs nominal value calculations with inflation
- Responsive design with Tailwind CSS
- TypeScript implementation with full type safety
- Local storage for user settings and preferences
- Demo mode for testing without API credentials

### Features
- **Core Modeling**: Current age, retirement age, life expectancy planning
- **Financial Accounts**: Pre-tax, Roth, and taxable account tracking
- **Contribution Planning**: Monthly contribution modeling
- **Return Modeling**: Annual returns, inflation rates, safe withdrawal rates
- **Tax Optimization**: Effective tax rate modeling
- **Advanced Strategies**: Roth conversions with age ranges and amounts
- **Scenario Planning**: Multiple financial scenarios with different parameters
- **Data Visualization**: Projection charts and withdrawal strategy charts
- **User Interface**: Clean, modern UI with intuitive navigation

### Technical
- Next.js 16 with App Router
- React 19 with modern hooks
- Zod for data validation
- Recharts for data visualization
- shadcn/ui component library
- Comprehensive error handling
- API route for LunchMoney integration

### Security
- Client-side token storage in localStorage
- No server-side credential storage
- Token validation and error handling
- Demo mode for safe testing

---

## Version History

### Version 0.1.0 (Current)
- Initial public release
- Full feature set for retirement planning
- LunchMoney API integration
- Comprehensive documentation

### Future Roadmap
- Version 0.2.0: Additional financial calculators
- Version 0.3.0: Export functionality
- Version 0.4.0: Additional API integrations
- Version 1.0.0: Production-ready multi-tenant version
