# Atoms 多人共创 Demo - 多用户协作重构

## Design
- Color palette: Each user gets a unique fixed color from the palette
  - Alice: #f97316 (orange)
  - Bob: #3b82f6 (blue)
  - Charlie: #22c55e (green)
  - Diana: #a855f7 (purple)
  - Eve: #ec4899 (pink)
  - Custom users: assigned from remaining colors
- Edit highlights: User modifications shown with left-border in their color
- Comments: Avatar + name colored per user

## Development Tasks
- [x] Rewrite auth.ts - Support demo accounts + custom email/password registration (localStorage)
- [x] Rewrite Login.tsx - Demo account grid + register/login form
- [x] Create projectStore.ts - Multi-project data model with shared localStorage storage
- [x] Create Projects.tsx - Project list page (my projects + invited projects + pending invitations)
- [x] Update Index.tsx - Load project-specific data, track edits per user with color
- [x] Update AppViewer.tsx - Show edit history with user colors on Markdown changes
- [x] Update routing (App.tsx or main.tsx) - Add /projects route
- [x] Update InvitePanel.tsx - Invite from demo accounts list, store invitation in shared storage