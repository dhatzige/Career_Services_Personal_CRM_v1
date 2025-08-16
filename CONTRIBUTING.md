# Contributing to Career Services CRM

Thank you for your interest in contributing to Career Services CRM! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account (for auth)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/career-services-crm.git
   cd career-services-crm
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Frontend
   cp .env.example .env.local
   
   # Backend  
   cp backend/.env.example backend/.env
   ```

4. **Configure Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Update `.env.local` and `backend/.env` with your Supabase credentials
   - See [SUPABASE_SETUP_GUIDE.md](docs/setup/SUPABASE_SETUP_GUIDE.md) for details

5. **Start development servers**
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

## 🛡️ Security Guidelines

### CRITICAL - Never Commit Secrets
- ✅ Use environment variables for ALL sensitive data
- ✅ Never commit `.env` files with real values
- ✅ Use `.env.example` files for documentation
- ❌ Never hardcode API keys, passwords, or tokens in source code

### Code Security Standards
- Validate all user inputs (client AND server side)
- Use parameterized queries for database operations
- Sanitize data before storing or displaying
- Follow principle of least privilege for user permissions
- Use HTTPS for all external API calls

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing ESLint configuration
- Use Prettier for code formatting
- Write self-documenting code with clear variable names

### Git Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit with clear messages: `git commit -m "feat: add user management"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

### Testing
- Write unit tests for new functions
- Add integration tests for API endpoints
- Update E2E tests for UI changes
- Ensure all tests pass before submitting PR

## 🏗️ Project Structure

```
career-services-crm/
├── src/                    # Frontend React app
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components
│   ├── services/          # API client and external services
│   ├── contexts/          # React contexts (auth, theme)
│   └── utils/             # Helper functions
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   └── routes/        # API route definitions
│   └── data/              # SQLite database files
├── docs/                  # Documentation
├── playwright/            # E2E tests
└── public/                # Static assets
```

## 🎯 Areas for Contribution

### High Priority
- **Performance optimizations** - Bundle size, loading times
- **Accessibility improvements** - WCAG compliance
- **Mobile responsiveness** - Better mobile UX
- **Test coverage** - Increase test coverage

### Medium Priority
- **Feature enhancements** - New student management features
- **UI/UX improvements** - Better user experience
- **Documentation** - API docs, user guides
- **Internationalization** - Multi-language support

### Nice to Have
- **Dark mode improvements** - Better theme consistency
- **Keyboard shortcuts** - Power user features
- **Export formats** - Additional data export options
- **Integrations** - Third-party service connections

## 🐛 Bug Reports

When reporting bugs, please include:
- **Description**: Clear description of the issue
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable

## 💡 Feature Requests

For feature requests, please provide:
- **Use case**: Why is this feature needed?
- **Description**: What should the feature do?
- **Mockups**: UI mockups if applicable
- **Acceptance criteria**: How to know when it's complete

## 📋 Pull Request Process

1. **Before submitting**:
   - ✅ Tests pass: `npm test`
   - ✅ Linting passes: `npm run lint`
   - ✅ TypeScript compiles: `npm run build`
   - ✅ No console errors in development

2. **PR Description should include**:
   - Summary of changes
   - Issue number (if applicable): `Fixes #123`
   - Testing instructions
   - Screenshots (for UI changes)

3. **Review Process**:
   - Code review by maintainer
   - Automated tests must pass
   - Security check for sensitive changes
   - Performance impact assessment

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation updates
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `security` - Security-related issues
- `performance` - Performance improvements

## 📞 Getting Help

- **Documentation**: Check the `docs/` folder
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Email**: security@yourdomain.com for security issues

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Career Services CRM! Your help makes this project better for everyone. 🎉