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
    # 4. Commit changes with automated message
    COMMIT_MSG="Auto-deploy backup generated on $TIMESTAMP"
    echo -e "${YELLOW}📝 Committing changes...${NC}"
    git commit -m "$COMMIT_MSG"
fi

# 5. Create backup branch and merge changes (ensure we preserve the history)
echo -e "${YELLOW}🌿 Creating backup branch: $BACKUP_BRANCH${NC}"
git branch $BACKUP_BRANCH
git push origin $BACKUP_BRANCH

# 6. Push to Main (Triggers Vercel)
echo -e "${YELLOW}☁️ Pushing to remote main branch...${NC}"
git push origin main

echo -e "${GREEN}✅ Deployment sequence completed successfully.${NC}"
echo -e "${GREEN}🌐 Vercel will now automatically build and deploy the application.${NC}"
