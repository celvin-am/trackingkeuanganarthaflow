# PRD — ArthaFlow Mobile Web Experience + Camera Receipt Scan

## 1. Product Summary
ArthaFlow saat ini sudah stabil dan usable di desktop, tetapi pengalaman di mobile masih terasa seperti versi desktop yang diperkecil. Tujuan pengembangan berikutnya adalah meningkatkan ArthaFlow menjadi **mobile-friendly web app with app-like experience**, sekaligus menambahkan fitur **scan struk langsung dari kamera**.

Pengembangan ini **tidak bertujuan untuk rebuild total**, melainkan melakukan **incremental responsive refactor** dari codebase yang sudah ada, dengan tetap menjaga kualitas versi desktop yang sekarang sudah baik.

---

## 2. Product Goals

### Primary Goals
- Membuat ArthaFlow nyaman digunakan di HP
- Menghadirkan mobile shell yang terasa seperti aplikasi modern
- Menambahkan fitur scan struk langsung dari kamera browser
- Menjaga desktop experience tetap aman dan tidak rusak

### Secondary Goals
- Meningkatkan kecepatan input transaksi dari struk
- Menyederhanakan navigasi utama di mobile
- Membuat semua halaman utama usable dan nyaman di layar kecil

---

## 3. Background Problem
Versi desktop ArthaFlow sudah cukup stabil, namun di mobile masih ada beberapa masalah utama:

- Sidebar desktop masih terasa tidak cocok untuk layar kecil
- Layout beberapa halaman masih desktop-oriented
- Navigasi belum optimal untuk penggunaan satu tangan
- Beberapa page belum nyaman dibaca di HP
- Flow scan masih lebih dekat ke upload file biasa, belum mobile-first
- Input di iPhone/Safari bisa menyebabkan auto-zoom saat fokus
- App belum terasa seperti mobile finance app modern

---

## 4. Product Direction
Arah produk yang disepakati:

### Chosen Direction
**App-like mobile web experience**, bukan sekadar responsive shrink.

### Meaning
- Desktop tetap dipertahankan
- Mobile mendapatkan shell dan UX yang lebih sesuai
- Satu codebase tetap digunakan
- Perbedaan utama ada pada layout, navigation, dan presentation layer

---

## 5. Core Product Decisions

### Decision 1 — Mobile Navigation Pattern
**Chosen:** Top bar + bottom navigation

**Reasoning:**
- lebih modern
- lebih praktis untuk satu tangan
- cocok untuk app keuangan
- lebih natural di mobile daripada sidebar desktop

---

### Decision 2 — Desktop Preservation
**Chosen:** Desktop layout tetap dipertahankan semaksimal mungkin

**Reasoning:**
- desktop saat ini sudah bagus
- risiko regressions bisa ditekan
- perubahan fokus di mobile layer

---

### Decision 3 — Architecture Strategy
**Chosen:** Single app, dual shell behavior

**Desktop**
- sidebar tetap digunakan

**Mobile**
- top bar
- bottom nav
- mobile-friendly page layout

**Reasoning:**
- lebih maintainable daripada membuat dua aplikasi terpisah
- logic bisnis tidak perlu dipecah
- perubahan lebih fokus pada UI shell dan page presentation

---

### Decision 4 — Camera Scan Approach
**Chosen:** Web camera capture using browser API

**Reasoning:**
- realistis untuk web app
- bisa reuse backend scan endpoint yang sudah ada
- lebih cepat diimplementasikan daripada native app path

---

## 6. Bottom Navigation Decision

### Final Bottom Nav Items
- Dashboard
- Transactions
- Wallets
- Budgets
- Scan

### Settings Access
Settings tidak dimasukkan ke bottom nav, tetapi tetap mudah diakses melalui:
- avatar/profile shortcut di top bar
- profile/settings entry point yang visible di mobile

### Reasoning
Halaman yang masuk bottom nav diprioritaskan untuk aktivitas finansial harian:
- melihat ringkasan
- mencatat transaksi
- melihat dompet
- memantau budget
- scan struk

Settings tetap penting, tapi bukan halaman yang dibuka sesering halaman operasional inti.

---

## 7. Scope

## In Scope

### Mobile Shell
- Mobile top bar
- Mobile bottom navigation
- Safe area support
- Desktop sidebar hidden on mobile
- Mobile wrapper / container spacing
- Mobile app-like navigation behavior

### Mobile Page Usability
Semua halaman utama harus usable dan nyaman di HP:
- Dashboard
- Transactions
- Wallets
- Budgets
- Scan
- Settings

### Camera Receipt Scan
- Open camera
- Camera preview
- Capture receipt photo
- Preview captured image
- Analyze receipt
- Show extracted fields
- Edit extracted fields
- Save as transaction
- Retake flow

---

## Out of Scope (Initial Phases)
- Native mobile app
- Offline-first support
- Push notifications
- Multi-photo batch scanning
- Advanced receipt image enhancement
- Full desktop redesign
- Major rewrite of backend business logic

---

## 8. Target Users

### Primary Users
Users who frequently record transactions and monitor daily finances from their phone.

### Secondary Users
Users who want faster receipt entry via direct camera scanning.

---

## 9. UX Principles

### Principle 1 — Thumb Friendly
Core actions must be easy to reach with one hand.

### Principle 2 — App-like Simplicity
Mobile should feel focused, clean, and efficient.

### Principle 3 — Action-First Design
Each page should clearly expose its main action and core information.

### Principle 4 — Readability on Small Screens
No horizontal scrolling, no overly dense layouts, no desktop table-first UI.

### Principle 5 — Desktop Safety
Desktop must remain visually stable and usable throughout the refactor.

---

## 10. Functional Requirements

## 10.1 Mobile Shell

### Requirements
- Desktop sidebar must not appear on small screens
- Mobile top bar must appear on mobile pages
- Mobile bottom nav must appear on mobile pages
- Active nav state must be visible
- Layout must respect bottom safe area
- Layout must not collide with browser bottom bar or OS UI

### Success Indicators
- no horizontal scroll
- no overlapping nav/content
- page title visible
- bottom nav easy to use

---

## 10.2 Dashboard Mobile

### Requirements
- Summary cards stack vertically on mobile
- Charts remain visible and stable
- Layout remains readable without zoom
- Content hierarchy simplified for small screens

### Expectations
- no broken chart containers
- no cramped 2-column dashboard layout on narrow screens
- quick insights remain visible

---

## 10.3 Transactions Mobile

### Requirements
- Transactions should not rely on desktop table layout in mobile
- Mobile layout should use readable cards or list items
- Search/filter remain usable
- Add transaction action remains easy to access

### Expectations
Each transaction item should clearly show:
- date
- description
- category
- wallet
- amount
- type

---

## 10.4 Wallets Mobile

### Requirements
- Wallet cards must display cleanly on mobile
- Balance and key wallet info should remain readable
- No clipping or overflow

---

## 10.5 Budgets Mobile

### Requirements
- Budget progress cards must be readable and compact
- Progress, spent value, and total budget must be clearly visible
- Filters must remain usable on mobile

---

## 10.6 Scan Mobile

### Requirements
- Scan page must be designed for mobile-first use
- User can choose:
  - Camera
  - Upload from Gallery
- Scan flow must be clear and linear

### Expected Flow
1. Open Scan page
2. Choose Camera or Gallery
3. Capture / upload receipt
4. Preview image
5. Analyze
6. Review extracted data
7. Edit if needed
8. Save transaction

---

## 10.7 Settings Mobile

### Requirements
- Settings sections must stack vertically
- Profile area must remain readable and usable
- Currency/date/profile/export sections remain accessible
- Avatar upload must remain usable
- Danger zone must remain clear and safe

---

## 11. Camera Scan Feature Requirements

### Functional Requirements
- User can open device camera from browser
- Camera preview must be shown before capture
- User can capture image
- Captured image must be previewed
- User can retake image
- User can analyze receipt
- Existing `/api/scan` backend endpoint should be reused
- Extracted fields must be editable before saving
- User can save analyzed result as a transaction

### Error Handling Requirements
System must handle:
- permission denied
- camera unavailable
- capture failure
- upload failure
- AI scan failure
- empty extraction result

### UX Requirements
- analyzing state must be visible
- preview and retake should be easy
- editing result should be simple and focused

---

## 12. Non-Functional Requirements

### Performance
- Mobile shell should feel lightweight
- Charts should render safely without layout errors
- Camera preview should be responsive enough for common phones

### Maintainability
- Responsive changes should reuse as much existing code as possible
- New components should be isolated and reusable where appropriate

### Safety
- Desktop UI should not regress
- Mobile changes should be introduced incrementally

---

## 13. Technical Strategy

## Existing System to Reuse
The following existing systems should remain and be reused:
- authentication flow
- settings system
- `/api/scan` backend logic
- transaction creation flow
- dashboard data fetching
- categories and wallets references
- existing desktop routes/pages

---

## New Components Likely Needed

### Recommended New Components
- `MobileTopBar`
- `MobileBottomNav`
- `MobileAppShell`
- `TransactionMobileCard`
- `CameraCapture`
- `ScanPreviewCard`
- `ScanResultForm`

### Existing Components/Pages Likely to be Refactored
- main app shell / authenticated layout
- sidebar
- dashboard page
- transactions page
- wallets page
- budgets page
- scan page
- settings page

---

## 14. Git / Delivery Strategy

### Branch Strategy
All work must happen in a dedicated feature branch:
`feat/mobile-responsive`

### Reason
- protects current stable `main`
- allows iterative testing
- enables rollback without affecting production

### Commit Strategy
Use small, thematic commits such as:
- `fix(mobile): prevent safari zoom on inputs`
- `feat(mobile): add top bar and bottom navigation`
- `feat(mobile): convert transactions to mobile card layout`
- `feat(scan): add browser camera capture flow`

---

## 15. Delivery Plan (Phased Implementation)

# Phase 1 — Mobile Foundation
### Goals
- Fix iPhone input zoom
- Establish mobile spacing baseline
- Hide desktop sidebar on mobile
- Add mobile top bar
- Add mobile bottom nav
- Add safe area bottom spacing
- Review/remove FAB collision on mobile

### Deliverables
- Mobile shell exists
- Navigation structure is usable on phone
- Desktop remains safe

### Definition of Done
- input does not auto-zoom on iPhone
- no desktop sidebar on mobile
- top bar visible on mobile
- bottom nav visible on mobile
- no horizontal scroll
- content is not blocked by bottom nav
- desktop still looks normal

---

# Phase 2 — Core Mobile Usability
### Goals
Make all main pages usable and pleasant on HP.

### Page Order
1. Dashboard
2. Transactions
3. Wallets
4. Budgets
5. Scan
6. Settings

### Deliverables
- Dashboard readable on HP
- Transactions become mobile-friendly list/cards
- Wallets and budgets no longer look desktop-shrunk
- Settings stacked cleanly
- Scan page usable on small screens

---

# Phase 3 — Camera Scan MVP
### Goals
Deliver direct camera capture for receipts.

### Deliverables
- open camera
- camera preview
- capture image
- preview captured image
- analyze via existing scan endpoint
- editable result form
- save transaction
- retake flow

### Definition of Done
User can complete full receipt scan flow from camera to saved transaction.

---

# Phase 4 — Polish
### Goals
Improve visual consistency and overall product feel.

### Deliverables
- smoother loading states
- cleaner card hierarchy
- stronger app-like visual feel
- better transitions and spacing
- refined scan UX

---

## 16. Risks and Mitigations

### Risk 1 — Desktop regressions
**Mitigation**
- work only in feature branch
- small commits
- validate desktop after every major step

### Risk 2 — Camera inconsistencies across browsers
**Mitigation**
- start with MVP
- test on iPhone Safari and Android Chrome
- keep upload-from-gallery fallback

### Risk 3 — Responsive refactor becomes too large
**Mitigation**
- follow phased rollout
- do not refactor all pages at once
- ship foundation first

### Risk 4 — AI-generated code becomes messy
**Mitigation**
- use Codex/AI only for scoped implementation tasks
- keep architecture and review manual
- do not allow full autopilot changes across many files at once

---

## 17. Success Metrics

### Mobile Shell Success
- no sidebar leakage on mobile
- no horizontal overflow
- easy primary navigation
- layout feels intentional on phone

### Page Usability Success
- all core pages usable without zooming
- mobile interactions feel simpler and cleaner
- financial info remains readable

### Scan Success
- camera capture works
- scan analysis works
- result can be edited
- transaction can be saved successfully

### Overall Product Success
ArthaFlow on mobile feels like a purposeful app experience rather than a desktop website reduced to a smaller screen.

---

## 18. Recommendation for Codex Usage

### Recommended Approach
**Hybrid workflow**
- planning and architecture decisions: manual
- scoped implementation tasks: Codex-assisted
- review and testing: manual

### Good Tasks for Codex
- generate `MobileBottomNav`
- refactor shell visibility by breakpoint
- create reusable mobile cards
- build browser camera capture component
- wire capture to existing scan flow

### Tasks Not Recommended for Full Autopilot
- large multi-file UI refactor without review
- product/navigation decisions
- merging responsive redesign into all pages at once

---

## 19. Final Product Decision
This initiative will proceed as:

- **mobile-first app-like enhancement**
- **top bar + bottom nav**
- **all primary pages remain usable on mobile**
- **settings accessed via profile/top bar**
- **camera-based receipt scan built on existing backend flow**
- **incremental implementation through phases**
- **desktop preserved**
- **hybrid manual + Codex workflow**