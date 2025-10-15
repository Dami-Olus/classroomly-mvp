# 🚀 ClassroomLY Development Workflow

## Branch Strategy

### **Main Branches**
- **`main`** - Production branch (stable, deployed to Vercel)
- **`develop`** - Development branch (integration branch for features)

### **Feature Branches**
- **`feature/feature-name`** - New features and enhancements
- **`fix/bug-description`** - Bug fixes
- **`hotfix/critical-fix`** - Critical production fixes

## 🔄 Development Process

### **1. Starting New Work**
```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature-name
```

### **2. Development Workflow**
```bash
# Make changes, commit frequently
git add .
git commit -m "feat: add new feature"

# Push feature branch
git push origin feature/new-feature-name
```

### **3. Merging to Develop**
```bash
# Create Pull Request on GitHub
# OR merge locally:
git checkout develop
git merge feature/new-feature-name
git push origin develop
```

### **4. Deploying to Production**
```bash
# Only when ready for production
git checkout main
git merge develop
git push origin main
# Vercel auto-deploys from main
```

## 📋 Branch Naming Conventions

### **Features**
- `feature/user-dashboard`
- `feature/payment-integration`
- `feature/ai-summaries`

### **Bug Fixes**
- `fix/login-error`
- `fix/booking-calendar`
- `fix/video-session`

### **Hotfixes**
- `hotfix/critical-security-patch`
- `hotfix/urgent-database-fix`

## 🎯 Workflow Rules

### **✅ DO:**
- Always create feature branches from `develop`
- Test features thoroughly before merging
- Use descriptive commit messages
- Create Pull Requests for code review
- Keep `main` branch stable and deployable

### **❌ DON'T:**
- Push directly to `main` (except hotfixes)
- Merge untested code to `develop`
- Work directly on `main` or `develop`
- Skip code review for complex changes

## 🔧 Quick Commands

### **Start New Feature**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### **Finish Feature**
```bash
# Push your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# OR merge to develop:
git checkout develop
git merge feature/your-feature-name
git push origin develop
```

### **Deploy to Production**
```bash
git checkout main
git merge develop
git push origin main
```

## 🚨 Emergency Hotfixes

For critical production issues:

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix
# Make fix
git commit -m "hotfix: critical production fix"
git push origin hotfix/critical-fix

# Merge to both main and develop
git checkout main
git merge hotfix/critical-fix
git push origin main

git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

## 📊 Branch Protection Rules

### **Main Branch**
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main

### **Develop Branch**
- Require pull request reviews for complex changes
- Allow direct pushes for small fixes
- Require status checks to pass

## 🎉 Benefits

✅ **Stable Production** - Main branch always deployable  
✅ **Code Review** - All changes reviewed before production  
✅ **Feature Isolation** - Features developed independently  
✅ **Easy Rollbacks** - Can revert specific features  
✅ **Team Collaboration** - Multiple developers can work simultaneously  
✅ **Quality Control** - Testing before production deployment  

## 📝 Commit Message Format

```
type(scope): description

feat(auth): add password reset functionality
fix(booking): resolve calendar timezone issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): simplify user authentication
test(booking): add unit tests for booking logic
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 🚀 Ready to Start!

From now on, all new features will be developed on feature branches and merged through the proper workflow. This ensures:

- **Production stability**
- **Code quality**
- **Team collaboration**
- **Easy rollbacks**
- **Professional development process**

Happy coding! 🎯
