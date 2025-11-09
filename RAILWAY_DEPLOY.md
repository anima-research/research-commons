# 🚂 Railway Deployment Checklist

## Pre-Deployment

- [x] Dark mode complete
- [x] Collaborative annotations working
- [x] Tag voting system functional
- [x] Model registry implemented
- [x] All views responsive (mobile + desktop)
- [x] Build scripts configured
- [x] Production frontend serving setup
- [x] .gitignore configured

## Railway Setup Steps

### 1. Push to GitHub

```bash
cd research-commons
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `connectome-local/research-commons` (or your fork)
5. Railway auto-detects Node.js and starts building

### 3. Configure Environment Variables

In Railway dashboard → Variables tab, add:

**Required:**
```bash
NODE_ENV=production
PORT=3020
JWT_SECRET=<run: openssl rand -base64 32>
```

**Optional (with defaults):**
```bash
DATABASE_PATH=/app/data/research.db
SUBMISSIONS_PATH=/app/data/submissions
DATA_PATH=/app/data
```

### 4. Add Persistent Storage

**Critical for data persistence!**

Railway dashboard → Settings → Volumes:
- Click **"+ New Volume"**
- **Mount Path:** `/app/data`
- **Size:** 1 GB (start small, can increase)

Without this, all data will be lost on each deployment!

### 5. Deploy

Railway will automatically:
1. Install dependencies
2. Build TypeScript backend
3. Build Vue frontend
4. Run `deploy:init` (creates default ontologies, rankings, models)
5. Start server on assigned port

### 6. Get Your URL

Railway generates URL like: `https://research-commons-production-xxxx.up.railway.app`

## Post-Deployment Tasks

### Create Admin User

```bash
# Option A: Using Railway CLI
railway run npx tsx create-admin-user.ts

# Option B: Using Railway shell
railway shell
npx tsx create-admin-user.ts
```

### Test Deployment

1. **Visit your Railway URL**
2. **Register** a test account
3. **Login** 
4. Check:
   - [ ] Browse view loads
   - [ ] Can view ontologies, rankings, models
   - [ ] Submit conversation works
   - [ ] Annotation workflow functional
   - [ ] Dark mode toggle works
   - [ ] Data persists after refresh

## Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, requests
- **Deployments**: History and rollback

## What's Deployed

**Backend API:**
- `/api/auth` - Authentication
- `/api/submissions` - Submissions & messages
- `/api/annotations` - Selections, comments, ratings, tags
- `/api/research` - Topics
- `/api/ontologies` - Tag taxonomies
- `/api/rankings` - Rating systems
- `/api/models` - AI model registry

**Frontend:**
- Single-page Vue app
- Dark/light theme
- Responsive (mobile + desktop)
- All annotation features

## Cost Estimate

**Hobby Tier ($5/month):**
- 500 hrs compute (plenty for research platform)
- 512 MB RAM
- 1 GB volume

**Expected: $5-10/month** for early feedback phase

## Troubleshooting

**Build fails?**
- Check Node version (needs 20+)
- Check all dependencies installed
- Review build logs in Railway

**Database resets?**
- Verify volume mounted at `/app/data`
- Check volume is attached to service

**Frontend 404s?**
- Ensure `NODE_ENV=production` is set
- Check frontend built successfully
- Verify static serving middleware active

**CORS errors?**
- Frontend served from same origin as API
- Should not have CORS issues (same domain)

## Feedback Collection

Once deployed, share URL with:
- Research collaborators
- Model researchers
- Annotation experts

Watch for:
- Performance issues
- UI/UX confusion
- Feature requests
- Edge cases/bugs

## Next Steps After Feedback

Potential improvements based on usage:
- PostgreSQL migration (for scale)
- Full-text search
- Export/import features
- Advanced filtering
- Batch operations
- Analytics dashboard

---

**Ready to deploy? The platform is solid!** 🚀

