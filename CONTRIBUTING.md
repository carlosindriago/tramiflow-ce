# Contributing to TramiFlow CE

Thank you for your interest in contributing! This project follows a structured methodology to ensure high code quality and rigorous security standards.

## 🔄 Git Workflow

We use a standard feature-branch methodology:

- **`main`**: Production branch (stable releases).
- **`develop`**: Main integration branch. All development converges here.
- **Feature Branches**: Branches for new features or bug fixes.
  - Format: `feat/feature-name` or `fix/fix-name`.
  - Created from `develop` and merged back to `develop`.

## 🛠️ Development Guidelines

To ensure code quality and prevent data leaks in our multi-tenant architecture, please follow these guidelines:

### 1. Preparation
- Always start from the latest `develop` branch: `git checkout develop && git pull`
- Create a descriptive branch: `git checkout -b feat/TRAMI-XXX-description`
- **Security Check**: Always verify the multi-tenancy impact of your changes. Ensure `organization_id` is used in all relevant database queries.

### 2. Implementation Rules
- **TypeScript & Linting**: We use strict TypeScript. Run `npm run build` to verify there are no type or linting errors before committing. Do not rely solely on the dev server.
- **Clean Code**: Remove all debugging `console.log` statements before opening a PR.
- **Supabase RLS**: Double-check that EVERY Supabase query explicitly enforces the tenant boundary, e.g., `.eq('organization_id', orgId)`.

### 3. Pull Request Process
- Use conventional commits: `git commit -m "feat: description"` or `git commit -m "fix: description"`.
- Push your branch: `git push -u origin branch-name`
- Open a Pull Request targeting the `develop` branch.
- Provide a clear description of the changes and link any related issues.
- Wait for a code review and CI checks to pass before merging.

### 4. Post-Merge
- Update your local repository: `git checkout develop && git pull`
- Clean up your local branch: `git branch -d branch-name`
