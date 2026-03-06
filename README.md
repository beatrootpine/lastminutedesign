# Last Minute Design — Deploy to Vercel

## 🚀 Deploy in 5 minutes

### Step 1: Push to GitHub
```bash
cd lastminutedesign
git init
git add .
git commit -m "initial commit - lastminutedesign.co.za"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lastminutedesign.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"Add New Project"**
3. Import your `lastminutedesign` repo
4. Vercel auto-detects Vite — just click **Deploy**
5. Wait ~60 seconds for build to complete

### Step 3: Connect your domain
1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Type `lastminutedesign.co.za` → click **Add**
3. Vercel shows you DNS records (usually an A record and/or CNAME)
4. Go to your domain registrar's DNS settings and add:

| Type  | Name | Value              |
|-------|------|--------------------|
| A     | @    | 76.76.21.21        |
| CNAME | www  | cname.vercel-dns.com |

5. Wait 5-15 minutes for DNS to propagate
6. Vercel auto-provisions SSL — your site is live at `https://lastminutedesign.co.za`

### Step 4: Verify
- Visit `https://lastminutedesign.co.za` ✅
- Visit `https://www.lastminutedesign.co.za` (redirects to root) ✅

---

## Local Development
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

## Build
```bash
npm run build
```
Output in `dist/` folder
