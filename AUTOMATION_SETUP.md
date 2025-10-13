# 🤖 Automation Setup Guide

This document explains the complete automated workflow for versioning, building, and publishing the AP2 library.

## 🎯 Overview

The project now has **fully automated** versioning and publishing using:
- **Semantic Release** for automatic versioning
- **Conventional Commits** for commit analysis
- **GitHub Actions** for CI/CD
- **JSR + NPM** automatic publishing

---

## 📋 How It Works

### 1. **Developer Workflow**
```bash
# 1. Make changes following conventional commits
git add .
git commit -m "feat: add new mandate validation feature"

# 2. Push to main branch
git push origin main

# 3. Everything else is automatic! 🚀
```

### 2. **Automatic Process**
1. **Push to main** triggers GitHub Action
2. **Tests run** and must pass
3. **Semantic Release analyzes** commits since last release
4. **Version calculated** automatically (patch/minor/major)
5. **deno.jsonc updated** with new version
6. **CHANGELOG.md generated** with release notes
7. **Git tag created** and commit pushed
8. **JSR published** automatically (OIDC auth)
9. **NPM published** automatically (token auth)
10. **GitHub Release created** with generated notes

---

## 🔧 Configuration Files

### Created Files:
- `COMMIT_CONVENTION.md` - Commit guidelines
- `.releaserc.json` - Semantic Release configuration
- `scripts/update-version.ts` - Version update script
- `.github/workflows/publish.yml` - Publishing workflow
- `AUTOMATION_SETUP.md` - This documentation

### Key Features:
- ✅ **Zero manual versioning** - All automatic
- ✅ **Conventional commits** - Structured commit messages
- ✅ **Auto-generated changelog** - From commit history
- ✅ **Dual publishing** - JSR + NPM simultaneously
- ✅ **Quality gates** - Tests must pass before release

---

## 🚨 Setup Requirements

Before the automation works, you need to configure:

### 1. **GitHub Secrets**
Add these in GitHub repo settings > Secrets and variables > Actions:

```
NPM_TOKEN=npm_xxxxxxxxxxxxxxxx
```

### 2. **JSR Package Linking**
1. Go to [jsr.io](https://jsr.io/@xja77/ap2-lib)
2. Navigate to package settings
3. Link to GitHub repository: `xja77/ap2-lib`
4. Save configuration

### 3. **Repository Permissions**
Ensure GitHub Actions has:
- ✅ Read repository contents
- ✅ Write to repository (for version commits)
- ✅ Create releases
- ✅ Write to pull requests/issues

---

## 📝 Version Bumping Rules

| Commit Type | Example | Version Change |
|-------------|---------|----------------|
| `fix:` | `fix: resolve JWT validation bug` | `1.0.0` → `1.0.1` |
| `feat:` | `feat: add new mandate type` | `1.0.0` → `1.1.0` |
| `feat!:` | `feat!: redesign API interface` | `1.0.0` → `2.0.0` |
| `BREAKING CHANGE:` | See commit body | `1.0.0` → `2.0.0` |

### Multiple Commits:
- If multiple types in same release → **highest version wins**
- Example: `fix:` + `feat:` = minor version bump
- Example: `feat:` + `feat!:` = major version bump

---

## 🔄 Release Process

### Automatic Releases:
- **Triggered by**: Push to `main` branch
- **Frequency**: Every push with releasable commits
- **Version source**: `deno.jsonc` (updated automatically)

### Manual Releases:
- **Not needed** - everything is automatic
- **Emergency**: Can manually trigger workflow from GitHub Actions tab

---

## 📊 Generated Artifacts

Each release automatically creates:

### 1. **Version Updates**
- `deno.jsonc` - Updated version field
- `npm/package.json` - Updated NPM package version

### 2. **Documentation**
- `CHANGELOG.md` - Auto-generated release notes
- GitHub Release - With formatted changelog

### 3. **Published Packages**
- **JSR**: `@xja77/ap2-lib@x.y.z`
- **NPM**: `ap2-lib@x.y.z`

### 4. **Git References**
- Git tag: `vx.y.z`
- Release commit: `chore(release): x.y.z [skip ci]`

---

## 🛠️ Troubleshooting

### Common Issues:

#### **No release created**
- Check if commits follow conventional format
- Verify `chore:` commits don't trigger releases
- Check GitHub Actions logs

#### **JSR publish fails**
- Ensure repository is linked in JSR settings
- Verify OIDC permissions are enabled
- Check package name matches JSR configuration

#### **NPM publish fails**
- Verify `NPM_TOKEN` secret is configured
- Check token has publish permissions
- Ensure package name is available

#### **Version not updating**
- Check `scripts/update-version.ts` permissions
- Verify `deno.jsonc` format is valid
- Check semantic-release logs

---

## 🔍 Monitoring

### Check Automation Status:
1. **GitHub Actions tab** - View workflow runs
2. **Releases page** - See published releases
3. **JSR package page** - Verify JSR publishes
4. **NPM package page** - Verify NPM publishes

### Logs to Check:
- GitHub Actions workflow logs
- Semantic Release analysis logs
- JSR publish logs
- NPM publish logs

---

## 🚀 Benefits

### For Developers:
- ✅ **No manual versioning** - Just write good commits
- ✅ **Instant feedback** - Know immediately if release works
- ✅ **Clean history** - Automated, consistent releases
- ✅ **Error prevention** - No manual version mistakes

### For Users:
- ✅ **Faster releases** - Automatic publishing on every change
- ✅ **Clear changelogs** - Generated from actual commits
- ✅ **Reliable versions** - Semantic versioning guaranteed
- ✅ **Multiple sources** - Available on JSR and NPM

---

**🎉 Your automation is now complete and ready to use!**