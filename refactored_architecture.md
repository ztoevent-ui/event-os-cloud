# Refactored Architecture: Eventos.com v2.0

## 1. Core Structure & Routing

The application is restructured into three primary zones to separate Public access, Public Displays, and Admin controls.

### **Zone A: Public (`/public/*`)**
*   **Access Control**: No authentication required.
*   **Purpose**: User-facing interfaces for guests and clients.
*   **Modules**:
    *   `/public/ticket-sales`: Event ticket purchase. Supports guest checkout (creates `guest_record`).
    *   `/public/consulting`: Lead capture form. Supports referral tracking via `?sale_id=xxx`.

### **Zone B: Display (`/display/*`)**
*   **Access Control**: No authentication required. Read-Only. No interactive controls.
*   **Purpose**: Big screens, projectors, and client viewing links.
*   **Modules**:
    *   `/display/lucky-draw`: Visualization layer only. Subscribes to admin state via WebSocket. Use for main stage screen.
    *   `/display/layout/[id]`: 3D Event Layout Viewer. View-only mode for clients.

### **Zone C: Admin (`/admin/*`)**
*   **Access Control**: **Strict Authentication Required** (Role: Staff/Admin).
*   **Purpose**: Operational control and management.
*   **Modules**:
    *   `/admin/dashboard`: Main command center.
    *   `/admin/events`: Event creation and management (Project Dashboard).
    *   `/admin/tools/lucky-draw`: **Control Panel**. Start/Stop logic, winner selection.
    *   `/admin/tools/layout-editor`: Edit 3D layouts and generate sharing links.
    *   `/admin/check-in`: On-site guest verification and badge printing.

---

## 2. Updated Database Schema

Key changes to support the new architecture:

### **New Tables**
*   `guest_records`: Stores walk-in/ticket guests.
    *   `id` (UUID), `event_id`, `email`, `name`, `ticket_type`, `status` (paid/pending), `check_in_status` (boolean).
*   `access_logs`: Track public/display usage stats.

### **Modifications**
*   `tasks`: Add `access_level` ('admin_only', 'staff', 'public').
*   `registrations`: Add `access_level` and `source` columns.

### **Realtime State Management**
*   `tool_states`: A table to store the current state of live tools (e.g., Lucky Draw).
    *   `tool_id`: 'lucky_draw_main'
    *   `state`: JSONB `{ "is_spinning": false, "current_winner": null, "candidates": [...] }`
    *   *Display layer subscribes to changes on this table.*

---

## 3. Middleware Security Rules

*   **Rule 1**: `/admin/*` requires a valid Supabase Session. Redirect to `/auth` if missing.
*   **Rule 2**: `/display/*` and `/public/*` are open.
*   **Rule 3**: API routes (`/api/admin/*`) must verify admin role.

---

## 4. Implementation Steps

1.  **Refactor Middleware**: Update `middleware.ts` to enforce Zone C security.
2.  **Database Migration**: Apply new schema SQL.
3.  **Frontend Restructure**:
    *   Move `app/apps/lucky-draw` logic -> Split into `app/admin/tools/lucky-draw` and `app/display/lucky-draw`.
    *   Create `app/public` landing pages.
4.  **Dashboard Update**: Redesign `app/page.tsx` to link to new zones.
