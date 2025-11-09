# 🚀 Deploy to Railway - 5 Minutes

## Prerequisites
- GitHub account
- Railway account (free)
- Git repository pushed

## Steps

### 1. Generate JWT Secret (30 seconds)
```bash
openssl rand -base64 32
```
**Copy the output!**

### 2. Connect to Railway (1 minute)
1. Go to https://railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub repo
4. Select `research-commons`

### 3. Set Environment (1 minute)
Railway dashboard → Variables:
```
JWT_SECRET=<paste-your-secret>
NODE_ENV=production
```

### 4. Add Storage (1 minute)  
Railway → Settings → Volumes:
- Mount path: `/app/data`
- Size: 1 GB

### 5. Wait for Deploy (2 minutes)
Railway automatically:
- Installs dependencies
- Builds backend + frontend
- Initializes defaults
- Starts server

## Your URL
Railway gives you: `https://research-commons-production-xxxx.up.railway.app`

## First Login
1. Visit URL
2. Click "Register"
3. Create your account

## Make Yourself Admin
```bash
railway shell
npx tsx create-admin-user.ts
```

## Done! 🎉

Your research platform is live and ready for feedback!

## What Users Get
- Upload conversations
- Annotate with collaborative tags
- Comment and discuss
- Rate submission quality
- Dark mode
- Mobile support

## Cost
$5-10/month on Railway Hobby plan

---

**Need help?** Check `DEPLOYMENT.md` for detailed guide
