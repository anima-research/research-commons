# 🚀 Deploy Research Commons to Railway NOW

## What's Ready

✅ **Complete Platform:**
- Submission browsing & annotation
- Collaborative tag voting (×N votes per tag)
- Comments with Markdown
- Submission-level ratings
- Research topics, ontologies, ranking systems
- AI model registry
- Multi-participant conversation support
- Full dark/light mode
- Mobile responsive

✅ **Technical:**
- Event-sourced stores (topics, ontologies, rankings, models)
- SQLite database with proper schema
- JWT authentication with roles
- File uploads
- Production build configuration

## Deploy in 5 Minutes

### Step 1: Generate JWT Secret

```bash
openssl rand -base64 32
```

Copy the output - you'll need it!

### Step 2: Railway Deployment

1. **Go to:** https://railway.app
2. **Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select:** `research-commons` repository
5. **Wait** ~2-3 minutes for first build

### Step 3: Add Environment Variable

Railway Dashboard → Variables tab:

```
JWT_SECRET=<paste-your-generated-secret>
NODE_ENV=production
```

### Step 4: Add Persistent Volume

Railway Dashboard → Settings → Volumes:
- **Mount Path:** `/app/data`
- **Size:** 1 GB

**⚠️ Critical:** Without this, all data resets on deploy!

### Step 5: Deploy

Railway auto-deploys. Watch logs for:
```
✅ Research Commons running on port 3020
📦 Serving frontend from /frontend/dist
```

Your URL: `https://research-commons-production-xxxx.up.railway.app`

## First Login

1. **Visit your Railway URL**
2. **Register** → Creates first user
3. **Manually add admin role:**

```bash
# In Railway shell or locally:
railway shell
npx tsx create-admin-user.ts
# Follow prompts
```

Or manually in SQLite:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('<your-user-id>', 'admin');
```

## What's Included Out of the Box

**Default Ontologies:**
- LLM Response Patterns (fawning, evasive, hedging, etc.)
- Interview Quality (leading questions, framing, etc.)

**Default Ranking Systems:**
- Interview Quality Assessment (3 criteria)
- Model Behavior Assessment (4 criteria)

**Default Models:**
- 🧬 Claude 3.5 Sonnet
- 🎭 Claude 3 Opus
- 🤖 GPT-4
- ⚡ GPT-4o

## Gather Feedback On

**Core Workflow:**
1. Upload conversation
2. Tag participants as models/humans
3. Browse submissions
4. Annotate with tags & comments
5. Rate submission quality
6. Collaborative voting on tags

**Questions for Users:**
- Is the annotation flow intuitive?
- Do tag votes make sense?
- Are rating criteria clear?
- Is mobile experience good?
- What features are missing?

## Cost

**Estimated: $5-10/month**
- Hobby plan: $5/month base
- Compute: minimal (research platform, not high traffic)
- Volume: $0.25/GB/month

## Next Iteration Ideas

Based on feedback, consider:
- Search & filtering
- Export annotations (CSV, JSON)
- Analytics dashboard
- Batch operations
- API for programmatic access
- Webhook notifications
- Email digests

---

**Ready to ship!** The platform is feature-complete for gathering valuable feedback. 🎉

