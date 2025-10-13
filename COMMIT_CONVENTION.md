# 📝 Commit Convention Guide

This project uses **Conventional Commits** to automate semantic versioning and release generation.

## 🎯 Why Use Conventional Commits?

- ✅ **Automatic versioning**: Semantic Release automatically determines the next version
- ✅ **Automatic changelog**: Generated automatically based on commits
- ✅ **Automatic releases**: Published automatically to JSR and NPM
- ✅ **Clear history**: Commits are descriptive and structured

---

## 📋 Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples:
```bash
feat: add cart mandate JWT signing functionality
fix: resolve signature verification issue in ChecksumValidator
docs: update README with new installation instructions
refactor: improve error handling in JWT service
test: add comprehensive tests for mandate validation
chore: update dependencies to latest versions
```

---

## 🔧 Commit Types

| Type | Description | Version | Example |
|------|-------------|---------|---------|
| `feat` | New functionality | **MINOR** | `feat: add payment mandate validation` |
| `fix` | Bug fixes | **PATCH** | `fix: resolve JWT expiration check` |
| `docs` | Documentation changes | **PATCH** | `docs: update API reference` |
| `style` | Formatting, spaces, etc. | **PATCH** | `style: format code with prettier` |
| `refactor` | Refactoring without functional changes | **PATCH** | `refactor: improve mandate factory structure` |
| `test` | Add or modify tests | **PATCH** | `test: add integration tests for JWT` |
| `chore` | Maintenance tasks | **PATCH** | `chore: update build scripts` |
| `perf` | Performance improvements | **PATCH** | `perf: optimize mandate serialization` |
| `ci` | CI/CD changes | **PATCH** | `ci: add automated publishing workflow` |
| `build` | Build system changes | **PATCH** | `build: update deno.jsonc configuration` |

---

## 🚨 Breaking Changes (MAJOR Version)

For changes that break compatibility, use `!` or `BREAKING CHANGE:`:

### Method 1: With `!`
```bash
feat!: redesign mandate validation API
refactor!: change JWT payload structure
```

### Method 2: With footer
```bash
feat: add new authentication method

BREAKING CHANGE: The old authentication API has been removed.
Users must migrate to the new JWT-based authentication.
```

---

## 🎯 Recommended Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| `jwt` | JWT/JOSE related changes | `feat(jwt): add ES256 algorithm support` |
| `mandates` | Mandate classes and logic | `fix(mandates): resolve cart expiry validation` |
| `validation` | Validation framework | `feat(validation): add custom validation rules` |
| `types` | TypeScript types and interfaces | `refactor(types): improve mandate type definitions` |
| `utils` | Utility functions | `feat(utils): add date formatting helpers` |
| `docs` | Documentation changes | `docs(readme): update installation instructions` |
| `ci` | CI/CD and workflows | `ci(publish): add semantic release automation` |

---

## 📝 Commit Description

### ✅ Good examples:
```bash
feat: add replay attack prevention to JWT validation
fix: resolve memory leak in mandate serialization
docs: add comprehensive API examples to README
test: increase coverage for cart mandate edge cases
```

### ❌ Examples to avoid:
```bash
fix: bug fix
feat: new feature
update: changes
wip: work in progress
```

---

## 🔄 Complete Examples

### New functionality:
```bash
feat(jwt): add support for ES256 signature algorithm

- Implement ES256 key generation
- Add ES256 signing and verification
- Update tests for new algorithm
- Add documentation for ES256 usage

Closes #45
```

### Bug fix:
```bash
fix(validation): resolve cart expiry validation edge case

The cart expiry validation was incorrectly rejecting carts
that expire exactly at the current timestamp.

Fixes #123
```

### Breaking change:
```bash
feat(mandates)!: redesign mandate factory API

Replace static factory methods with builder pattern for
better flexibility and type safety.

BREAKING CHANGE:
- `IntentMandateClass.createNew()` replaced with `new IntentMandateBuilder()`
- `CartMandateClass.createNew()` replaced with `new CartMandateBuilder()`

Migration guide available in MIGRATION.md
```

---

## 🤖 Automation

### Automatic Versioning:

| Commits | Current Version | New Version |
|---------|----------------|-------------|
| `fix: bug` | 1.2.3 | 1.2.4 |
| `feat: new feature` | 1.2.3 | 1.3.0 |
| `feat!: breaking change` | 1.2.3 | 2.0.0 |

### Automatic Process:

1. **Push to main** → Semantic Release analyzes commits
2. **Calculate new version** → Updates `deno.jsonc`
3. **Generate changelog** → Creates release notes
4. **Publish automatically** → JSR + NPM
5. **Create GitHub release** → With generated notes

---

## 🛠️ Useful Tools

### Git Hooks (Optional):
```bash
# Install commitizen for guided commits
npm install -g commitizen cz-conventional-changelog

# Configure
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# Use
git cz  # Instead of git commit
```

### VS Code Extensions:
- **Conventional Commits**: Helps with commit formatting
- **GitLens**: Better history visualization

---

## 📚 References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)

---

**💡 Tip**: Always include the "why" in the commit body, not just the "what" in the title.