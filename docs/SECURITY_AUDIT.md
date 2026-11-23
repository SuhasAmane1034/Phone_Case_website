# GhayMajha Security Audit

**Classification:** High-Priority E-Commerce Assessment  
**Standard:** OWASP Top 10 + Supabase RLS & Payment Gateway Hardening  

---

## 1. Authentication & Session Security
- **Mechanism:** Supabase SSR cookie storage using HTTP-only, secure cookies with strict SameSite attributes.
- **Role Verification:** Server-side evaluation via `requireAdminPermission` in `src/lib/admin/server.ts`. Client-supplied roles or tampering cannot grant administrative privileges.
- **Edge Boundary:** PostgREST queries are eliminated from the Edge middleware to avoid token race conditions and premature token leakage.

## 2. Authorization & Database Access Control (RLS)
- **Status:** All 18 public tables have Row Level Security enabled.
- **Admin Access:** Admins verify membership via `public.admin_roles` joined to `auth.uid()`.
- **Public Read Access:** Visitors and anonymous shoppers can only read rows where `is_active = true` on `public.products`, or read public `product_images` and `categories`.
- **Order Isolation:** Customers can only read orders where `user_id = auth.uid()`. Admin roles are required to read cross-customer orders.

## 3. Payment Processing & Razorpay Hardening
- **Signature Verification:** Razorpay webhook and checkout verification verify payload integrity using `crypto.createHmac("sha256", secret)` with `crypto.timingSafeEqual` to prevent timing attacks.
- **Server-Side Pricing:** Product prices are calculated entirely on the server in integer paise. Client prices and discounts are never trusted.
- **Key Exposure:** Razorpay Secret Key is confined to server-side route handlers. Only `RAZORPAY_KEY_ID` is exposed for frontend checkout modal initialization.

## 4. Input Sanitization & Validation
- **Checkout Input:** Validated via Zod schemas checking phone formats (10-digit Indian mobile regex), pin codes (6-digit Indian postal code regex), and string lengths.
- **SQL Injection:** Zero raw string concatenation. All database operations use PostgREST parameterized queries.
- **XSS Prevention:** React JSX escapes HTML by default. No `dangerouslySetInnerHTML` is used for untrusted user inputs.

## 5. Storage Bucket Hardening
- **Bucket:** `product-images` storage bucket has explicit MIME type validation (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) and a strict 10MB file size ceiling.
- **Write Policy:** Only authenticated administrators can upload, overwrite, or delete storage objects.
