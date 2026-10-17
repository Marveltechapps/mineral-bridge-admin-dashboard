# Mineral Bridge Admin Console — API Contract

**Version:** 1.0 (draft for backend build) · **Date:** 16 Oct 2026
**Consumer:** Admin console (`mineral-bridge-admin` v4.2.0, React + TanStack Query)
**Endpoint index:** [API-ENDPOINTS.md](API-ENDPOINTS.md). The endpoint numbers (`#23`) used here match that list.

This contract is what the frontend relies on. Field names match the TypeScript
types in `src/types/*.ts` wherever they exist. Where the demo fixtures carry
pre-formatted strings (`"$5,940,000"`, `"86.4 kg"`, `"4 h 12 m"`), the API sends
structured values and the client formats them (see §10).

---

## Contents

1. [Conventions](#1-conventions)
2. [Authentication & session](#2-authentication--session)
3. [Shared schemas](#3-shared-schemas)
4. [Errors](#4-errors)
5. [Enumerations](#5-enumerations)
6. [Endpoints](#6-endpoints)
   A Auth · B Shell · C Overview · D Orders · E Vault · F Listings · G Pricing · H Auctions · I LC · J Collaboration · K Blockchain · L Users · M Compliance · N Disputes · O Academy · P Marketing · Q Partners · R Support · S Audit · T Financial · U Analytics · V Settings · W Profile
7. [Real-time](#7-real-time)
8. [Authorisation matrix](#8-authorisation-matrix)
9. [Open questions](#9-open-questions)
10. [Frontend integration notes](#10-frontend-integration-notes)

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base URL | `{VITE_API_BASE_URL}`, e.g. `https://api.mineralbridge.co.ke/admin/v1`. Every path in this document is relative to it. |
| Versioning | Major version in the path (`/admin/v1`). Additive changes (new fields, new enum values) are non-breaking, so clients must ignore unknown fields. |
| Transport | HTTPS only. `Content-Type: application/json; charset=utf-8` for requests and responses, except CSV exports (`text/csv`) and SSE (`text/event-stream`). |
| Casing | JSON keys are `camelCase`. Enum values are `snake_case`. |
| IDs | Opaque strings in the platform's human-readable format: `MB-SELL-41982`, `MB-BUY-38217`, `MBV-2026-0417` (lot), `MBL-2026-0112` (listing), `AUC-2026-0219`, `LC-2026-0418`, `NEG-2026-0233`, `CTR-2026-0188`, `MBP-2026-1284` (passport), `ANC-2026-0912`, `KYC-7741`, `DSP-2026-0071`, `TKT-5514`, `STL-2026-4412`. Entities with no ID in the demo data get one: `USR-…`, `RATE-…`, `OFR-…`, `CRS-…`, `LSN-…`, `BNR-…`, `PTN-…`, `TRQ-…`, `INT-…`, `STF-…`, `SES-…`, `NTF-…`, `FILE-…`. |
| Money | `Money` object, `{ "amount": 5940000, "currency": "USD" }`. `amount` is a decimal number in major units (up to 2 decimals). Never a formatted string. |
| Quantity | `Quantity` object, `{ "value": 86.4, "unit": "kg" }`. Units: `kg`, `t`, `g`, `oz`. |
| Rates | `UnitPrice`, `{ "amount": 63800, "currency": "USD", "per": "kg" }` |
| Dates | ISO 8601 UTC: `"2026-09-11T10:42:18Z"`. Date-only fields use `"2026-10-14"`. The client renders in East Africa Time (EAT, UTC+3). |
| Durations | ISO 8601 durations (`"PT4H12M"`) or an absolute `endsAt` timestamp. The client computes "time left". |
| Percentages | Numbers, e.g. `92.1` for 92.1 %. Trend values are signed (`-0.6`). |
| Pagination | `?page=1&pageSize=25` (1-based, `pageSize` ≤ 100). Response envelope: `Page<T>` (§3.1). |
| Sorting | `?sort=<field>&order=asc|desc`. Each list documents its sortable fields (they match the console's `SortHead` columns). |
| Search | `?q=<text>`. Case-insensitive match on the fields listed per endpoint. Mirrors the header search box. |
| Filtering | Named query params per endpoint. Each filter-chip value maps to one enum value. |
| Drafts | Every create endpoint called from a form drawer takes `"draft": true`, which persists the record with `status: "draft"` and skips side effects (no notifications, nothing published). This backs the drawer's **Save as draft** button. |
| Idempotency | Every `POST` that creates or changes state takes an `Idempotency-Key: <uuid>` header. A replay within 24 h returns the original response. Required on money-moving calls (#32, #52, #72, #106). |
| Concurrency | State transitions take an `expected…` precondition (e.g. `expectedStage`). A mismatch returns `409 conflict/stale-state` with the current state, so two desk users cannot advance the same order twice. Edit-gated forms send `If-Match: <etag>` from the `GET` response's `ETag`. |
| Audit | Every write is recorded in the audit log (#123) with actor, role, action, record, before and after values. Writes may carry an optional `reason` field; the drawer "note" fields map to it. |
| Rate limits | 600 req/min per session. Auth endpoints: 10 req/min per IP plus email. Over the limit → `429` with `Retry-After`. |
| Time zone header | Optional `X-Timezone: Africa/Nairobi` for period-bucketed endpoints (#126, #127, analytics). Default `Africa/Nairobi`. |

---

## 2. Authentication & session

- **Session cookie.** `POST /auth/otp/verify` sets `mb_admin_session`
  (`HttpOnly; Secure; SameSite=Strict; Path=/admin`). The console already sends
  `credentials: 'include'`. No bearer tokens live in the browser.
- **CSRF.** Mutating requests (`POST/PUT/PATCH/DELETE`) must send
  `X-CSRF-Token`, taken from the `csrfToken` field of #4 and #12 (double-submit).
  A missing or invalid token returns `403 auth/csrf`.
- **Two-step sign-in.** #1 (password) or #2 → #3 (SSO) return a short-lived
  `challengeId` (5 min). #4 completes it. 5 wrong codes → `423 auth/challenge-locked`.
- **Idle and lock.** Session idle timeout is 30 min, absolute lifetime 12 h.
  `POST /auth/lock` (#9) puts the session in the `locked` state: every call except
  #10, #11 and #12 returns `401 auth/console-locked`. The console then routes to
  `/locked`, keeping the page it came from.
- **Expiry.** `401 auth/session-expired` → the console routes to `/login`.
  `403 auth/forbidden` → "role not permitted" toast. The record is never shown.
- **Refresh.** #8 rotates the session cookie. The client calls it when `/me`'s
  `session.expiresAt` is under 5 min away and the user is active.

---

## 3. Shared schemas

TypeScript notation. `?` = optional; `| null` = nullable.

### 3.1 Envelopes

```ts
interface Page<T> {
  data: T[];
  meta: {
    page: number;          // 1-based
    pageSize: number;
    total: number;         // total matching the filters
    totalUnfiltered?: number; // e.g. "Showing 6 of 10 lots in custody"
    counts?: Record<string, number>; // chip counts, e.g. per stage
  };
}

interface StatCard { key: string; label: string; value: number | Money | string; unit?: string; sub?: string; trend?: { direction: 'up' | 'down'; text: string; tone: 'ok' | 'warn' | 'err' } }

interface ActionResult<T = unknown> {   // returned by state-transition POSTs
  data: T;                               // the updated resource
  message: string;                       // human toast text, e.g. "MB-SELL-41982 advanced to Inspection & approval"
  auditId: string;                       // AUD-… row written by this action
}
```

### 3.2 Primitives

```ts
interface Money { amount: number; currency: 'USD' | 'KES' | 'BTC' }
interface Quantity { value: number; unit: 'kg' | 't' | 'g' | 'oz' }
interface UnitPrice extends Money { per: Quantity['unit'] }
interface PartyRef { id: string; name: string; org?: string; tier?: 1 | 2 | 3 }
interface StaffRef { id: string; name: string; initials: string; role: string }
interface FileRef { id: string; name: string; mimeType: string; sizeBytes: number; uploadedAt: string; uploadedBy?: string }
interface Ref { type: RecordType; id: string } // deep-link target, see 3.6
```

### 3.3 Staff & session

```ts
interface Me {
  id: string; name: string; initials: string; email: string; phone: string; desk: string;
  role: { id: string; name: string; scope: string };
  permissions: Record<PermissionModule, 'none' | 'view' | 'edit'>;
  session: { id: string; state: 'active' | 'locked'; expiresAt: string; lockedAt?: string };
  csrfToken: string;
}
type PermissionModule = 'orders' | 'vault' | 'pricing' | 'auctions' | 'users' | 'compliance' | 'content' | 'financial' | 'settings' | 'support';
```

### 3.4 Trading

```ts
interface OrderSummary {           // row in #23
  id: string; side: 'buy' | 'sell'; mineral: string; party: PartyRef; quantity: Quantity;
  stage: OrderStage; daysInStage: number; agent: StaffRef; openedAt: string;
}
interface OrderDetail extends OrderSummary {
  stageIndex: number;              // 0–5
  tracker: Array<{ stage: OrderStage; state: 'done' | 'current' | 'upcoming'; description: string; at: string | null; projectedAt?: string; agent: StaffRef | null }>;
  route: { direction: 'seller_to_vault' | 'vault_to_buyer'; eta: string | null; summary: string;
           stops: Array<{ kind: 'seller_site' | 'inspection_hub' | 'bonded_carrier' | 'mb_vault' | 'buyer_site'; name: string; place: string; state: 'done' | 'current' | 'upcoming'; note: string }> };
  facts: { value: Money; lockedRate: UnitPrice; assayStatus: string; paymentStatus: 'due_on_approval' | 'released'; releasedAmount?: Money; sealNo?: string; carrier?: PartnerRef; hub?: PartnerRef; lab?: PartnerRef; escrowRef?: string; origin: string; destination: string };
  documents: Array<{ id: string; name: string; ref: string; status: DocStatus; fileId?: string }>;
  history: Array<{ text: string; actor: StaffRef; at: string }>;
  counterparty: { party: PartyRef; contactName: string; phone: string; completedOrders: number; disputes: number; kycStatus: 'verified' | 'in_review' | 'expiring' | 'rejected' };
  exceptions: Array<{ id: string; type: string; severity: 'note' | 'hold_order'; openedAt: string; status: 'open' | 'cleared' }>;
  linkedLcId?: string | null;
}
interface IntakeItem { id: string; party: PartyRef; mineral: string; quantity: Quantity; grade: string; liveRate: UnitPrice; suggested: Money; documents: Array<{ id: string; name: string; fileId?: string }>; photoCount: number; photos: FileRef[] }

interface LotSummary { id: string; mineral: string; quantity: Quantity; grade: string; sourceOrderId: string; status: LotStatus; daysHeld: number }
interface LotDetail extends LotSummary {
  location: string;                         // "Vault A bay 12"
  costBasis: Money; costRate: UnitPrice; realisable: Money; liveSellRate: UnitPrice; unrealised: Money; unrealisedPct: number;
  custody: Array<{ title: string; description: string; at: string | null; actor: string; state: 'done' | 'current' | 'upcoming' }>;
  photos: Array<FileRef & { label: 'intake' | 'seal' | 'bay' | 'weigh_in' }>;
  assay: { certificateNo: string; fileId: string; lab: PartnerRef; date: string; grade: string; method: string; netQuantity: Quantity };
  allocationHistory: Array<{ title: string; sub: string; date: string; amount?: Money }>;
  suggestions: { askPrice: Money; startingBid: Money; reserve: Money };   // pre-fills the allocation forms
  hold?: { reason: string; reviewOn: string; visibleInUnallocatedQueue: boolean } | null;
}

interface Listing {
  id: string; lotId: string; mineral: string; grade: string;
  quantityTotal: Quantity; quantityLeft: Quantity; askPrice: UnitPrice; listedValue: Money;
  status: ListingStatus; access: BuyerAccess; views: number; enquiries: number;
  listedAt: string | null; opensAt?: string | null; featured: boolean;
}
interface ListingDetail extends Listing {
  soldPct: number; priceFloor: UnitPrice; minParcel: { kind: 'percent' | 'quantity'; value: number; unit?: Quantity['unit'] };
  description: string; showAssayToBuyers: boolean; liveSellRate: UnitPrice; etag: string;
}

interface Rate { id: string; mineral: string; grade: string; buy: UnitPrice; sell: UnitPrice; source: 'market_feed' | 'manual_override'; updatedAt: string; trend24hPct: number }
interface Offer { id: string; orderId: string; party: PartyRef; mineral: string; declared: Quantity; assayed: Quantity; assay: { grade: string; certificateNo: string; fileId?: string }; rateApplied: UnitPrice; suggested: Money; note: string; noteKind: 'clean' | 'variance' | 'override'; validityHours: number }

interface AuctionSummary {
  id: string; status: AuctionStatus; mineral: string; lotId: string; quantity: Quantity;
  startingBid: Money; reserve: Money | null; currentBid?: Money | null; bidCount: number; bidderCount: number;
  leader?: PartyRef | null; opensAt: string; endsAt: string; access: BuyerAccess; flagged: boolean;
  outcome?: 'reserve_met' | 'reserve_not_met' | 'cancelled' | null; finalBid?: Money | null; winner?: PartyRef | null;
}
interface AuctionDetail extends AuctionSummary {
  increment: Money; costBasis: Money; realisable: Money; reserveVsCostPct: number; pausedAt?: string | null;
  riskSignal?: { kind: 'linked_accounts' | 'velocity'; text: string; detectedAt: string } | null;
  resolution?: { closedAt: string; marginOverCostPct: number; buyOrderId?: string | null; pipelineStage?: OrderStage; escrowRef?: string | null } | null;
}
interface Bid { id: string; amount: Money; bidder: PartyRef; at: string; leading: boolean; linkedAccount: boolean; meta: string }

interface LetterOfCredit {
  id: string; applicant: PartyRef; beneficiary: PartyRef; goods: string; amount: Money; bank: { id: string; name: string };
  status: LcStage; expiry: string | null; daysToExpiry: number | null; discrepancyCount: number; orderId: string; contractId: string;
}
interface LetterOfCreditDetail extends LetterOfCredit {
  latestShipmentDate: string | null;
  documents: Array<{ name: string; status: 'received' | 'pending' | 'discrepant'; fileId?: string }>;
  discrepancies: Array<{ id: string; text: string; raisedAt: string; status: 'open' | 'resolved'; resolvedBy?: StaffRef; resolvedAt?: string }>;
  amendments: Array<{ id: string; type: AmendmentType; newValue: string; status: 'requested' | 'accepted' | 'rejected'; requestedAt: string }>;
  canRelease: boolean; releaseBlockedReason?: string | null;
}
```

### 3.5 Network, people, content, operations

```ts
interface Negotiation { id: string; miner: PartyRef; trader: PartyRef; goods: string; quantity: Quantity; ask: UnitPrice; offer: UnitPrice; gapPct: number; rounds: number; status: NegotiationStatus; lastActivityAt: string;
  history?: Array<{ round: number; side: 'miner' | 'trader'; price: UnitPrice; at: string }> } // history on #76
interface Contract { id: string; seller: PartyRef; buyer: PartyRef; goods: string; value: Money; signedAt: string; lcId: string | null; negotiationId: string }
interface Ranking { party: PartyRef; rating: number; deals: number; onTimePct: number }

interface ChainEvent { id: string; type: ChainEventType; ref: Ref & { label: string }; description: string; txHash: string; at: string; status: 'confirmed' | 'pending' }

interface UserSummary { id: string; name: string; org: string; email: string; tier: 1 | 2 | 3; status: AccountStatus; orderCount: number; joinedAt: string }
interface UserDetail extends UserSummary { phone: string; lifetimeValue: Money; openDisputes: number; country: string }
interface TierRequest { id: string; user: PartyRef; from: 1 | 2 | 3; to: 1 | 2 | 3; reason: string; openedAt: string; status: 'pending' | 'approved' | 'denied' }

interface KycSubmission { id: string; person: string; org: string; userId: string; tier: 1 | 2 | 3; submittedAt: string; slaDueAt: string; overdue: boolean; status: KycStatus;
  documents: Array<{ id: string; name: string; ref: string; status: DocStatus; fileId: string }> }
interface TrackedDocument { id: string; type: string; ref: string; holder: PartyRef; tier: 1 | 2 | 3; expiresOn: string; daysToExpiry: number; status: DocStatus; fileId?: string }

interface Dispute { id: string; linked: Ref; type: string; party: PartyRef; status: DisputeStatus; daysOpen: number; valueAtRisk: Money; openedAt: string }
interface DisputeDetail extends Dispute { attachments: FileRef[]; resolution?: { outcome: DisputeOutcome; adjustment: Money | null; note: string; recordedBy: StaffRef; recordedAt: string } | null }
interface DisputeMessage { id: string; from: 'counterparty' | 'admin'; author: string; text: string; at: string; attachments?: FileRef[] }

interface Course { id: string; categoryId: string; title: string; lessonCount: number; status: 'published' | 'draft'; certified: boolean; summary?: string }
interface Lesson { id: string; courseId: string; title: string; position: number; media: 'video_transcript' | 'video' | 'text' | 'quiz'; body: string; status: 'published' | 'draft' }
interface Banner { id: string; title: string; placement: BannerPlacement; kind: 'hero' | 'secondary' | 'promo_card' | 'category' | 'email'; activeFrom: string; activeUntil: string | null; linkTarget: string; active: boolean; imageFileId?: string | null }
interface Partner { id: string; name: string; type: PartnerType; base: string; capacity: string; email: string; phone: string; accreditation?: string; status: PartnerStatus; volume: { count: number; unit: 'orders' | 'assays' }; note: string; internalNote?: string }
interface PartnerRef { id: string; name: string; type: PartnerType }
interface Ticket { id: string; subject: string; user: PartyRef; linked: Ref | null; status: TicketStatus; owner: StaffRef | { team: string }; openedAt: string; ageHours: number }
interface Call { id: string; at: string; who: PartyRef; phone: string; direction: 'inbound' | 'outbound'; durationSec: number; topic: string; agent: StaffRef }
interface AuditEntry { id: string; at: string; actor: StaffRef; action: string; category: AuditCategory; record: Ref & { label: string }; before: string; after: string }
interface Settlement { id: string; date: string; ref: Ref; party: PartyRef; kind: 'buy_settlement' | 'seller_payout' | 'auction_settlement' | 'btc_settlement'; amount: Money; status: 'released' | 'on_hold' | 'disputed' | 'pending'; rail?: 'bank' | 'mpesa' | 'lightning' | 'on_chain' }
```

### 3.6 Deep links (`Ref`)

Activity rows, bell items, audit rows, chain events, dispute links and tickets
deep-link to records. The server returns a typed `Ref`. The client maps it to a
route (it currently regex-parses free text in `useJump`).

```ts
type RecordType = 'order' | 'lot' | 'listing' | 'auction' | 'lc' | 'negotiation' | 'contract' | 'passport' | 'anchor'
  | 'user' | 'kyc' | 'document' | 'tier_request' | 'dispute' | 'ticket' | 'settlement' | 'rate' | 'offer' | 'intake'
  | 'course' | 'partner' | 'role';
```

---

## 4. Errors

Every non-2xx response has this body. `src/lib/apiClient.ts → errorFromResponse`
reads exactly these fields:

```json
{
  "code": "conflict/stale-state",
  "message": "MB-SELL-41982 is already at Payment released.",
  "fields": { "deskPrice": "Must be greater than 0" },
  "details": { "currentStage": "payment_released" },
  "requestId": "req_01J9Z…"
}
```

`fields` appears only on `422`. Values are a string or a string array (the
client takes the first entry).

| HTTP | `code` | When | Console behaviour |
|---|---|---|---|
| 400 | `request/malformed` | Unparseable JSON, unknown query param value | Generic error toast |
| 401 | `auth/session-expired` | No or expired session | Route to `/login` |
| 401 | `auth/console-locked` | Session locked (#9) | Route to `/locked` |
| 401 | `auth/invalid-credentials` | #1 wrong email or password | Inline form error |
| 401 | `auth/invalid-otp` | #4 wrong code | Inline form error |
| 403 | `auth/forbidden` | Role lacks module permission | "Not permitted for your role" toast |
| 403 | `auth/csrf` | Missing or bad CSRF token | Reload `/me`, retry once |
| 404 | `resource/not-found` | Unknown ID | Back to list + toast |
| 409 | `conflict/stale-state` | Precondition failed (stage moved, lot already allocated, offer decided) | Refetch + toast with `message` |
| 409 | `conflict/duplicate` | Idempotency-key reuse with a different body; listing already exists for lot | Toast |
| 412 | `conflict/etag-mismatch` | `If-Match` stale on an edit-gated save | "Someone else changed this — reload" |
| 422 | `validation/failed` | Field validation | Field messages under inputs |
| 422 | `rule/<name>` | Business rule (see per-endpoint) | Toast with `message` |
| 423 | `auth/challenge-locked` | Too many OTP attempts | Back to login |
| 429 | `rate-limited` | Rate limit | Toast, honour `Retry-After` |
| 500 | `server/internal` | Unhandled | Toast with `requestId` |
| 503 | `server/unavailable` | Dependency down (rate feed, chain node) | Toast; keep last data |

Client-side codes (no response): `client/demo-mode`, `client/timeout` (408),
`client/network` (0), `client/malformed-response`.

**The client must not retry** `4xx` (§3 of ARCHITECTURE-REVIEW). Only idempotent
`GET`s and `5xx` are retried.

---

## 5. Enumerations

Labels are what the console shows. The API sends the value.

| Enum | Values → label |
|---|---|
| `OrderStage` | `verification` Verification · `pricing_confirmation` Pricing confirmation · `agent_visit` Agent visit · `inspection_approval` Inspection & approval · `payment_released` Payment released · `custody_transfer` Custody transfer |
| `LotStatus` | `listed` · `in_vault` In vault · `in_auction` · `reserved` · `shipped` |
| `ListingStatus` | `live` · `paused` · `scheduled` · `sold_out` · `draft` · `ended` |
| `BuyerAccess` | `all_verified` All verified · `tier3_only` Tier 3 only · `tier2_plus` Tier 2+ |
| `AuctionStatus` | `draft` · `upcoming` · `live` · `paused` · `ended` · `cancelled` |
| `LcStage` | `requested` · `issued` · `shipped` · `docs_presented` Docs presented · `paid` |
| `AmendmentType` | `extend_expiry` · `change_amount` · `change_latest_shipment` · `change_documents` · `other` |
| `NegotiationStatus` | `awaiting_miner` · `awaiting_trader` · `terms_agreed` · `stalled` · `contracted` |
| `ChainEventType` | `passport_mint` · `custody_transfer` · `lc_event` · `btc_settlement` · `bitcoin_anchor` |
| `AccountStatus` | `verified` · `in_review` · `expiring` · `rejected` · `suspended` |
| `KycStatus` | `in_review` · `expiring_docs` · `verified` · `awaiting_resubmission` · `rejected` |
| `DocStatus` | `verified` · `in_review` · `expiring` · `expired` · `rejected` |
| `DisputeStatus` | `evidence_review` · `compliance_hold` · `awaiting_counterparty` · `resolved` |
| `DisputeOutcome` | `independent_reassay` Independent re-assay ordered · `settlement_adjusted` · `credit_issued` Credit issued to counterparty · `claim_rejected` |
| `ExceptionType` | `quantity_variance` · `grade_variance` · `document_issue` · `seal_tampered` · `counterparty_unreachable` · `other` |
| `BannerPlacement` | `homepage_hero` · `homepage_secondary` · `in_app_promo` · `category_miners` · `category_buyers` · `email_strip` |
| `PartnerType` | `bonded_carrier` · `inspection_hub` · `lab_assay` |
| `PartnerStatus` | `onboarding` · `active` · `under_review` · `suspended` |
| `TicketStatus` | `open` · `escalated` · `waiting_on_user` · `resolved` |
| `AuditCategory` | `pricing` · `compliance` · `orders` · `vault` · `roles_access` · `content` · `auth` · `financial` |

The display tone (green/amber/red pills) is **derived on the client** from these
values. The API does not send `tone`.

---

## 6. Endpoints

Each block lists: **Auth** (permission), **Request** (path / query / body),
**Response** (status + body), **Errors** (endpoint-specific, on top of §4).
List endpoints return `Page<T>` unless stated otherwise.

---

### A. Auth & Session

#### #1 `POST /auth/sign-in`
**Auth:** public · rate limited
```json
// Request
{ "email": "grace.kioko@mineralbridge.co.ke", "password": "••••••••" }
// 200
{ "challengeId": "chl_8f2a…", "channel": "sms", "maskedDestination": "+254 722 •• 4419", "expiresAt": "2026-10-16T09:05:00Z", "resendAvailableAt": "2026-10-16T09:00:30Z" }
```
Errors: `422 validation/failed` (empty email/password → "Enter your work email and password."), `401 auth/invalid-credentials` (the server must not say whether the email exists), `403 auth/account-disabled`.

#### #2 `POST /auth/sso/start`
```json
// Request
{ "email": "lydia.achieng@mineralbridge.co.ke", "returnTo": "/overview" }
// 200
{ "redirectUrl": "https://login.microsoftonline.com/…&state=…" }
```
Errors: `422 rule/not-staff-domain` ("Enter a staff email above, then continue with SSO.").

#### #3 `POST /auth/sso/callback`
```json
// Request
{ "code": "…", "state": "…" }
// 200 — same body as #1 (2FA still required)
```

#### #4 `POST /auth/otp/verify`
```json
// Request
{ "challengeId": "chl_8f2a…", "code": "418206" }
// 200 — Set-Cookie: mb_admin_session=…
{ "me": { /* Me */ }, "redirectTo": "/overview" }
```
Errors: `401 auth/invalid-otp` (`details.attemptsLeft`), `410 auth/challenge-expired`, `423 auth/challenge-locked`.

#### #5 `POST /auth/otp/resend`
```json
{ "challengeId": "chl_8f2a…" }   // → 200 { "maskedDestination": "+254 722 •• 4419", "resendAvailableAt": "…" }
```
Errors: `429 rate-limited` (before `resendAvailableAt`).

#### #6 `POST /auth/password-reset`
```json
{ "email": "grace.kioko@mineralbridge.co.ke" }   // → 202 { "message": "Password reset link sent to the work email on file" }
```
Always `202`, even for unknown emails. Signed-in callers (Profile) may send `{}`; the server uses the session email.

#### #7 `POST /auth/password-reset/confirm`
```json
{ "token": "rst_…", "newPassword": "…" }   // → 204
```
Errors: `410 auth/token-expired`, `422 validation/failed` (policy: ≥12 chars, not one of the last 5). Revokes all sessions.

#### #8 `POST /auth/refresh`
`204` with a rotated cookie and header `X-CSRF-Token: <new>`.

#### #9 `POST /auth/lock`
`200 { "lockedAt": "2026-09-18T13:42:00Z" }`

#### #10 `POST /auth/unlock`
```json
{ "password": "••••••••" }   // → 200 { "me": Me }
```
Errors: `401 auth/invalid-credentials`. 5 failures → session revoked → `401 auth/session-expired`.

#### #11 `POST /auth/sign-out`
`204`. Clears the cookie and revokes the session.

#### #12 `GET /me`
`200 Me` (§3.3). This is the source for the header avatar, the Profile page, role gating and the CSRF token.

---

### B. Shell, Search, Notifications & Lookups

#### #13 `GET /dashboard/counters`
**Auth:** auth. Counts come back only for modules the role can view.
```json
{
  "orders": { "active": 184 }, "listings": { "live": 9 }, "pricing": { "offersPending": 6 },
  "auctions": { "live": 7, "upcoming": 4, "endedThisQuarter": 38 }, "lc": { "attention": 4 },
  "collab": { "active": 23 }, "verification": { "kycQueue": 27, "expiringDocs": 9 },
  "disputes": { "open": 5 }, "support": { "openTickets": 12 }, "users": { "total": 8412, "tierRequests": 63 },
  "notifications": { "unread": 9 }
}
```
Poll every 60 s.

#### #14 `GET /search`
Query: `q` (≥ 2 chars, required), `types` (csv of `RecordType`), `limit` (default 5 per type).
```json
{ "query": "41982", "groups": [ { "type": "order", "items": [ { "ref": { "type": "order", "id": "MB-SELL-41982" }, "title": "MB-SELL-41982", "subtitle": "Gold Concentrate · Rift Valley Minerals Ltd · Inspection & approval" } ] } ] }
```

#### #15 `GET /notifications`
Query: `unreadOnly` (bool), `limit` (default 20).
```json
{ "data": [ { "id": "NTF-9921", "text": "AUC-2026-0219 flagged — linked accounts", "meta": "52 min ago · Auctions", "severity": "high", "target": { "type": "auction", "id": "AUC-2026-0219" }, "createdAt": "…", "read": false } ], "meta": { "unread": 9 } }
```

#### #16 `POST /notifications/{notificationId}/read`
`204`.

#### #17 `GET /files/{fileId}/url`
Query: `disposition=inline|attachment`.
`200 { "url": "https://files…?sig=…", "expiresAt": "…(5 min)", "file": FileRef }`. Access follows the owning record's permission. Every call is audited (document access).

#### #18 `GET /lookups`
Query: `types` csv of `minerals,grades,banks,exceptionTypes,amendmentTypes,disputeOutcomes,bannerPlacements,partnerTypes,countries,buyerAccess`.
```json
{ "minerals": [ { "id": "gold_concentrate", "name": "Gold Concentrate", "units": ["kg"] } ],
  "banks": [ { "id": "kcb", "name": "KCB Bank Kenya" } ],
  "exceptionTypes": [ { "value": "quantity_variance", "label": "Quantity variance" } ] }
```
Cacheable (`Cache-Control: max-age=3600`).

#### #19 `GET /staff`
Query: `q`, `role` (`field_agent|desk|compliance|support|content|data_entry`), `active` (bool).
`Page<StaffRef & { email: string; desk: string; openAssignments: number }>`.

---

### C. Overview

#### #20 `GET /overview/summary`
```json
{
  "kpis": {
    "pendingKyc": { "value": 27, "deltaVsLastWeek": 6, "overdue": 4 },
    "activeOrders": { "value": 184, "byStage": [ { "stage": "verification", "count": 38 }, { "stage": "pricing_confirmation", "count": 31 }, { "stage": "agent_visit", "count": 27 }, { "stage": "inspection_approval", "count": 24 }, { "stage": "payment_released", "count": 41 }, { "stage": "custody_transfer", "count": 23 } ] },
    "vaultRealisable": { "value": { "amount": 46310000, "currency": "USD" }, "unrealisedPct": 8.1 },
    "liveAuctions": { "value": 7, "closingToday": 2 },
    "settlementsThisWeek": { "value": { "amount": 8920000, "currency": "USD" }, "settled": 12, "pending": 3 }
  },
  "vaultByMineral": [ { "mineral": "Gold Concentrate", "realisable": { "amount": 18420000, "currency": "USD" }, "quantity": { "value": 412, "unit": "kg" }, "lots": 86 } ],
  "deskQueues": [ { "key": "kyc", "label": "KYC queue", "sub": "4 overdue past 48 h SLA", "count": 27, "severity": "warn", "target": "verification" },
                  { "key": "offers", "count": 6, "target": "pricing_offers" }, { "key": "intake", "count": 4, "target": "orders_intake" },
                  { "key": "unallocated_lots", "count": 9, "target": "vault", "filter": { "status": "in_vault", "minDaysHeld": 7 } },
                  { "key": "disputes", "count": 5, "target": "disputes" } ]
}
```

#### #21 `GET /overview/trade-finance`
Query: `window=90d` (default).
```json
{
  "tiles": [ { "key": "active_negotiations", "value": 23, "sub": "8 awaiting a counter-offer", "target": "collab" },
             { "key": "lc_issued_vs_paid", "issued": { "amount": 31400000, "currency": "USD" }, "paid": { "amount": 22900000, "currency": "USD" }, "paidPct": 73, "target": "lc" },
             { "key": "avg_lc_cycle_days", "value": 18.6, "deltaDays": -2.1, "target": "lc" },
             { "key": "discrepancy_rate", "valuePct": 6.8, "sub": "4 of 59 presentations this month", "target": "lc" },
             { "key": "passports_on_chain", "value": 1284, "thisWeek": 46, "target": "chain" },
             { "key": "btc_settled_volume", "value": { "amount": 4120000, "currency": "USD" }, "btc": 62.4, "sharePct": 7, "target": "chain" } ],
  "lcFunnel": [ { "stage": "requested", "count": 72, "value": { "amount": 39800000, "currency": "USD" } }, { "stage": "issued", "count": 59, "value": { "amount": 31400000, "currency": "USD" } } ]
}
```

#### #22 `GET /overview/activity`
Query: `limit` (default 20, max 50), `before` (cursor timestamp).
`{ "data": [ { "id": "ACT-…", "text": "Order MB-SELL-41982 moved to Inspection & approval", "meta": "Rift Valley Minerals Ltd · 18.4 kg Gold Concentrate · agent F. Wanjiru on site", "at": "…", "kind": "order", "severity": "info", "ref": { "type": "order", "id": "MB-SELL-41982" } } ], "meta": { "nextBefore": "…" } }`

---

### D. Orders

#### #23 `GET /orders`
**Auth:** Orders:view
Query: `side=buy|sell`, `stage=<OrderStage>`, `q` (id, mineral, party, side, stage), `sort=id|mineral|side|party|quantity|stage|daysInStage|agent`, `order`, `page`, `pageSize` (console uses 6).
`200 Page<OrderSummary>` with `meta.counts` = `{ "all": 184, "verification": 38, … }` (chip badges, ignoring the stage filter).

#### #24 `GET /orders/export`
Same query as #23 (no paging). `200 text/csv`, `Content-Disposition: attachment; filename="orders-2026-10-16.csv"`. Over 10,000 rows → `202 { "exportId": "…", "message": "Export queued — you will get an email" }`.

#### #25 `POST /orders`
**Auth:** Orders:edit · Idempotency-Key
```json
{
  "side": "sell",
  "counterpartyId": "USR-10442",
  "mineralId": "gold_concentrate",
  "declaredQuantity": { "value": 18.4, "unit": "kg" },
  "agentId": "STF-0007",
  "note": "Walk-in at Nairobi desk",
  "draft": false
}
```
`201 { "data": OrderDetail, "message": "Order created at Verification" }` (draft: `status` `draft`, message "Order saved as a draft").
Errors: `422 rule/counterparty-not-verified`, `422 rule/tier-quantity-limit` (Tier 1/2 caps), `422 rule/buy-requires-listing` (buy orders need `listingId` + `quantity`).

#### #26 `GET /orders/{orderId}`
`200 OrderDetail` with `ETag`.

#### #27 `POST /orders/{orderId}/advance`
**Auth:** Orders:edit · Idempotency-Key
```json
{ "expectedStage": "agent_visit", "note": "Visit completed, sample sealed" }
```
`200 ActionResult<OrderDetail>`, message `"MB-SELL-41982 advanced to Inspection & approval"`.
Rules: stage `custody_transfer` is terminal → `422 rule/order-complete` ("Order … has completed custody transfer"). Gates: → `payment_released` needs an approved firm offer (#52) and inspection approved. → `custody_transfer` needs the payment settlement recorded. An open `hold_order` exception → `422 rule/order-on-hold`. Stale `expectedStage` → `409 conflict/stale-state`.
Side effects: entering `custody_transfer` on a sell order creates the vault lot and mints a passport (chain event).

#### #28 `POST /orders/{orderId}/exceptions`
```json
{ "type": "quantity_variance", "severity": "hold_order", "description": "Scale reading 18.21 kg vs 18.4 kg declared", "draft": false }
```
`201 ActionResult<{ id: "EXC-…", status: "open" }>`, message "Exception flagged on MB-SELL-41982 — compliance notified". `hold_order` pauses the stage clock.

#### #29 `PUT /orders/{orderId}/assignee`
```json
{ "agentId": "STF-0011", "reason": "workload_rebalance", "handoverNote": "Seller prefers morning visits" }
```
`200 ActionResult<OrderDetail>`. Errors: `422 rule/agent-unavailable`.

#### #30 `POST /orders/{orderId}/messages`
```json
{ "subject": "Update on MB-SELL-41982", "body": "Your consignment passed inspection.", "channels": ["sms", "in_app"], "draft": false }
```
`201 { "id": "MSG-…", "deliveredVia": ["sms", "in_app"], "message": "Message sent to Joseph Kiptoo" }`.

#### #31 `GET /orders/intake`
Query: `q`, `page`, `pageSize`. `200 Page<IntakeItem>`.

#### #32 `POST /orders/intake/{intakeId}/offer`
**Auth:** Pricing:edit · Idempotency-Key required
```json
{ "deskPrice": { "amount": 5820000, "currency": "USD" }, "validityHours": 48, "note": "" }
```
`200 ActionResult<{ offerId: string; expiresAt: string; orderId: string }>`, message "Firm offer sent to … · valid 48 h". The intake item leaves the queue.
Errors: `422 validation/failed` (`deskPrice` required, > 0), `422 rule/price-outside-tolerance` (`details.suggested`, `details.tolerancePct`; the client can resend with `"overrideTolerance": true, "reason": "…"`), `409 conflict/stale-state` (offer already sent).

#### #33 `POST /orders/intake/{intakeId}/document-requests`
```json
{ "documents": ["Updated export permit"], "deadline": "2026-09-19", "note": "Permit on file expires before delivery", "draft": false }
```
`201 ActionResult<{ id: "DRQ-…" }>`, message "Document request sent to …".

---

### E. Vault & Inventory

#### #34 `GET /vault/summary`
`{ "cards": [StatCard…] }`, keys `lots_in_custody` (sub "9 unallocated >7 days"), `cost_basis`, `realisable`, `avg_days_held` (target 45).

#### #35 `GET /vault/lots`
Query: `status=<LotStatus>`, `allocatable=true` (in vault, not reserved/listed/in auction), `minDaysHeld`, `mineral`, `q` (id, mineral, grade, source, status), `sort=id|mineral|status|daysHeld`, `order`, paging.
`200 Page<LotSummary>`, `meta.totalUnfiltered` = lots in custody.

#### #36 `GET /vault/lots/{lotId}`
`200 LotDetail`.

#### #37 `POST /vault/lots/{lotId}/hold`
**Auth:** Vault:edit
```json
{ "reason": "Awaiting rate recovery", "reviewOn": "2026-10-01", "visibleInUnallocatedQueue": false }
```
`200 ActionResult<LotDetail>` (`status: reserved`), message "Lot MBV-2026-0412 held in vault reserve".
Errors: `409 conflict/stale-state` (lot listed or in auction: end that first), `422 rule/lot-shipped`.

---

### F. Catalog Listings

#### #38 `GET /listings/summary`
Cards: `live_listings`, `catalog_value`, `sold_this_month` (+ % of listed volume), `avg_days_to_sell`.

#### #39 `GET /listings`
Query: `status=<ListingStatus>`, `featured`, `access`, `q` (id, lot, mineral, grade, status, access), `sort=id|mineral|price|value|views|status`, paging. `200 Page<Listing>`.

#### #40 `POST /listings`
**Auth:** Vault:edit · Idempotency-Key
```json
{
  "lotId": "MBV-2026-0412",
  "askPrice": { "amount": 68450, "currency": "USD", "per": "kg" },
  "quantity": { "value": 54, "unit": "kg" },
  "minParcel": { "kind": "percent", "value": 10 },
  "access": "all_verified",
  "showAssayToBuyers": true,
  "note": "Shown to buyers under the assay summary",
  "opensAt": null,
  "sourceAuctionId": null,
  "draft": false
}
```
`quantity` null → the full lot. `opensAt` in the future → status `scheduled`.
`201 ActionResult<ListingDetail>`, message "Listing published to the Buy catalog".
Errors: `409 conflict/stale-state` (lot not allocatable: already listed, in auction or reserved), `422 rule/quantity-exceeds-lot`, `422 rule/ask-below-cost` (warning; resend with `"confirmBelowCost": true`).

#### #41 `GET /listings/{listingId}`
`200 ListingDetail` + `ETag`.

#### #42 `PATCH /listings/{listingId}`
**Auth:** Vault:edit · `If-Match` required
```json
{ "askPrice": { "amount": 67900, "currency": "USD", "per": "kg" }, "priceFloor": { "amount": 64300, "currency": "USD", "per": "kg" },
  "quantity": { "value": 54, "unit": "kg" }, "minParcel": { "kind": "percent", "value": 10 }, "access": "tier3_only", "featured": true, "description": "…" }
```
All fields optional. `200 ListingDetail`. Errors: `412 conflict/etag-mismatch`, `422 rule/floor-above-ask`, `422 rule/quantity-below-sold`.

#### #43 `POST /listings/{listingId}/pause` · #44 `POST /listings/{listingId}/resume`
Body `{ "reason"?: string }`. `200 ActionResult<ListingDetail>`.
Messages: "MBL-… paused — hidden from buyers" / "MBL-… resumed — visible in the catalog".
Errors: `409 conflict/stale-state` (already in the target state, sold out or ended).

#### #45 `POST /listings/{listingId}/end`
Body `{ "returnLotTo": "reserve" }`. `200 ActionResult<ListingDetail>` (status `ended`), message "MBL-… ended — lot returned to vault reserve". Open buyer orders against the listing stay valid. Only the unsold quantity returns.

---

### G. Pricing & Rates

#### #46 `GET /pricing/feed-status`
`{ "state": "live" | "degraded" | "down", "provider": "LBMA + LME", "lastSyncAt": "…", "nextSyncAt": "…" }`

#### #47 `GET /pricing/rates`
Query: `source=market_feed|manual_override`, `mineral`, `q` (mineral, grade, source), `sort=mineral|buy|sell|trend`. `200 Page<Rate>` (unpaged in practice, ≤ 100 rows).

#### #48 `GET /pricing/rates/export`
`text/csv`.

#### #49 `GET /pricing/rates/{rateId}/history`
Query: `range=12W|6M|1Y`, `side=buy|sell` (default buy).
```json
{ "rateId": "RATE-GOLD-92", "range": "12W", "points": [ { "at": "2026-06-20", "value": 61200 } ], "summary": { "start": 61200, "high": 64100, "low": 60800, "changePct": 4.2 }, "unit": "kg", "currency": "USD" }
```

#### #50 `PUT /pricing/rates/{rateId}/source`
**Auth:** Pricing:edit
```json
// switch to manual
{ "source": "manual_override", "buy": { "amount": 31400, "currency": "USD", "per": "t" }, "sell": { "amount": 34100, "currency": "USD", "per": "t" }, "reason": "Feed lagging spot by 2%" }
// switch back to feed
{ "source": "market_feed" }
```
When switching to manual without prices, the server copies the current feed values. `200 ActionResult<Rate>`, message "Cobalt Hydroxide 20.5% Co content switched to manual desk rate".
Errors: `422 rule/override-deviation` (manual rate more than ±15 % from the feed needs `"confirmDeviation": true`).

#### #51 `GET /pricing/offers`
Query: `status=pending` (default), `q`. `200 Page<Offer>`.

#### #52 `POST /pricing/offers/{offerId}/decision`
**Auth:** Pricing:edit · Idempotency-Key required
```json
{ "decision": "approve" }
{ "decision": "adjust", "amount": { "amount": 405000, "currency": "USD" }, "reason": "Moisture deduction" }
{ "decision": "hold", "reason": "Weight variance 3.6% over threshold" }
```
`200 ActionResult<Offer & { status: 'approved' | 'adjusted' | 'held'; sentAt?: string; expiresAt?: string }>`.
Messages: "Firm offer $1,161,798 sent to Rift Valley Minerals Ltd" · "Adjusted offer sent to … for MB-SELL-41877" · "MB-SELL-41877 held for desk review".
Errors: `422 validation/failed` (`amount` required for `adjust`), `409 conflict/stale-state` (already decided).

---

### H. Auctions

#### #53 `GET /auctions`
Query: `status=live|upcoming|ended` (required), `flagged=true|false`, `closingToday=true`, `q` (id, mineral, lot, leader/winner), `sort=id|mineral|currentBid|bids|endsAt|finalBid`, paging.
`200 Page<AuctionSummary>`, `meta.counts = { "live": 7, "upcoming": 4, "ended": 38 }`.

#### #54 `GET /auctions/eligible-lots`
`{ "data": [ { "lot": LotSummary, "costBasis": Money, "realisable": Money, "suggested": { "startingBid": Money, "reserve": Money, "increment": Money } } ] }`

#### #55 `POST /auctions`
**Auth:** Auctions:edit · Idempotency-Key
```json
{
  "lotId": "MBV-2026-0412",
  "startingBid": { "amount": 5560000, "currency": "USD" },
  "reserve": { "amount": 5914000, "currency": "USD" },
  "increment": { "amount": 55600, "currency": "USD" },
  "opensAt": null,
  "endsAt": "2026-09-16T14:00:00Z",
  "access": "tier3_only",
  "publish": true,
  "sourceListingId": null
}
```
`publish: true` with `opensAt` null → live now. `publish: false` → `upcoming` ("Save as upcoming"). `sourceListingId` ends that listing in the same transaction ("Move to auction").
`201 ActionResult<AuctionDetail>`, message "Auction published for MBV-2026-0412".
Errors: `409 conflict/stale-state` (lot not eligible), `422 rule/reserve-below-start`, `422 rule/duration` (1 h – 14 days).

#### #56 `GET /auctions/{auctionId}`
`200 AuctionDetail`. Ended auctions include `resolution`.

#### #57 `PATCH /auctions/{auctionId}`
Only while `upcoming`. Same fields as #55 except `lotId`. `If-Match`. Errors: `409 conflict/stale-state` (already live).

#### #58 `POST /auctions/{auctionId}/go-live`
`200 ActionResult<AuctionDetail>`, message "AUC-… published — now live". Recomputes `endsAt` from the configured duration.

#### #59 `GET /auctions/{auctionId}/bids`
Query: `limit` (default 50), `before` (cursor). `{ "data": Bid[], "meta": { "bidderCount": 9, "nextBefore": "…" } }`

#### #60 `GET /auctions/{auctionId}/bids/stream`
SSE. See §7.

#### #61 `POST /auctions/{auctionId}/pause` · #62 `/resume`
Body `{ "reason": string }` (required for pause). `200 ActionResult<AuctionDetail>`. Pausing freezes `endsAt`. Resuming extends it by the paused time.
Messages: "AUC-… paused — bidding suspended" / "AUC-… resumed".

#### #63 `POST /auctions/{auctionId}/cancel`
Body `{ "reason": string }` (required). `200 ActionResult<AuctionDetail>` (status `cancelled`), message "AUC-… cancelled — lot returned to vault". Bidders are notified and escrow holds are released.
Errors: `409 conflict/stale-state` (already ended).

#### #64 `POST /auctions/{auctionId}/flags`
```json
{ "kind": "linked_accounts", "note": "3 sequential bids within 47 s from accounts sharing a payout method", "bidIds": ["BID-…"] }
```
`201 ActionResult<{ flagId: string }>`. Bids stay live. Compliance is notified.

#### #65 `POST /auctions/{auctionId}/escalate`
Body `{ "note": string, "pauseAuction": false }`. `201 ActionResult<{ disputeId: "DSP-2026-0069" }>`. The console then opens the dispute.

#### #66 `POST /auctions/{auctionId}/relist`
Only for `ended` with `reserve_not_met`, or `cancelled`.
```json
{ "action": "lower_reserve", "reserve": { "amount": 5600000, "currency": "USD" }, "endsAt": "…" }
{ "action": "catalog", "askPrice": { "amount": 9500, "currency": "USD", "per": "t" } }
{ "action": "vault_reserve", "reason": "Wait for copper recovery" }
```
`200 ActionResult<{ auctionId?: string; listingId?: string; lotId: string }>`.
Messages: "AUC-… relisted at a lower reserve" · "Lot moved to the fixed-price catalog" · "Lot returned to vault reserve".

---

### I. LC & Payments

#### #67 `GET /letters-of-credit/summary`
Cards: `open` (+ outstanding), `expiring_7d` (+ within 48 h), `with_discrepancies` (+ open items), `paid_this_month`.

#### #68 `GET /letters-of-credit`
Query: `status=<LcStage>`, `expiringWithinDays=7`, `hasDiscrepancies=true`, `q` (id, applicant, beneficiary, goods, bank, status, order), `sort=id|amount|status|expiry|discrepancies`. `200 Page<LetterOfCredit>`.

#### #69 `POST /letters-of-credit`
**Auth:** Financial:edit
```json
{ "contractId": "CTR-2026-0186", "bankId": "kcb", "amount": { "amount": 1174000, "currency": "USD" }, "latestShipmentDate": "2026-10-05", "expiryDate": "2026-10-14", "draft": false }
```
`201 ActionResult<LetterOfCreditDetail>` (status `requested`), message "LC request sent to applicant".
Errors: `422 rule/amount-exceeds-contract`, `422 rule/expiry-before-shipment`, `409 conflict/duplicate` (contract already has an LC).

#### #70 `GET /letters-of-credit/{lcId}`
`200 LetterOfCreditDetail`.

#### #71 `POST /letters-of-credit/{lcId}/discrepancies/{discrepancyId}/resolve`
Body `{ "resolution": "waived_by_applicant" | "corrected_document" | "bank_accepted", "note": string, "fileId"?: string }`.
`200 ActionResult<LetterOfCreditDetail>`, message "Discrepancy 1 on LC-… marked resolved".

#### #72 `POST /letters-of-credit/{lcId}/release`
**Auth:** Financial:edit · Idempotency-Key required · second-factor confirmation recommended (see §9).
Body `{ "expectedAmount": { "amount": 1174000, "currency": "USD" } }`.
`200 ActionResult<LetterOfCreditDetail & { settlementId: string }>`, message "Payment of $1,174,000 released under LC-…".
Errors: `422 rule/lc-not-presented` ("Release unlocks at Docs presented"), `422 rule/lc-open-discrepancies`, `409 conflict/stale-state` (already paid), `422 rule/amount-mismatch`.

#### #73 `POST /letters-of-credit/{lcId}/amendments`
```json
{ "type": "extend_expiry", "newValue": "2026-10-28", "reason": "Vessel delayed at Mombasa", "draft": false }
```
`201 ActionResult<{ amendmentId: string }>`, message "Amendment requested on LC-…".

---

### J. Collaboration

#### #74 `GET /negotiations/summary`
Cards: `active` (+ awaiting counter), `contracts_qtd` (+ value), `avg_time_to_agreement`, `offer_acceptance_rate`.

#### #75 `GET /negotiations`
Query: `status=<NegotiationStatus>`, `q` (id, miner, trader, goods, status), paging. `200 Page<Negotiation>` (no `history`).

#### #76 `GET /negotiations/{negotiationId}`
`200 Negotiation` with `history`, plus `suggestedMidpoint: UnitPrice`.

#### #77 `POST /negotiations/{negotiationId}/mediations`
```json
{ "price": { "amount": 68300, "currency": "USD", "per": "kg" }, "validForHours": 48, "note": "Midpoint of current ask and offer", "draft": false }
```
`201 ActionResult<Negotiation>`, message "Mediated offer sent on NEG-…". Errors: `409 conflict/stale-state` (terms already agreed or contracted).

#### #78 `POST /negotiations/{negotiationId}/reminders`
Body `{}`. The server picks the party whose turn it is. `200 { "sentTo": PartyRef, "message": "Reminder sent to Coast Bullion Partners" }`. `429` if reminded in the last 12 h.

#### #79 `POST /negotiations/{negotiationId}/contract`
Body `{ "templateId"?: string, "requireLc": true }`.
`201 ActionResult<Contract & { signature: { provider: 'docusign'; envelopeId: string; status: 'sent' } }>`, message "Contract drafted for NEG-… — sent to both parties for e-signature".
Errors: `422 rule/terms-not-agreed`.

#### #80 `GET /contracts`
Query: `q`, `withoutLc=true` (LC drawer picker), `signedFrom`, paging. `200 Page<Contract>`.

#### #81 `GET /network/rankings`
Query: `role=miner|trader` (required), `limit` (default 5). `{ "data": Ranking[] }`.

---

### K. Blockchain Monitor

#### #82 `GET /chain/network-status`
`{ "data": [ { "key": "passport_ledger", "name": "Passport ledger", "state": "healthy", "meta": "12 s block time", "ok": true } ] }`

#### #83 `GET /chain/anchors/latest`
```json
{ "id": "ANC-2026-0912", "block": 969412, "confirmations": 3, "at": "…", "merkleRoot": "7c9e…41b0d3", "txId": "b3f1…e82a", "explorerUrl": "https://mempool.space/tx/…", "batch": { "passports": 412, "custodyEvents": 186 }, "nextBatchClosesAt": "…" }
```

#### #84 `GET /chain/passports/stats`
Query: `weeks=8`. `{ "total": 1284, "thisWeek": 46, "weekly": [ { "weekStart": "2026-08-17", "count": 28 } ] }`

#### #85 `GET /chain/events`
Query: `type=<ChainEventType>`, `q` (type, ref, description, hash), `since` (for polling), paging. `200 Page<ChainEvent>`.

#### #86 `POST /chain/passports/verify`
```json
{ "passportId": "MBP-2026-1284" }   // or { "hash": "0x8f3a…c41e" }
// 200
{ "valid": true, "passportId": "MBP-2026-1284", "lotId": "MBV-2026-0431", "anchor": { "id": "ANC-2026-0912", "block": 969412, "txId": "…" }, "custodyEvents": 4, "message": "MBP-2026-1284 verified — anchored in block 969,412" }
```
`valid: false` comes back with `200` and a `reason` (`not_found`, `hash_mismatch`, `not_yet_anchored`).

#### #87 `POST /chain/anchors`
**Auth:** Financial:edit. Body `{ "reason"?: string }`. `202 { "queuedFor": "ANC-2026-0913", "closesAt": "…", "message": "Manual anchor queued — next batch closes in 6 min" }`.

---

### L. Users & Accounts

#### #88 `GET /users`
Query: `tier=1|2|3`, `status=<AccountStatus>`, `verifiedOnly=true` (pickers), `q` (name, org, email, phone), `sort=name|tier|status|orders|joined`, paging. `200 Page<UserSummary>`.

#### #89 `GET /users/export`
`text/csv`, same filters. Personal data export is audited.

#### #90 `GET /users/{userId}`
`200 UserDetail`.

#### #91 `GET /users/{userId}/orders` · #92 `/tickets` · #93 `/documents`
Paged. `OrderSummary` / `Ticket` / `TrackedDocument`. `/orders` adds `meta.lifetimeValue: Money`.

#### #94 `POST /users/{userId}/messages`
Same body as #30. `201`.

#### #95 `POST /tier-requests`
**Auth:** Users:edit
```json
{ "userId": "USR-10442", "toTier": 3, "reason": "Incorporated as a limited company", "raisedBy": "admin" }
```
`201 ActionResult<TierRequest>`, message "Tier change sent to compliance for …". Errors: `409 conflict/duplicate` (pending request exists), `422 rule/same-tier`.

#### #96 `GET /tier-requests`
Query: `status=pending` (default), paging. `200 Page<TierRequest>`.

#### #97 `POST /tier-requests/{requestId}/decision`
**Auth:** Compliance:edit
```json
{ "decision": "approve" }            // or { "decision": "deny", "reason": "Group registration not yet filed" }
```
`200 ActionResult<TierRequest>`. Approval may create a KYC submission for the new tier's documents (`data.kycId`).
Messages: "Mary Wekesa moved to Tier 2" / "Mary Wekesa's tier request denied".

---

### M. Verification & Compliance

#### #98 `GET /compliance/kyc`
Query: `tier=1|2|3`, `overdueSla=true`, `status=<KycStatus>` (default: open statuses), `q` (id, org, person, tier), paging. `200 Page<KycSubmission>` (documents included).

#### #99 `GET /compliance/kyc/{kycId}`
`200 KycSubmission` plus `history: Array<{ action, actor, at }>`.

#### #100 `POST /compliance/kyc/{kycId}/decision`
**Auth:** Compliance:edit · Idempotency-Key
```json
{ "decision": "approve" }
{ "decision": "request_resubmission", "documents": ["DOC-…"], "reason": "Permit scan unreadable" }
{ "decision": "reject", "reason": "Name mismatch vs application" }
```
`200 ActionResult<KycSubmission>`. Messages: "Tier 3 approved for Sarah Ochieng" · "Resubmission requested from …" · "KYC-7741 rejected — reason sent to …".
Errors: `422 validation/failed` (`reason` required for resubmit/reject), `422 rule/documents-unverified` (approve with documents still `in_review`), `409 conflict/stale-state`.

#### #101 `GET /compliance/documents`
Query: `expiry=expired|lt30|lt90`, `status=in_review`, `q` (type, ref, holder, tier, status), `sort=type|holder|tier|daysToExpiry|status` (default `daysToExpiry asc`).
`200 Page<TrackedDocument>` with `meta.counts = { "expiringWithin35": 3, "expired": 1 }`.

---

### N. Disputes & Resolution

#### #102 `GET /disputes`
Query: `status=<DisputeStatus>`, `q` (id, link, type, party, status), `sort=id|type|daysOpen|value`. `200 Page<Dispute>`.

#### #103 `GET /disputes/{disputeId}`
`200 DisputeDetail`.

#### #104 `GET /disputes/{disputeId}/messages`
`{ "data": DisputeMessage[] }`, oldest first.

#### #105 `POST /disputes/{disputeId}/messages`
`{ "text": "…", "attachmentFileIds": [] }` → `201 DisputeMessage`. Message "Reply sent to …".

#### #106 `POST /disputes/{disputeId}/resolution`
**Auth:** Compliance:edit · Idempotency-Key required
```json
{ "outcome": "settlement_adjusted", "adjustment": { "amount": -14200, "currency": "USD" }, "note": "Re-assay confirmed 88.4% Au; settlement adjusted." }
```
`200 ActionResult<DisputeDetail>` (status `resolved`), message "Resolution recorded on DSP-… — counterparty notified". A non-zero adjustment posts a settlement entry (#126).
Errors: `422 rule/adjustment-required` for `settlement_adjusted` / `credit_issued`.

#### #107 `POST /disputes/{disputeId}/escalate`
`{ "note"?: string }` → `200 ActionResult<DisputeDetail>` (status `compliance_hold`), message "DSP-… escalated to compliance".

---

### O. Academy

#### #108 `GET /academy/categories`
`{ "data": [ { "id": "CAT-GS", "name": "Getting Started", "lessonCount": 7, "courses": Course[] } ] }`. `q` filters by course title.

#### #109 `POST /academy/courses`
**Auth:** Content:edit
`{ "title": "…", "categoryId": "CAT-GS", "plannedLessons": 4, "certified": false, "summary": "…", "draft": true }`
`201 Course`. Message "Course created as a draft".

#### #110 `PATCH /academy/courses/{courseId}`
Any of `title, categoryId, status ('published'|'draft'), certified, summary`. `200 ActionResult<Course>`.
Messages: "'…' updated" · "'…' marked as a certified track" · "removed from certified tracks".
Errors: `422 rule/publish-empty-course` (no published lessons).

#### #111 `POST /academy/courses/{courseId}/lessons`
`{ "title": "…", "position": "end" | number, "media": "video_transcript", "body": "…", "mediaFileId"?: string, "draft": false }` → `201 Lesson`.
The category-level **Add lesson** button opens the same drawer with a course picker.

#### #112 `GET /academy/analytics`
```json
{ "cards": [StatCard], "completion": [ { "courseId": "CRS-…", "title": "How Mineral Bridge works", "ratePct": 86, "byTier": { "1": 91, "2": 88, "3": 74 } } ] }
```

---

### P. Marketing

#### #113 `GET /marketing/banners`
Query: `q`, `active`, `placement`. `200 Page<Banner>`.

#### #114 `POST /marketing/banners`
`{ "title": "…", "placement": "homepage_hero", "activeFrom": "2026-09-15", "activeUntil": "2026-10-15", "linkTarget": "/sell/gold-concentrate", "imageFileId"?: string, "draft": false }`
`201 Banner` (`active: false`), message "Banner created — inactive until you toggle it live".
Errors: `422 rule/link-target-invalid` (must be an internal path), `422 rule/dates`.

#### #115 `PATCH /marketing/banners/{bannerId}`
Any `Banner` field, including `active`. `200 ActionResult<Banner>`. Messages: "'…' set live" / "'…' taken offline" / "'…' updated".
Errors: `422 rule/slot-occupied` (another hero banner is live for overlapping dates; `details.conflictingBannerId`).

---

### Q. Partners & Logistics

#### #116 `GET /partners`
Query: `type=<PartnerType>`, `status`, `q` (name, base, contact, status). Response is grouped:
`{ "groups": [ { "type": "bonded_carrier", "label": "Bonded carriers", "partners": Partner[] } ] }`

#### #117 `POST /partners`
`{ "name": "…", "type": "bonded_carrier", "base": "Nairobi", "capacity": "12 vehicles", "email": "…", "phone": "+254…", "accreditation": "ISO 17025", "draft": false }`
`201 Partner` (status `onboarding`), message "Partner added in Onboarding status".

#### #118 `PATCH /partners/{partnerId}`
`{ "status"?, "email"?, "phone"?, "base"?, "capacity"?, "internalNote"? }` → `200 ActionResult<Partner>`.
Setting `suspended` removes the partner from new order assignments. Existing orders keep it (`details.activeOrders`).

---

### R. Enquiries & Support

#### #119 `GET /support/tickets`
Query: `status=<TicketStatus>`, `ownerId`, `q` (id, subject, user, link, status, owner), `sort=id|status|owner|age`. `200 Page<Ticket>`.

#### #120 `POST /support/tickets`
`{ "userId": "USR-…", "linked": { "type": "order", "id": "MB-SELL-41964" } | null, "subject": "…", "ownerId": "STF-…", "firstNote": "…", "channel": "phone" | "whatsapp" | "email", "draft": false }`
`201 Ticket`, message "Ticket opened and assigned".

#### #121 `GET /support/tickets/{ticketId}`
`200 Ticket & { notes: Array<{ id, author: StaffRef, text, at }> }`

#### #122 `GET /support/calls`
Query: `direction`, `agentId`, `q` (who, phone, topic, agent), `sort=at|who|duration|agent`. `200 Page<Call>`.

---

### S. Audit Log

#### #123 `GET /audit-log`
Query: `category=<AuditCategory>`, `actorId`, `recordType`, `recordId`, `from`, `to`, `q` (who, role, action, record, before, after), `sort=at|actor|action|record` (default `at desc`), paging.
`200 Page<AuditEntry>`, `meta.totalUnfiltered` (e.g. 41,882) and `meta.retentionYears: 7`. Append-only. No write endpoints.

#### #124 `POST /audit-log/exports`
`{ "filters": { /* same as #123 */ }, "format": "csv" | "jsonl" }` → `202 { "exportId": "EXP-…", "message": "Audit log export queued — you will get an email" }`. The export itself is audited.

---

### T. Financial & Reporting

#### #125 `GET /settlements/summary`
Query: `period=2026-09`. Cards: `held_in_escrow` (+ open count), `released_this_week`, `on_hold` (+ under dispute), `fee_revenue` (+ blended take %).

#### #126 `GET /settlements`
Query: `status=released|on_hold|disputed|pending`, `period=YYYY-MM`, `kind`, `q` (id, ref, party, kind, status), `sort=id|date|amount|status`. `200 Page<Settlement>`.

#### #127 `GET /settlements/statement`
Query: `period=YYYY-MM` (required), `format=csv|pdf`. `200` file download. Message "September 2026 statement exported as CSV".

---

### U. Analytics

#### #128 `GET /analytics/summary`
Query: `window=90d|30d|1y`.
```json
{
  "kpis": [ { "key": "gmv", "value": { "amount": 110000000, "currency": "USD" }, "deltaPct": 14.2 }, { "key": "active_accounts", "value": 8412, "delta": 312 }, { "key": "avg_order_cycle_days", "value": 15.0, "delta": -1.8 }, { "key": "auction_fill_rate", "valuePct": 82, "deltaPts": 6 } ],
  "gmvByMineral": [ { "mineral": "Gold Concentrate", "value": { "amount": 42800000, "currency": "USD" } } ],
  "tierDistribution": [ { "tier": 1, "users": 5124, "pct": 61 } ],
  "auctionPerformance": { "metric": "avg_bids_per_auction", "points": [ { "month": "2025-10", "value": 62 } ], "yoyPct": 74 },
  "academyEngagement": [ { "key": "lessons_started", "value": 7412, "deltaPct": 9.2 } ],
  "stageBottlenecks": [ { "stage": "agent_visit", "avgDays": 4.9, "targetDays": 2.9, "status": "bad" } ]
}
```

---

### V. Settings

#### #129 `GET /settings/roles`
```json
{ "modules": ["orders","vault","pricing","auctions","users","compliance","content","financial","settings"],
  "roles": [ { "id": "ROLE-DESK", "name": "Trading Desk Manager", "description": "Prices consignments, runs the vault", "seats": 3, "access": { "orders": "edit", "vault": "edit", "pricing": "edit", "auctions": "edit", "users": "view", "compliance": "view", "content": "none", "financial": "view", "settings": "none" } } ],
  "etag": "W/\"r-118\"" }
```

#### #130 `PUT /settings/roles/permissions`
**Auth:** Settings:edit · `If-Match`
```json
{ "changes": [ { "roleId": "ROLE-CLERK", "module": "users", "access": "view" } ], "reason": "Least privilege review" }
```
`200` (same body as #129), message "Role permissions saved — change written to the audit log". One audit row per changed cell.
Errors: `422 rule/lockout` (removing `settings:edit` from the last Super Admin), `412 conflict/etag-mismatch`.

#### #131 `GET /settings/platform`
```json
{ "settings": [ { "key": "instant_estimate_tolerance_pct", "label": "Instant estimate tolerance", "description": "Variance allowed before a firm offer needs desk approval", "value": 3.0, "unit": "percent", "min": 0, "max": 10 },
  { "key": "assay_variance_flag_pct", "value": 3.0 }, { "key": "firm_offer_validity_hours", "value": 48 }, { "key": "kyc_review_sla_hours", "value": 48 },
  { "key": "document_expiry_escalation_days", "value": 30 }, { "key": "default_bid_increment_pct", "value": 1.0 } ], "etag": "…" }
```

#### #132 `PUT /settings/platform`
`{ "values": { "firm_offer_validity_hours": 72 } }` + `If-Match` → `200` (same as #131). Errors: `422 validation/failed` (out of min/max).

#### #133 `GET /settings/btc/countries`
`{ "data": [ { "code": "KE", "name": "Kenya", "regulation": "permitted_vasp", "regulationLabel": "Permitted · VASP licence", "rail": "lightning_and_onchain", "limit": { "amount": 500000, "currency": "USD" }, "enabled": true, "locked": false } ], "meta": { "enabledCount": 3 }, "etag": "…" }`
`locked: true` when `regulation = prohibited` (toggle disabled).

#### #134 `PUT /settings/btc/countries`
`{ "changes": [ { "code": "UG", "enabled": true } ], "reason": "…" }` + `If-Match` → `200` (same as #133).
Errors: `422 rule/country-prohibited` ("Bitcoin payments are prohibited in …").

---

### W. Profile

#### #135 `PATCH /me`
`{ "name"?: string, "phone"?: string, "desk"?: string }` → `200 Me`. Email and role are not editable here. Phone changes need OTP re-verification (`202 { "challengeId": "…" }` → #4).

#### #136 `GET /me/sessions`
`{ "data": [ { "id": "SES-…", "device": "Chrome · macOS", "location": "Nairobi, KE", "ipMasked": "41.90.x.x", "lastActiveAt": "…", "current": true } ] }`

#### #137 `DELETE /me/sessions/{sessionId}`
`204`. Errors: `422 rule/cannot-revoke-current` (use #11).

#### #138 `GET /me/notification-preferences`
`{ "preferences": [ { "key": "offers_awaiting_approval", "label": "Firm offers awaiting my approval", "enabled": true }, { "key": "auction_flagged", "enabled": true }, { "key": "daily_settlement_digest", "enabled": false }, { "key": "lot_held_over_45_days", "enabled": true } ] }`

#### #139 `PUT /me/notification-preferences`
`{ "preferences": { "daily_settlement_digest": true } }` (partial) → `200` (same as #138).

---

## 7. Real-time

| Channel | Endpoint | Mechanism |
|---|---|---|
| Auction bid feed | #60 `GET /auctions/{id}/bids/stream` | **Server-Sent Events** (`text/event-stream`), cookie-authenticated, heartbeat every 15 s |
| Chain events "LIVE FEED" | #85 with `since` | Poll every 15 s (SSE recommended later: §5 of the endpoint list) |
| Counters / bell | #13, #15 | Poll every 60 s, and refetch after any mutation |
| Rate feed | #46, #47 | Poll every 120 s |

SSE events on #60:

```
event: bid
data: {"bid": Bid, "auction": {"currentBid": Money, "bidCount": 35, "leader": PartyRef, "endsAt": "…"}}

event: state
data: {"status": "paused" | "live" | "ended" | "cancelled", "endsAt": "…"}

event: risk
data: {"kind": "linked_accounts", "text": "…", "bidIds": ["…"]}
```
Reconnect with `Last-Event-ID`. The server replays missed events for up to 10 minutes.

---

## 8. Authorisation matrix

The server enforces permissions on every request; the console's hidden or
disabled controls are not the security boundary. Default role grants
(from `settingsData.ts`):

| Role | Orders | Vault | Pricing | Auctions | Users | Compliance | Content | Financial | Settings | Support† |
|---|---|---|---|---|---|---|---|---|---|---|
| CEO / Super Admin | edit | edit | edit | edit | edit | edit | edit | edit | edit | edit |
| Trading Desk Manager | edit | edit | edit | edit | view | view | — | view | — | view |
| Compliance Officer | view | view | — | view | view | edit | — | view | — | view |
| Content Manager | — | — | — | — | — | — | edit | — | — | — |
| Support Agent | view | — | — | — | view | — | — | — | — | edit |
| Data Entry Clerk | view | edit | — | — | view | — | — | — | — | — |

Record-level rules on top of module permissions:
- Money-moving actions (#32, #52, #72, #106) are blocked for the person who
  created the record: four-eyes rule, `403 auth/four-eyes`.
- Compliance decisions (#97, #100) require `compliance:edit`, even though tier
  requests live under Users.
- Users' personal data (#88–#93) is masked (`email`, `phone`) for roles with
  `users:view` only, unless the role also has `compliance:view`.

---

## 9. Open questions

| # | Question | Default assumed here |
|---|---|---|
| 1 | The role matrix has 9 modules but the console has 21. Support, Partners, Audit, Analytics, LC, Collab and Chain have no column. | Added a `support` module. Partners → Orders, LC/Chain/Analytics → Financial, Collab → Orders, Audit → Settings:view. **Product to confirm.** |
| 2 | Should LC payment release (#72) and dispute settlement adjustments (#106) require step-up (OTP re-entry)? | Recommended: `X-Step-Up-Token` from a fresh #4-style challenge for amounts > $250k. |
| 3 | Currency: everything in the demo is USD. Seller payouts in KES (M-Pesa)? | `Money.currency` supports `USD`, `KES`, `BTC`. Settlements carry both the original amount and the USD equivalent. |
| 4 | Are drafts per-user or shared with the desk? | Shared within the module, visible with `status=draft`. |
| 5 | Auction duration: the create form shows a fixed "5 days · closes …". Is it configurable? | `endsAt` is required, 1 h – 14 days. |
| 6 | Does a buyer purchase from a catalog listing create the Buy order automatically, and where does it enter the pipeline? | Yes, at Verification (same as an auction win). |
| 7 | Bitcoin settlement rails (Lightning vs on-chain): is the provider integration in this API? | Out of scope. This API only toggles per-country availability. |

---

## 10. Frontend integration notes

What needs to change in the console when `VITE_API_BASE_URL` is set:

1. **Unwrap list envelopes.** Services return raw arrays today
   (`apiRequestOrDemo(ENDPOINTS.orders.list, ORDERS)`). List endpoints return
   `Page<T>`, so services must read `.data` and pass `meta` to the table footers
   and chip counts.
2. **Stop routing by display names.** `ROUTES.user(u.name)`, tier requests
   keyed by `name`, rates keyed by `mineral|grade`, courses, banners and partners
   keyed by `title`/`name`. All switch to the IDs in §1.
3. **Structured values.** Fixtures hold formatted strings (`bid: '$5,940,000'`,
   `qty: '86.4 kg'`, `left: '4 h 12 m'`, `submitted: 'Submitted 2 h ago'`).
   Format `Money` / `Quantity` / timestamps in the client
   (`lib/collection.ts → money()` already exists).
4. **Tone is derived.** Drop `tone` from the types. Map status enums to tones in
   `constants/tones.ts`.
5. **Server-side filtering, sorting and paging.** Filter chips, `SortHead` and
   header search currently filter bundled arrays (`useQueryMatch`, `useSorted`).
   Move them into query keys so they become request params.
6. **Wire mutations.** Every `consoleActions.notify(...)` and drawer `submit()`
   that stands in for a write today should become a `useMutation` calling the
   endpoint, show `ActionResult.message` as the toast, and invalidate the
   affected queries. The in-memory state maps (`stageAdv`, `offerDone`, `kycDone`,
   `tierDone`, `overrides`, `paused`, `flagged`, `toggles`, `access`, `btcOn`)
   go away.
7. **The drawer needs per-form schemas.** `DrawerHost` renders free-text inputs
   for every field. Endpoints need typed values (IDs from pickers, enums, dates,
   money). Each drawer config needs a field `name`, `type` and lookup source, plus
   a `mutation` to call.
8. **Auth.** Replace `authenticateDemo` / `resolveSso` with #1–#5, and store
   `Me` from #12 in place of `STAFF_ACCOUNTS[roleIndex]`. Remove the demo
   credentials panel from production builds.
9. **Endpoint constants.** Replace `src/lib/endpoints.ts` with the 139 paths in
   [API-ENDPOINTS.md](API-ENDPOINTS.md) §6, which lists the renamed paths.
