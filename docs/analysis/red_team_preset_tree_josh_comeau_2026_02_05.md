# REDTEAM: Preset Folder Tree — Josh Comeau Quality Audit

**Scope**: Full red-team of the implemented preset system (server + client UI) against a Josh Comeau quality bar: polished micro-interactions, keyboard accessibility, spring animations, delightful details, zero layout jank, graceful error states.

**Current state**: 54 test files, 563 tests, all green. Backend fully implemented. Tree UI functional but sparse.

---

## CRITICAL: Security / Data Integrity

### RT-1: `HydraFolders.remove()` does NOT cascade-delete presets
**File**: `server/HydraPresets/HydraFolders.ts:75-77`

```typescript
static async remove (folderId: number): Promise<void> {
  await db.run('DELETE FROM hydraFolders WHERE folderId = ?', [folderId])
}
```

Deleting a folder leaves orphaned presets with a dangling `folderId` FK. The schema has `REFERENCES hydraFolders(folderId)` but SQLite doesn't enforce FK constraints unless `PRAGMA foreign_keys = ON` is set per-connection. Even if enabled, the default behavior is RESTRICT (fail), not CASCADE.

**Fix**: Either:
- Add `DELETE FROM hydraPresets WHERE folderId = ?` before the folder delete, OR
- Add `ON DELETE CASCADE` to the schema's FK definition

### RT-2: `HydraPresets.update()` builds raw SQL strings
**File**: `server/HydraPresets/HydraPresets.ts:67-98`

```typescript
fields.push('name = ?')
// ...
await db.run(`UPDATE hydraPresets SET ${fields.join(', ')} WHERE presetId = ?`, params)
```

This bypasses `sqlate` (the project's mandatory SQL injection prevention). The field names are hardcoded so there's no actual injection vector, but it violates the `CLAUDE.md` safety invariant: **"Always use SQLate for SQL to prevent injection."** Same issue in `HydraFolders.update()`.

**Fix**: Rewrite using `sqlate` template tags.

### RT-3: Guest auth bypass — `requireUser` doesn't check `isGuest`
**File**: `server/HydraPresets/router.ts:11-13`

```typescript
function requireUser (ctx) {
  if (!ctx.user?.userId) ctx.throw(401)
}
```

The plan says "non-guest" for POST/PUT/DELETE, but `requireUser` only checks for authentication, not guest status. A guest user can create folders, create presets, and (if they somehow get `authorUserId` match) edit/delete them.

**Fix**: Add `if (ctx.user.isGuest) ctx.throw(403, 'Guests cannot manage presets')` in POST/PUT/DELETE handlers, or make `requireUser` accept an options param.

### RT-4: No code size limit
**File**: `server/HydraPresets/router.ts:100-103`

```typescript
const code = typeof body.code === 'string' ? body.code : ''
if (!code.trim()) ctx.throw(400, 'Invalid code')
```

No upper bound on code length. A malicious user could POST 50MB of code per preset, filling the SQLite DB. The plan specified 50KB max.

**Fix**: Add `if (code.length > 50000) ctx.throw(400, 'Code too large')`.

### RT-5: No folder/preset count limit per user
No rate limiting or count cap. A user could create thousands of folders or presets.

**Fix**: Add a reasonable cap (e.g., 50 folders, 200 presets per user) checked in the POST handlers.

---

## HIGH: UX / Interaction Quality

### RT-6: No animations on tree expand/collapse
**File**: `PresetTree.tsx:60`

```tsx
{isOpen && (
  <div className={styles.children}>
```

Binary show/hide. At Josh Comeau quality, this needs:
- Height animation (CSS `grid-template-rows: 0fr -> 1fr` transition, or `max-height` with `overflow: hidden`)
- Disclosure arrow rotation (CSS `transform: rotate()` with transition)
- Staggered children fade-in for the first expand

**Fix**: Use CSS transitions on a wrapper div with `grid-template-rows` trick, animate disclosure arrow rotation.

### RT-7: No hover/focus states on preset rows
**File**: `PresetTree.css:79-86`

```css
.presetRow {
  /* no :hover or :focus-within */
}
```

Preset rows have no visual feedback on hover. Buttons appear always-visible. Josh Comeau style: rows highlight on hover with a subtle background shift, action buttons appear on hover/focus (hidden by default), and there's a focus-visible ring for keyboard nav.

**Fix**: Add `.presetRow:hover` background, hide `.actions` by default, show on `.presetRow:hover .actions` and `.presetRow:focus-within .actions`. Add `focus-visible` ring on the row itself (make it focusable with `tabIndex={0}`).

### RT-8: No keyboard navigation in the tree
**File**: `PresetTree.tsx`

No `tabIndex` on preset rows. No arrow-key navigation between items. No Enter-to-load. The folder header has `tabIndex={0}` and `onKeyDown` for Enter, but preset leaves are click-only.

**Fix**: Add `tabIndex={0}` to preset rows, add `onKeyDown` handler for Enter (load) and space (send). Implement roving tabIndex or arrow-key navigation between siblings.

### RT-9: `window.confirm()` for delete — jarring, platform-inconsistent
**File**: `PresetBrowser.tsx:143, 150`

```typescript
if (!window.confirm(`Delete preset "${preset.name}"?`)) return
```

Native `confirm()` dialog is ugly, blocks the thread, and can't be styled. Josh Comeau would use an inline confirmation: click "Delete" -> button transforms to "Sure? [Yes] [No]" with a red slide-in animation.

**Fix**: Replace `window.confirm` with an inline confirmation state on the row, or a custom modal with animation.

### RT-10: No loading skeleton / optimistic UI
**File**: `PresetBrowser.tsx:210`

```tsx
{loading && <div className={styles.loading}>Loading presets...</div>}
```

Plain text "Loading presets..." is not Josh Comeau quality. Needs:
- Skeleton placeholders (pulsing grey bars mimicking folder/preset rows)
- Optimistic updates for create/delete (update local state immediately, roll back on error)

### RT-11: No empty state illustration
**File**: `PresetTree.tsx:63`

```tsx
<div className={styles.empty}>No presets</div>
```

Plain text "No presets". At Comeau quality, this needs a gentle illustration or icon, a CTA ("Save your first preset"), and a description of what presets are for.

### RT-12: Save Preset modal has no code preview
**File**: `PresetBrowser.tsx:78-110`

User clicks "Save Preset" but can't see what code they're saving. The `draftCode` is set but never displayed.

**Fix**: Add a read-only code preview (syntax-highlighted, scrollable, max-height) in the save modal between the name input and folder select.

### RT-13: No toast/snackbar feedback after create/delete
**Files**: `PresetBrowser.tsx:169-189`

After creating a folder or saving a preset, the modal closes and the tree refreshes silently. User gets no confirmation that it worked.

**Fix**: Add a toast notification: "Folder created", "Preset saved", "Preset deleted". Brief, auto-dismiss, positioned bottom-right or bottom-center.

### RT-14: Gallery node shows 58 items unvirtualized
**File**: `presetTree.ts:56-65`

All 58 gallery presets are rendered as DOM nodes. Not a performance issue yet, but with user presets it could grow. More importantly, 58 items in a single expanded folder creates a very long scroll.

**Fix for UX**: Add a search filter that works within the gallery folder (already exists at PresetBrowser level, but could be more prominent). Consider virtualization if total items > 200.

### RT-15: Folder header "Delete" button is visually aggressive
**File**: `PresetTree.tsx:46-57` + `PresetTree.css:54-63`

The red "Delete" button is always visible in the folder header. It visually competes with the folder name and creates anxiety.

**Fix**: Hide by default, show on hover/focus. Use an icon (trash) instead of text. Add a tooltip.

### RT-16: No drag-to-reorder for folders or presets
The `sortOrder` field exists in the DB but there's no UI to change it. Users can't rearrange folders or presets.

**Fix**: Not a blocker but worth noting. Could add drag handles later, or up/down arrows.

---

## MEDIUM: Layout / Visual Polish

### RT-17: Badge inconsistency — "Gallery" badge but no "User" badge
**File**: `PresetTree.tsx:45`

Gallery folders show a teal "Gallery" badge. User folders show nothing — no author name, no creation date, no visual distinction.

**Fix**: Show a subtle author name badge on user folders (e.g., "by Steph" in muted text after the folder name).

### RT-18: Clone button only on gallery presets — non-obvious
**File**: `PresetTree.tsx:84-92`

"Clone" only appears on gallery items. Users might not understand they can clone a gallery preset to edit it. The flow is: find gallery preset -> Clone -> edit in modal -> Save.

**Fix**: Rename "Clone" to "Save as..." to better communicate intent. Show it on user presets too (for forking).

### RT-19: Mobile not addressed
The tree component has no responsive styles. On mobile (< 980px), the preset browser is accessed via the "Presets" mobile tab which opens as a full-screen overlay. The tree's horizontal space is very limited.

**Fix**: On mobile, collapse action buttons into a long-press context menu or a swipe-to-reveal pattern. Reduce padding. Consider a flat list view instead of tree on very narrow viewports.

### RT-20: No transition on folder border-top separator
**File**: `PresetTree.css:65-66`

```css
.children {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
```

When expanding, the border appears instantly. Should fade in with the content.

### RT-21: Selected preset has no visual indicator
Clicking "Load" loads code into the editor but the tree shows no selection state. User can't tell which preset is currently active.

**Fix**: Track `selectedPresetId` state, highlight the active row with a left border accent or background tint.

### RT-22: PresetBrowser toolbar buttons have no icons
**File**: `PresetBrowser.tsx:194-199`

"New Folder" and "Save Preset" are text-only buttons. Josh Comeau would add a subtle icon (folder-plus, save) before the text, with a spring hover animation.

### RT-23: Search input has no clear button
**File**: `PresetBrowser.tsx:202-208`

No "x" to clear the search. Users must manually select-all and delete.

---

## LOW: Code Quality

### RT-24: `presetTree.ts` calls `decodeSketch` for every render
**File**: `presetTree.ts:57`

```typescript
children: gallery.map((item) => {
  const code = decodeSketch(item)
```

`buildPresetTree` is called in `useMemo` with `[folders, presets]` deps — so gallery decoding happens on every folder/preset change. Gallery is static and should be decoded once.

**Fix**: Memoize gallery children separately, or decode once at module level (like `hydraPresets.ts` already does with `PRESETS`).

### RT-25: Error handling is swallow-and-display
**File**: `PresetBrowser.tsx:51-53`

```typescript
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load presets')
}
```

Delete/create errors in `handleDeletePreset`, `handleCreateFolder`, `handleSavePreset` are not caught at all — they'll be unhandled promise rejections.

**Fix**: Wrap all async handlers in try/catch, display errors inline or via toast.

### RT-26: `presetDraft.ts` clone adds " copy" without deduplication
**File**: `presetDraft.ts:17`

```typescript
name: `${preset.name} copy`,
```

Cloning "My Preset copy" produces "My Preset copy copy". No dedup logic.

**Fix**: Strip trailing " copy" or " copy N" before appending, or append " (2)", " (3)" etc.

---

## FINDINGS SUMMARY

| ID | Severity | Category | Issue |
|----|----------|----------|-------|
| RT-1 | CRITICAL | Data | Folder delete orphans presets |
| RT-2 | CRITICAL | Safety | Update bypasses sqlate |
| RT-3 | CRITICAL | Auth | Guest can create presets |
| RT-4 | HIGH | Security | No code size limit |
| RT-5 | MEDIUM | Security | No count limit per user |
| RT-6 | HIGH | UX | No expand/collapse animation |
| RT-7 | HIGH | UX | No hover/focus states on rows |
| RT-8 | HIGH | UX | No keyboard navigation |
| RT-9 | HIGH | UX | window.confirm for delete |
| RT-10 | HIGH | UX | No loading skeleton |
| RT-11 | MEDIUM | UX | No empty state design |
| RT-12 | HIGH | UX | No code preview in save modal |
| RT-13 | MEDIUM | UX | No toast feedback |
| RT-14 | LOW | Perf | Gallery unvirtualized |
| RT-15 | MEDIUM | UX | Delete button too prominent |
| RT-16 | LOW | UX | No drag-to-reorder |
| RT-17 | MEDIUM | Visual | No author badge on user folders |
| RT-18 | MEDIUM | UX | Clone button naming |
| RT-19 | HIGH | UX | Mobile not addressed |
| RT-20 | LOW | Visual | No border transition |
| RT-21 | HIGH | UX | No selected preset indicator |
| RT-22 | LOW | Visual | No button icons |
| RT-23 | LOW | UX | No search clear button |
| RT-24 | LOW | Perf | Gallery decoded on every change |
| RT-25 | MEDIUM | Code | Uncaught async errors |
| RT-26 | LOW | UX | Clone naming dedup |

---

## RECOMMENDED FIX ORDER

### Must-fix before ship (Critical + High):
1. **RT-1**: Cascade delete presets with folder
2. **RT-2**: Rewrite updates with sqlate
3. **RT-3**: Block guest access in POST/PUT/DELETE
4. **RT-4**: Add code size limit (50KB)
5. **RT-6**: Expand/collapse animation
6. **RT-7**: Hover/focus states on rows (hide actions until hover)
7. **RT-8**: Keyboard navigation (tabIndex, Enter/Space, arrow keys)
8. **RT-9**: Replace window.confirm with inline confirmation
9. **RT-10**: Loading skeleton
10. **RT-12**: Code preview in save modal
11. **RT-19**: Mobile responsive tree
12. **RT-21**: Selected preset indicator
13. **RT-25**: Catch async errors

### Nice-to-have (Medium + Low):
14. RT-5: Count limits
15. RT-11: Empty state illustration
16. RT-13: Toast notifications
17. RT-15: Hide delete until hover
18. RT-17: Author badge
19. RT-18: Rename Clone to "Save as..."
20. RT-22-26: Polish items

---

## OPEN QUESTIONS

1. Should the gallery node start collapsed (58 items is a lot of scroll)?
2. Should user folders auto-expand when a preset is saved into them?
3. Do we need a "rename preset" flow, or is delete + re-save sufficient?
4. Should the "Save Preset" button appear in the CodeEditor footer too (near Send)?

