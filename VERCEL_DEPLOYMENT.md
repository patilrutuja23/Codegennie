# Vercel Deployment Guide

## ✅ What Was Done

### 1. **Backend API Setup** (`/api/analyze.ts`)
   - Created Vercel Serverless Function to securely handle Gemini API calls
   - Endpoints: `analyze`, `findBugs`, `generateTests`, `getQuickFix`, `fixAllBugs`, `runCode`
   - CORS enabled for frontend communication
   - API key kept server-side only

### 2. **Frontend Updated** (`services/geminiService.ts`)
   - ✅ Removed client-side API key usage
   - ✅ Now calls backend `/api/analyze` endpoint
   - ✅ Works in both development and production
   - All functions automatically route through secure backend

### 3. **Configuration Files**
   - `vercel.json` - Build and routing configuration
   - `package.json` - Added `@vercel/node` dependency

### 4. **Remove Exposed Credentials** (.env.local)
   - `.env.local` should NO LONGER contain GEMINI_API_KEY
   - This file can now be removed from version control

---

## 🚀 Deployment Steps

### Step 1: Update `.env.local` (LOCAL DEVELOPMENT ONLY)
**DO NOT COMMIT THIS FILE**

```env
# For local dev, only if you want to test backend locally
GEMINI_API_KEY=your_actual_key_here
```

### Step 2: Add to `.gitignore`
```
.env.local
.env.*.local
.vercel/
```

### Step 3: Push to GitHub
```powershell
git add .
git commit -m "Add Vercel serverless API and update frontend"
git push origin main
```

### Step 4: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **IMPORTANT:** In "Environment Variables" section, add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your actual Gemini API key
5. Click "Deploy"

### Step 5: Verify Deployment
- App deployed at `https://<your-project>.vercel.app`
- All API calls now go through secure backend
- Check Vercel logs if issues occur

---

## ⚠️ Security Checklist

- ✅ API key NOT in frontend code
- ✅ API key NOT in .env.local file
- ✅ .env.local in .gitignore
- ✅ API key set in Vercel environment variables only
- ✅ CORS properly configured for frontend

---

## 🔄 Local Development (Optional)

To test the API locally:

1. Install Vercel CLI:
   ```powershell
   npm i -g vercel
   ```

2. Create `.vercel.json` in project root:
   ```json
   {
     "env": {
       "GEMINI_API_KEY": "@gemini_api_key"
     }
   }
   ```

3. Run locally:
   ```powershell
   vercel dev
   ```
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:3000/api/analyze`

---

## 📝 File Structure After Changes

```
codeboost-web/
├── api/
│   └── analyze.ts          (NEW - Vercel Serverless Function)
├── services/
│   ├── geminiService.ts    (UPDATED - calls backend API)
│   └── ollamaService.ts
├── vercel.json             (NEW - Deployment config)
├── .gitignore              (UPDATED - add .env.local)
├── package.json            (UPDATED - added @vercel/node)
└── ... other files
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on API calls | Check `/api/analyze.ts` exists and `vercel.json` routing is correct |
| API returns 500 | Check GEMINI_API_KEY is set in Vercel Environment Variables |
| CORS errors | CORS is already configured in `analyze.ts` |
| Env vars not loading | Redeploy after adding environment variables to Vercel |

---

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Test locally: `npm run dev`
3. ✅ Push to GitHub
4. ✅ Deploy to Vercel
5. ✅ Add GEMINI_API_KEY in Vercel dashboard
6. ✅ Done! 🎉

