# Deployment Guide - Railway

## Quick Deploy

### 1. Prepare Repository
```bash
# Ensure everything is committed
git add .
git commit -m "Prepare for Railway deployment"
git push
```

### 2. Railway Setup

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `research-commons` repository
4. Railway will auto-detect the Node.js app

### 3. Configure Environment Variables

In Railway dashboard, add these variables:

**Required:**
```
PORT=3020
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-32>
```

**Optional (with defaults):**
```
DATABASE_PATH=/app/data/research.db
SUBMISSIONS_PATH=/app/data/submissions
DATA_PATH=/app/data
```

### 4. Add Persistent Volume

Railway → Settings → Volumes:
- **Mount Path:** `/app/data`
- **Size:** 1GB (or more based on usage)

This ensures your database and submissions persist across deployments.

### 5. Deploy

Railway will automatically:
1. Build backend (TypeScript → JavaScript)
2. Build frontend (Vue → static files)
3. Run initialization (create default ontologies, rankings, models)
4. Start the server

## Frontend Configuration

The frontend needs to know the backend URL:

**Option A: Serve frontend from backend** (Recommended)

Add to `src/index.ts`:
```typescript
// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('frontend/dist'))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}
```

**Option B: Separate deployments**

Deploy frontend separately and set:
```
VITE_API_URL=https://your-backend.railway.app
```

## Post-Deployment

### Create Admin User

```bash
# SSH into Railway container or use Railway CLI
railway run npx tsx create-admin-user.ts
```

### Verify Setup

1. Visit your Railway URL
2. Register/login
3. Check `/models`, `/ontologies`, `/rankings` have defaults
4. Upload a test conversation
5. Test annotation workflow

## Monitoring

Railway provides:
- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, network usage
- **Deployments** - History and rollback

## Troubleshooting

**Issue: Database resets on deploy**
→ Ensure volume is mounted at `/app/data`

**Issue: CORS errors**
→ Check FRONTEND_URL env var matches your domain

**Issue: Build fails**
→ Check Node.js version (needs 20+)
→ Check all dependencies in package.json

## Cost Estimate

Railway pricing:
- **Hobby Plan:** $5/month
- **Compute:** ~$0.01/hour per GB RAM
- **Volume:** $0.25/GB/month

Expected: **~$10-15/month** for research platform with light usage

## Scaling Considerations

When you get more traffic:
- Enable **horizontal scaling** (multiple instances)
- Use **PostgreSQL** instead of SQLite
- Add **Redis** for session management
- Consider **CDN** for frontend assets

