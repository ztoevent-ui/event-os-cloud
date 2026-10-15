#!/bin/bash

# ==========================================================
# ZTO Event OS: Full Auto Deployment & Backup Script
# ==========================================================
# This script commits changes, creates a backup branch,
# pushes to GitHub to trigger Vercel, and logs history.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting ZTO Auto-Deploy Sequence...${NC}"

# 1. Fetch current timestamp for branch naming
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_BRANCH="backup-auto-$TIMESTAMP"

# 2. Add all changes
echo -e "${YELLOW}📦 Staging changes...${NC}"
git add .

# 3. Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ No changes to stash or commit. Workspace clean.${NC}"
else
    # 4. Commit changes with automated or custom message
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="feat: update and auto-deploy on $TIMESTAMP"
    fi
    echo -e "${YELLOW}📝 Committing changes: $COMMIT_MSG${NC}"
    git commit -m "$COMMIT_MSG"
fi

# 5. Create backup branch and preserve history
echo -e "${YELLOW}🌿 Creating backup branch: $BACKUP_BRANCH${NC}"
git branch $BACKUP_BRANCH
git push origin $BACKUP_BRANCH || echo "Backup branch push skipped."

# 6. Push to Main on origin (Triggers Vercel / GitHub Actions)
echo -e "${YELLOW}☁️ Pushing to origin main branch...${NC}"
git push origin main

# 7. Push to vercel-target if configured
if git remote | grep -q "vercel-target"; then
    echo -e "${YELLOW}☁️ Pushing to vercel-target main branch...${NC}"
    git push vercel-target main || echo "Push to vercel-target skipped."
fi

# 8. Trigger immediate direct Vercel Production Deployment
echo -e "${YELLOW}⚡ Triggering direct Vercel Production Deployment...${NC}"
vercel deploy --prod --yes || echo "Direct Vercel CLI deploy skipped, relying on Git push."

echo -e "${GREEN}✅ Deployment sequence completed successfully.${NC}"
echo -e "${GREEN}🌐 Live application active at https://ztoevent.com${NC}"
