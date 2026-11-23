# GhayMajha Bug Report & Resolution Log

### BUG-001: `/admin/inventory` Shadowing 404
- **Severity:** High
- **Description:** The dynamic catch-all route `src/app/admin/[section]/page.tsx` shadowed `/admin/inventory` because the folder existed without an `index` or `page.tsx`.
- **Resolution:** Implemented `src/app/admin/inventory/page.tsx` with direct server-side data fetching and permission checks.

### BUG-002: Edge Runtime Middleware Session Lockout
- **Severity:** Critical
- **Description:** Direct PostgREST queries inside Next.js Edge Middleware failed because cookies were evaluated before session synchronization completed, triggering false `not_admin` redirects.
- **Resolution:** Restored official `@supabase/ssr` middleware standard to focus purely on session refresh and cookie propagation. Delegated permission enforcement to Server Components via `src/lib/admin/server.ts`.

### BUG-003: Storefront Disconnect from Supabase Products
- **Severity:** Critical
- **Description:** Homepage, Collections, Search, and PDP solely read static records from `src/data/catalog.ts`. Newly added database products never appeared.
- **Resolution:** Created `src/lib/storefront/products.ts` to query active products, join `product_images` and categories, and merge dynamic products at the top of the catalogue.

### BUG-004: Premature File Replacement on Sequential Uploads
- **Severity:** Medium
- **Description:** Native browser `<input type="file">` replaced its file list whenever the user opened the file picker multiple times, losing previous selections.
- **Resolution:** Built an accumulated file queue in React state inside `src/app/admin/products/product-modal.tsx`, sending all files concurrently via `Promise.all` in `src/app/admin/products/actions.ts`.

### BUG-005: Shopping Bag "Empty" Despite Header Count
- **Severity:** High
- **Description:** The header badge showed items from `localStorage`, but `/cart` filtered items exclusively against the hardcoded catalogue, omitting custom products.
- **Resolution:** Updated `src/components/storefront/cart-page.tsx` to query live products and resolve both custom and catalogue variants.

### BUG-006: Missing Checkout Server-Role Key
- **Severity:** High
- **Description:** Order creation halted with `503 Checkout database is not configured yet` when `SUPABASE_SERVICE_ROLE_KEY` was missing from `.env.local`.
- **Resolution:** Added automatic fallback to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and authored `supabase/scripts/fix_checkout_permissions.sql` to grant insert policies on `orders`, `order_items`, and `payments`.
