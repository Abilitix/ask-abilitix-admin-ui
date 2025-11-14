# PR3 – Citations Gate (Admin UI)

## Feature Goals
- Give reviewers a “modern” inbox mode gated by `ADMIN_INBOX_API` and `ENABLE_REVIEW_PROMOTE`, while keeping the legacy experience available when flags are off.
- Let authorized reviewers attach up to three citations per item, validate client-side, and surface backend validation errors inline.
- Allow reviewers to promote an inbox item to a verified QA pair and immediately see the resulting link.
- Provide clear disabled-state messaging when attach/promote is unavailable (already promoted, flag off, or insufficient role).

## Frontend Scope
1. **Inbox Shell**
   - `src/app/admin/inbox/page.tsx`: fetch tenant settings + user roles on the server and pass them to the client.
   - `src/components/inbox/InboxPageClient.tsx`: review-mode toggle (legacy vs. modern), feature-flag drawer, “Test Ask”, “no_source” quick-filter, local-storage mode overrides.

2. **Modern Inbox Client**
   - `src/components/inbox/ModernInboxClient.tsx`: filters, list/detail coordination, optimistic updates, telemetry (`ui.attach_source.*`, `ui.promote.*`), disabled-state logic.
   - `src/components/inbox/InboxDetailPanel.tsx`: detail header, citations editor, attach/promote buttons, promoted pill + “View QA Pair” link with telemetry, error handling (400/401/403/409), disabled messaging.
   - `src/components/inbox/CitationsEditor.tsx`: reusable editor enforcing ≤3 unique doc IDs, optional `page`, optional `span.start/end/text` (text ≤ 400 chars), per-row error states.

3. **Legacy Inbox (unchanged, but restored)**
   - `src/components/inbox/LegacyInboxPageClient.tsx`
   - `src/components/inbox/LegacyInboxList.tsx`
   - `src/components/inbox/LegacyInboxStatsCard.tsx`

## API / Server Scope
- `src/app/api/admin/inbox/route.ts`: list proxy supporting new filters.
- `src/app/api/admin/inbox/[id]/route.ts`: detail proxy.
- `src/app/api/admin/inbox/[id]/attach_source/route.ts` *(new)*: forwards `POST /admin/inbox/{id}/attach_source`.
- `src/app/api/admin/inbox/[id]/promote/route.ts` *(new)*: forwards `POST /admin/inbox/{id}/promote`.
- `src/app/api/admin/tenant-settings/route.ts`: GET/POST tenant feature flags for the drawer.
- `src/app/api/admin/test-ask/route.ts`: helper endpoint to trigger the runtime `/ask` teaser.
- `src/lib/server/adminSettings.ts` *(new)*: fetch + map tenant settings to `InitialInboxFlags`.

## Behavioural Requirements
- Tenant flags:
  - `ADMIN_INBOX_API=1`: enables modern list/detail.
  - `ENABLE_REVIEW_PROMOTE=1`: unlocks attach/promote actions.
  - `ALLOW_EMPTY_CITATIONS=1`: permits promotion without citations (UI copy indicates optionality).
- Client validation mirrors backend rules (unique doc IDs, ≤3 entries, optional span, ≤400 characters text).
- Promote removes the item from the list, shows a success toast, and exposes the returned `qa_pair_id` link.
- Telemetry fires on click/success/fail for both attach and promote actions.
- Read-only states explain why actions are disabled (already promoted, flag off, insufficient permissions).

## Smoke Test Checklist
1. Flags off → legacy inbox only.
2. Flags on, reviewer role → modern inbox, citations required (unless `ALLOW_EMPTY_CITATIONS=1`).
3. Attach 1–3 citations → 200 response, detail re-fetch shows persisted citations.
4. Promote → success toast, item disappears, promoted pill + link visible.
5. Promote again → 409 conflict surfaced; link still works.
6. Validation errors (duplicate doc IDs, >3 citations, span text >400) show inline messages.
7. Viewer role → modern inbox is read-only with explanatory copy/tooltips.


