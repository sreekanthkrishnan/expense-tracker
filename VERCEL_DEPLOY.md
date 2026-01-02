# Deploying to Vercel

This guide will help you deploy your Personal Finance Tracker to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Environment Variables** (Optional)
   - In the project settings, go to "Environment Variables"
   - Add `VITE_OPENAI_API_KEY` if you want AI-powered expense reduction advice
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables** (if needed)
   ```bash
   vercel env add VITE_OPENAI_API_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Optional: OpenAI API Key
- **Variable Name**: `VITE_OPENAI_API_KEY`
- **Description**: API key for OpenAI ChatGPT integration (for AI-powered expense reduction advice)
- **Required**: No (app works without it, but AI advice feature will be disabled)
- **Get it from**: [OpenAI Platform](https://platform.openai.com/api-keys)

## Build Configuration

Vercel will automatically:
- Detect this as a Vite project
- Run `npm install` to install dependencies
- Run `npm run build` to build the project
- Serve the `dist` folder as a static site

## Post-Deployment

After deployment:
1. Your app will be available at `https://your-project-name.vercel.app`
2. You can add a custom domain in the Vercel project settings
3. Every push to your main branch will trigger a new deployment

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally
- Check the build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure variable names start with `VITE_` for Vite to expose them
- Redeploy after adding environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

### App Not Loading
- Check that `vercel.json` has the correct rewrite rules
- Ensure the build output directory is `dist`
- Check browser console for errors

## Notes

- All data is stored locally in the user's browser (IndexedDB/LocalStorage)
- No backend is required
- The app works completely offline after the first load
- OpenAI API calls are made directly from the browser (client-side only)

