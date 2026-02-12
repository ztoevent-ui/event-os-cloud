# Eventos.com: Multi-Event Management SaaS (Pivot)

This platform, **Eventos.com**, is the central event management operating system for ZTO. It allows planning, team collaboration, and execution across multiple events simultaneously.

## 1. System Architecture: Multi-Project
Instead of an app dedicated to one event, this system supports multiple projects (Wedding Fairs, Company Dinners, Launches, etc.).
- **Core Entity**: `projects` (defines the "box" for all data).
- **Relationships**: ALL major operational tables (`tasks`, `timelines`, `vendors`, `budgets`) must have a `project_id` foreign key.

## 2. Database Schema (Supabase PostgreSQL)

### 2.1. Projects (The Core)
*Stores metadata for each event.*
- `id`: UUID (PK)
- `name`: Text (e.g., "Destined Bintulu Wedding Expo 2026")
- `type`: Enum (wedding_fair, corporate_dinner, launch, other)
- `status`: Enum (planning, active, paused, archived)
- `start_date`: Date
- `end_date`: Date
- `manager_id`: UUID (FK -> auth.users)
- `created_at`: Timestamptz

### 2.2. Tasks (Generic Task Board)
*Replaces dedicated `wf_tasks`.*
- `id`: UUID (PK)
- `project_id`: UUID (FK -> projects.id)
- `title`: Text
- `description`: Text
- `assignee_id`: UUID (FK -> auth.users)
- `status`: Enum (todo, in_progress, review, done)
- `priority`: Enum (low, medium, high, critical)
- `due_date`: Timestamptz
- `ai_suggestions`: JSONB (Gemini output storage)

### 2.3. Timelines (Phases & Milestones)
*Replaces `wf_phases`.*
- `id`: UUID (PK)
- `project_id`: UUID (FK -> projects.id)
- `name`: Text (e.g., "Phase 1: Vendor Outreach")
- `start_date`: Date
- `end_date`: Date
- `order_index`: Integer

### 2.4. Vendors (Partners & Suppliers)
*Replaces `wf_vendors`.*
- `id`: UUID (PK)
- `project_id`: UUID (FK -> projects.id)
- `name`: Text (e.g., "Grand Palace Hotel")
- `category`: Text (venue, catering, av, decor)
- `contact_person`: Text
- `email`: Text
- `status`: Enum (potential, contacted, confirmed, contracted)

### 2.5. Budgets (Financial Tracking)
*Replaces `wf_budgets`.*
- `id`: UUID (PK)
- `project_id`: UUID (FK -> projects.id)
- `item`: Text
- `amount`: Numeric
- `type`: Enum (expense, income)
- `category`: Text (marketing, venue, staff, etc.)
- `status`: Enum (planned, actual)

## 3. Seed Data Strategy
**Goal**: Initialize the DB with the "Destined Bintulu 2026" plan.

**Project 1**:
- **Name**: "Destined Bintulu Wedding Expo 2026"
- **Type**: `wedding_fair`
- **Status**: `planning`

**Tasks (Initial Set)**:
1.  "Define Expo Theme & Branding" (Phase 1)
2.  "Secure Venue Booking (Bintulu Civic Centre)" (Phase 1)
3.  "Draft Sponsor Packages" (Phase 1)
4.  "Launch Vendor Recruitment Campaign" (Phase 2)
5.  "Finalize Floor Plan" (Phase 2)

**Phases**:
1.  "Concept & Venue" (Months 1-2)
2.  "Vendor Sales" (Months 3-5)
3.  "Marketing Blitz" (Months 6-8)
4.  "Execution" (Month 9)

## 4. Workflows & Features
1.  **Dashboard (`/`)**:
    - List all active projects.
    - "Create New Project" button (wizard).
2.  **Project Dashboard (`/projects/[id]`)**:
    - Overview of specific project metrics.
    - Navigation to Tasks, Timeline, Budget.

## 5. Next Steps for Implementation
1.  **Apply Schema**: Run the updated SQL script in Supabase.
2.  **Refactor Frontend**:
    - Move `apps/wedding-fair-hub` -> `app/projects/[id]`.
    - Create `app/page.tsx` (Project List).
3.  **Update Config**: Ensure Next.js handles dynamic routing correctly.
