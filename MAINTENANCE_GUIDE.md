# Event-OS Cloud Maintenance Guide

This guide explains how to continue working on this project from a new computer, ensuring you have access to the latest code and configuration.

## 1. Prerequisites (New Computer)

Before you begin, ensure you have the following installed on your new machine:
- **Node.js**: [Download LTS](https://nodejs.org/) (Version 18+ recommended)
- **Git**: [Download Git](https://git-scm.com/)
- **Visual Studio Code**: [Download VS Code](https://code.visualstudio.com/)

## 2. Cloning the Repository

To get the latest code from GitHub:

1. Open a terminal (Command Prompt or PowerShell).
2. Navigate to where you want to store the project (e.g., `cd Documents`).
3. Run the following command:
   ```bash
   git clone https://github.com/ztoevent-ui/event-os-cloud.git
   ```
4. Enter the directory:
   ```bash
   cd event-os-cloud
   ```

## 3. Installation

Install the project dependencies:
```bash
npm install
```

## 4. Environment Configuration (.env)

**Important**: Security keys (like Supabase API keys) are NOT stored in GitHub for safety. You must create a `.env.local` file manually on your new computer.

1. Create a file named `.env.local` in the root folder.
2. Add your Supabase keys (you can find these in your Supabase Project Settings -> API):

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

## 5. Running the App

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Deployment

To deploy updates to `ztoevent.com`, you can use the included script:
```bash
# Windows
.\deploy_zto_arena.bat

# Or manually via Vercel CLI
npx vercel --prod
```

## 7. Syncing Changes

When you are done working:
1. Save your changes: `git add .`
2. Commit: `git commit -m "Description of changes"`
3. Push to GitHub: `git push origin main`

When you return to this computer or another one, always pull first:
```bash
git pull origin main
```
