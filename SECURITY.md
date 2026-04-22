# Security Policy

## 🛡️ Security Measures

This project takes security seriously, especially when handling financial data. Here are the security measures we've implemented:

### Data Protection
- **No server-side credential storage** - API tokens are stored only in browser localStorage
- **Client-side processing** - All financial calculations happen in the user's browser
- **HTTPS enforcement** - All API communications use secure connections
- **Token validation** - API tokens are validated before use
- **Demo mode** - Safe testing without real credentials

### API Security
- **LunchMoney API integration** follows OAuth best practices
- **Token scope limitation** - Only requests necessary data
- **Error handling** - Sensitive information is not exposed in error messages
- **Rate limiting awareness** - Respects API rate limits

### Code Security
- **Input validation** using Zod schemas
- **TypeScript** for type safety
- **Dependency management** with regular security updates
- **No hardcoded credentials** in source code

## 🔒 Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly.

### How to Report
**Email:** [your-email@example.com] *(replace with your actual email)*
**Subject:** Security Vulnerability Report - Retirement Modeler

### What to Include
- **Vulnerability type** (e.g., XSS, authentication bypass, data exposure)
- **Steps to reproduce** the vulnerability
- **Potential impact** on users
- **Screenshots or code examples** if applicable

### Response Timeline
- **Initial response:** Within 48 hours
- **Assessment:** Within 7 days
- **Resolution:** Based on severity and complexity

## 🚨 Security Best Practices for Users

### For Users
1. **Keep your LunchMoney API token secure**
2. **Use strong, unique passwords** for your LunchMoney account
3. **Enable two-factor authentication** on LunchMoney
4. **Regularly rotate API tokens** if concerned
5. **Only use official repositories** and verified sources

### For Contributors
1. **Never commit credentials** or sensitive data
2. **Use environment variables** for any secrets
3. **Review code for security issues** before submitting PRs
4. **Follow secure coding practices**
5. **Report security concerns** privately

## 📋 Security Checklist

### Before Deploying
- [ ] No hardcoded credentials in code
- [ ] Environment variables are properly configured
- [ ] Dependencies are up-to-date
- [ ] HTTPS is enforced
- [ ] Error messages don't leak sensitive information

### For Contributors
- [ ] Code reviewed for security issues
- [ ] Input validation implemented
- [ ] Output encoding for user data
- [ ] Proper error handling
- [ ] No sensitive data in logs

## 🔄 Security Updates

We monitor security issues and update dependencies regularly. Security updates will be:

- **Prioritized** over feature development
- **Documented** in changelog
- **Communicated** through security advisories
- **Released** as patch updates when possible

## 📞 Contact

For security-related questions or concerns:
- **Security issues:** Email above (private)
- **General security questions:** Use GitHub Issues with `security` label
- **Urgent security matters:** Include "URGENT" in email subject

---

Thank you for helping keep this project secure! 🔒
