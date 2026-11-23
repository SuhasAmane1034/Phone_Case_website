# Ghyamajha Implementation Plan

Date: 2026-11-21

## Current Gate

**Phase 1 — Audit:** Complete for the available workspace.

A new application will be initialized only after the audit is recorded. No existing source has been overwritten.

**Current Gate: Phase 7 — Customer Accounts and Order Tracking**

### Phase 5 completion evidence

- [x] Persistent local cart with quantity and removal controls implemented
- [x] Live header cart count implemented
- [x] Server-side checkout validation and price recalculation implemented
- [x] Server-side stock and variant validation implemented
- [x] Guest checkout route enabled
- [x] COD/Razorpay method selection implemented
- [x] Coupon GY10 server-side calculation implemented

### Phase 6 completion evidence

- [x] Razorpay server order creation implemented
- [x] Razorpay payment record creation implemented
- [x] Standard Checkout loaded and opened from the UI
- [x] HMAC SHA256 signature verification implemented
- [x] Constant-time signature comparison implemented
- [x] Captured status reconciliation with Razorpay API implemented
- [x] Raw-body webhook endpoint implemented
- [x] payment.captured, payment.failed and order.paid handled
- [x] Idempotent webhook event storage implemented
- [x] Secrets remain server-only
- [x] TypeScript, ESLint and production build pass

## Phase 1: Audit Existing Codebase and Document Architecture

Status: Complete

- [x] Inspect workspace contents
- [x] Confirm framework and package availability
- [x] Review public Ghyamajha homepage
- [x] Review SeasonMade UX patterns at a high level
- [x] Identify unavailable database/payment source evidence
- [x] Create project audit, schema, payment and implementation documents

Exit criteria:

- Repository state documented
- Technical approach approved
- No live-domain overwrite attempted

## Phase 2: Database and Authentication

Status: Foundation complete; local database runtime pending Docker

- [x] Initialize Next.js App Router and TypeScript
- [x] Configure Tailwind CSS and linting
- [x] Install Supabase, validation and payment dependencies
- [x] Add initial commerce migration and RLS policies
- [x] Add Supabase browser, server and middleware clients
- [x] Add authentication callback and protected account/admin routes
- [ ] Verify migrations locally
- [ ] Verify unauthorized admin access
- [ ] Complete guest and registered cart ownership

Exit criteria:

- TypeScript and lint pass
- Migrations run cleanly
- RLS verified
- Unauthorized admin access rejected

## Phase 3: Storefront and Navigation

Status: Complete

- Build premium announcement bar
- Build desktop and mobile header
- Build responsive mega navigation
- Build hero/carousel with original Ghyamajha content
- Build device category cards
- Build featured collection sections
- Build benefits, FAQ and newsletter sections
- Build premium responsive footer
- Add loading, error and empty states

Exit criteria:

- Homepage is responsive
- Navigation routes resolve
- Reusable layout components are in place

## Phase 4: Product Catalogue and Product Details

Status: Complete

- Build category, collection and device routes
- Build server-side product queries
- Implement filtering, sorting and pagination
- Build product cards and sale calculations
- Build PDP gallery, zoom and variant selectors
- Implement compatibility and stock validation
- Implement reviews and related/recent products
- Add dynamic metadata and Product structured data

Exit criteria:

- Catalog filters are correct
- Unavailable variants cannot be purchased
- PDP and listing metadata are correct

## Phase 5: Cart and Checkout

Status: Complete

## Phase 6: Razorpay Integration

Status: Foundation complete; live/test credentials pending

- Configure test/live environments
- Create pending internal order and Razorpay order
- Open Standard Checkout
- Verify payment signature server-side
- Fetch payment status through Razorpay API
- Capture webhook events with raw-body signature validation
- Implement idempotency and retry behavior
- Implement COD separately
- Add failure and retry states

Exit criteria:

- Test payment passes end to end
- Failed and retried payments behave correctly
- Duplicate webhooks do not duplicate updates
- No secret reaches frontend code

## Phase 7: Customer Accounts and Tracking

- Build signup, login, logout and password recovery
- Build profile and address management
- Build order history/details
- Build wishlist
- Build public/private track-order flow
- Prepare provider-neutral shipment integration adapters

Exit criteria:

- Users can access only their own data
- Tracking is based on stored/order-provider truth only

## Phase 8: Admin Dashboard

- Build protected `/admin` shell
- Build overview analytics
- Build product/category/device/variant/inventory management
- Build order management and status updates
- Build customer and coupon management
- Build banner and shipping/COD settings
- Build review moderation
- Support invoice export and refund initiation

Exit criteria:

- Only authorized admins can mutate data
- Stock and order mutations are atomic where required
- All controls are backed by real operations

## Phase 9: Security, SEO and Testing

- Add secure HTTP headers and rate limits
- Validate/sanitize inputs
- Configure safe storage uploads
- Add RLS and service-role isolation
- Add robots, sitemap and canonical metadata
- Add responsive images and lazy loading
- Add unit, integration and Playwright tests
- Validate accessibility basics
- Run lint, TypeScript and production build

Exit criteria:

- No critical security or payment findings
- Critical journeys pass in test
- Lighthouse/Core Web Vitals baseline recorded

## Phase 10: Deployment

- Configure staging Supabase project
- Configure Vercel preview deployments
- Configure Razorpay test mode and webhook
- Execute migrations and seed only approved content
- Configure custom domain only after approval
- Run final production build and smoke tests
- Configure Razorpay live mode and live webhook
- Add monitoring and alerting
- Do not deploy or replace live DNS automatically

Exit criteria:

- Approval received before production cutover
- Backup and rollback procedure documented
- Live secrets configured outside Git

## Required Validation Per Phase

After each phase:

1. Run lint.
2. Run TypeScript checks.
3. Run relevant tests.
4. Run production build.
5. Fix blocking issues.
6. Update this plan with status and evidence.

## Initial Backlog Priority

P0:

- Repository setup
- Database/auth/RLS
- Storefront shell
- Catalog and PDP
- Cart and server-side checkout
- Razorpay
- Admin order/product operations

P1:

- Customer account and wishlist
- Reviews
- Coupons
- Tracking
- Analytics
- SEO refinements

P2:

- Shiprocket provider integration
- Advanced analytics
- Personalization/recommendation logic

## Decisions Required Before Build

1. Approved stack: Next.js App Router, Supabase and Vercel.
2. Whether to migrate or re-create existing product catalog and images.
3. COD eligibility and activation rules.
4. Shipping zones/rates and free-shipping threshold.
5. Replacement policy and product warranty text.
6. Authorized Razorpay account and test/live credentials.
7. Admin identities and role provisioning process.
8. Whether email/SMS/order notifications use Resend, Twilio or another provider.
