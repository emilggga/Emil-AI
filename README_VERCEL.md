# Deployment to Vercel 🚀

To host **Emil AI** on Vercel, follow these steps:

## 1. Prepare your Repository
Make sure your code is pushed to a GitHub, GitLab, or Bitbucket repository.

## 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your repository.

## 3. Configure Build Settings
Vercel should automatically detect **Vite**. If not, use these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 4. Set Environment Variables 🔑
This is the most important step! In the **"Environment Variables"** section, add:
- **Key:** `GEMINI_API_KEY`
- **Value:** (Your Google AI Studio API Key)

## 5. Deploy
Click **"Deploy"**. Vercel will build your app and provide you with a public URL.

---

### Why `vercel.json`?
I have added a `vercel.json` file to your project. This ensures that if you refresh the page or navigate directly to a sub-page, Vercel will correctly serve the app instead of showing a 404 error.

### Security Note
Currently, the API key is injected during the build process. This is fine for personal use, but for a large-scale public app, it's recommended to move the AI calls to a Vercel Serverless Function (Backend) to keep the key hidden from the browser.
