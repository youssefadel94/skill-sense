# Architecture Decision: Monolithic App vs. Modular Libraries

**Date:** November 9, 2025
**Status:** Decided - Monolithic App Approach
**Decision Maker:** AI Assistant based on project constraints

## Context

The original architecture plans suggested a modular library structure using Angular's `projects/` folder:

```
projects/
  skill-sense-core/       # Models, interfaces, services
  skill-sense-ui/         # Shared components
  skill-sense-profile/    # Profile feature library
  skill-sense-sources/    # Source connectors UI
```

## Decision

**We will use a MONOLITHIC APP approach** (current implementation) for SkillSense v1.0.

All frontend code will reside in `apps/skill-sense-shell/` without separate library projects.

## Rationale

### Advantages of Monolithic App Approach

1. **Faster Development** ⚡
   - No library scaffolding overhead
   - No public-api.ts maintenance
   - Direct imports without package configuration
   - Immediate feature implementation

2. **Simpler Build Process** 🔨
   - Single compilation target
   - No library dependency management
   - Faster build times for small projects
   - Easier debugging

3. **Lower Complexity** 📦
   - No cross-library versioning
   - No circular dependency issues
   - Cleaner file structure for hackathon/MVP
   - Easier onboarding for new developers

4. **Project Size** 📊
   - Current estimate: 15-20 components
   - Single team/developer
   - No multi-app code sharing needed yet

### When to Migrate to Modular Libraries

Consider migrating when:

- **Multiple apps** need to share code (e.g., admin dashboard, mobile app)
- **Team grows** beyond 5+ developers
- **Component count** exceeds 50+
- **External package** needs to be published
- **Clear boundaries** between domains emerge

## Implementation Structure

### Current Monolithic Structure

```
apps/skill-sense-shell/src/app/
├── auth/                   # Authentication components
│   ├── login.component.ts
│   ├── register.component.ts
│   └── auth.guard.ts
├── dashboard/              # Dashboard feature
│   ├── dashboard.component.ts
│   └── dashboard.routes.ts
├── profile/                # Profile management
│   ├── profile.component.ts
│   ├── profile-edit.component.ts
│   └── profile.service.ts
├── skills/                 # Skills display & management
│   ├── skill-card.component.ts
│   ├── skill-list.component.ts
│   └── skill-gap.component.ts
├── upload/                 # CV upload feature
│   ├── upload.component.ts
│   └── upload.service.ts
├── services/               # Shared services
│   ├── api.service.ts
│   ├── auth.service.ts
│   └── storage.service.ts
├── components/             # Shared UI components
│   ├── simple-chart.component.ts
│   └── loading-spinner.component.ts
├── models/                 # TypeScript interfaces
│   ├── skill.model.ts
│   ├── profile.model.ts
│   └── evidence.model.ts
└── utils/                  # Utility functions
    ├── chart-data.util.ts
    └── validators.ts
```

### Benefits of This Structure

- ✅ All code in one place
- ✅ Easy refactoring with IDE
- ✅ No build configuration complexity
- ✅ Fast iteration cycles
- ✅ Clear feature-based organization

### Migration Path (Future)

When needed, migration is straightforward:

```bash
# Generate libraries
ng generate library skill-sense-core
ng generate library skill-sense-ui

# Move code to libraries
mv apps/skill-sense-shell/src/app/models/* projects/skill-sense-core/src/lib/
mv apps/skill-sense-shell/src/app/components/* projects/skill-sense-ui/src/lib/

# Update imports (automated with IDE)
```

## Comparison Table

| Aspect | Monolithic App | Modular Libraries |
|--------|---------------|-------------------|
| **Setup Time** | Minutes | Hours |
| **Build Speed** | Fast | Medium |
| **Code Sharing** | Copy/paste | Import |
| **Maintenance** | Simple | Complex |
| **Best For** | Single app, MVP | Multi-app, large teams |
| **Our Project** | ✅ Perfect fit | ❌ Overkill |

## Conclusion

For SkillSense v1.0, the monolithic app approach is:

- **More pragmatic** for current scope
- **Faster to implement** for hackathon timeline
- **Easier to maintain** with single developer
- **Sufficient** for foreseeable future

We maintain the `projects/` folder structure in the workspace but keep it empty for now. If future requirements demand modular libraries, the migration path is clear and well-documented.

## References

- Angular Workspace Configuration: <https://angular.dev/tools/cli/workspace-config>
- Monorepo Best Practices: <https://nx.dev/concepts/more-concepts/applications-and-libraries>
- Original architecture: `plans/01-ARCHITECTURE.md`
