# Deployment Workflow Setup

## Overview
This repository now includes an automated deployment workflow using GitHub Actions that deploys the application to production using Encore Cloud.

## Key Features
- ✅ **Automatic Encore CLI installation** - Resolves "encore: command not found" error
- ✅ **Production deployment** - Uses `encore deploy` instead of `encore test`
- ✅ **Proper build process** - Builds frontend and backend correctly
- ✅ **Secure authentication** - Uses GitHub secrets for Encore authentication

## Setup Instructions

### 1. Configure GitHub Secrets
Add the following secret to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:

| Secret Name | Description | How to get it |
|-------------|-------------|---------------|
| `ENCORE_AUTH_TOKEN` | Encore authentication token | Run `encore auth login` locally, then `encore auth whoami --show-token` |

### 2. Workflow Triggers
The deployment workflow runs:
- **Automatically** on every push to the `main` branch
- **Manually** via GitHub Actions "Run workflow" button

### 3. Deployment Process
The workflow performs these steps:
1. Installs Bun package manager
2. Installs Encore CLI using official installer
3. Installs project dependencies
4. Builds the application (frontend + backend)
5. Deploys to production using `encore deploy`

### 4. Monitoring Deployments
- View deployment status in the **Actions** tab of your repository
- Check deployment logs for any issues
- Monitor your application on [Encore Cloud Dashboard](https://app.encore.cloud)

## Troubleshooting

### Common Issues

**"encore: command not found"**
- ✅ **RESOLVED**: The workflow now automatically installs Encore CLI

**Authentication errors**
- Ensure `ENCORE_AUTH_TOKEN` secret is correctly set
- Token should be from the same Encore account that owns the application

**Build failures**
- Check that all dependencies are properly listed in package.json files
- Verify that the frontend builds successfully locally

### Manual Deployment
If you need to deploy manually:

```bash
# Install Encore CLI (if not already installed)
curl -L https://encore.dev/install.sh | bash

# Authenticate
encore auth login

# Deploy
bun run deploy
```

## Security Notes
- Never commit the `ENCORE_AUTH_TOKEN` to the repository
- The token is securely stored as a GitHub secret
- All deployments are logged and auditable through GitHub Actions