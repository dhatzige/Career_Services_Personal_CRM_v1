# Sentry Source Maps Setup

Source maps allow Sentry to display your original source code instead of minified production code when errors occur.

## Quick Setup

Run the Sentry wizard to configure source maps:

```bash
npx @sentry/wizard@latest -i sourcemaps --saas --org act-l6 --project career-services-frontend
```

This wizard will:
1. Install necessary dependencies
2. Create/update configuration files
3. Set up build-time source map uploading

## Manual Setup (if wizard fails)

### 1. Install Sentry CLI

```bash
npm install --save-dev @sentry/cli @sentry/vite-plugin
```

### 2. Create Sentry Configuration

Create `.sentryclirc` in your project root:

```ini
[defaults]
org = act-l6
project = career-services-frontend

[auth]
token = YOUR_SENTRY_AUTH_TOKEN
```

### 3. Update Vite Configuration

Add to `vite.config.ts`:

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    // Add Sentry plugin
    sentryVitePlugin({
      org: "act-l6",
      project: "career-services-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Enable source map generation
  },
});
```

### 4. Set Environment Variables

Add to `.env.local`:

```env
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=act-l6
SENTRY_PROJECT=career-services-frontend
```

### 5. Update Build Scripts

In `package.json`:

```json
{
  "scripts": {
    "build": "vite build && sentry-cli sourcemaps upload --org act-l6 --project career-services-frontend ./dist"
  }
}
```

## Getting Your Auth Token

1. Go to [Sentry Settings](https://sentry.io/settings/account/api/auth-tokens/)
2. Create a new auth token with these scopes:
   - `project:releases`
   - `org:read`
   - `project:write`

## Testing Source Maps

1. Build your project: `npm run build`
2. Deploy to staging/production
3. Trigger an error
4. Check Sentry - you should see original source code

## Troubleshooting

- **Source maps not showing**: Ensure `sourcemap: true` in vite config
- **Upload failing**: Check auth token permissions
- **Wrong source code**: Clear Sentry releases and re-upload

## CI/CD Integration

For automated deployments, add these environment variables to your CI:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Then run during build:
```bash
npm run build
```

The Vite plugin will automatically upload source maps during the build process.