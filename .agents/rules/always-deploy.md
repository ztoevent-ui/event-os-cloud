# Mandatory Production Auto-Deployment Rule

**Requirement**: Every time changes are completed for a task, they MUST be built and deployed to the production website (`https://ztoevent.com`).

## Deployment Workflow:
1. Verify build locally: `npm run build`
2. Run deployment script:
   ```bash
   ./scripts/deploy.sh "descriptive commit message"
   ```
3. The script automatically:
   - Stages and commits all modifications
   - Generates and pushes an automated timestamped backup branch to `origin`
   - Pushes to `origin main` (https://github.com/ztoevent-ui/Event-OS.git)
   - Pushes to `vercel-target main` (https://github.com/ztoevent-ui/event-os-cloud.git)
   - Triggers production build on Vercel
4. Verify Vercel deployment completes successfully (`status: Ready`) and check live URL `https://ztoevent.com/`.
