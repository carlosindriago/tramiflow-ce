# Contributing to TramiFlow CRM

Thank you for your interest in contributing! This project follows a structured methodology optimized for AI-assisted development and rigorous security standards.

## 🔄 Git Workflow

We use a branch-based methodology:

- **`main`**: Production branch (stable).
- **`develop`**: Main integration branch. All development converges here.
- **Feature Branches**: Branches for new features or fixes.
  - Format: `feat/feature-name` or `fix/fix-name`.
  - Created from `develop` and merged back to `develop`.

## 🤖 AI-Assisted Development Workflow (JARVIS)

We use an AI-assisted pull request protocol to ensure quality and compliance.

### Before Coding
1. Update develop branch: `git checkout develop && git pull`
2. Create branch from develop: `git checkout -b feat/TRAMI-XXX-description`
3. Analyze context and present a structured plan.
4. Verify multi-tenancy impact (ensure `organization_id` is always used).

### Before Commit
1. Use the `[JARVIS]` prefix in all commits: `git commit -m "[JARVIS] feat: description"`
2. Verify TypeScript and Linting: `npm run build` (Do NOT rely only on `npm run dev`)
3. Ensure there are no leftover `console.log` statements.
4. Double-check that EVERY Supabase query includes `.eq('organization_id', orgId)`.

### Delivery via Pull Request
1. Push branch: `git push -u origin branch-name`
2. Create PR: `gh pr create --base develop --title "[JARVIS] feat: description" --body "..." --label "AI-Agent"`
3. DO NOT MERGE automatically. Wait for Tech Lead authorization.

### Post-Merge
1. Update local: `git checkout develop && git pull`
2. Clean branch: `git branch -d branch-name`
