# GhayMajha E-Commerce Codebase Audit

**Date:** 2026-11-23  
**Auditor:** Senior Full-Stack & Security Engineering Agent  
**Environment:** Next.js 16.4.6 (App Router + Turbopack), React 19, TypeScript, Supabase PostgreSQL, Tailwind CSS, Razorpay  

---

## 1. Architecture Overview
- **Framework:** Next.js App Router (Node.js runtime for APIs & Server Actions; Edge runtime removed from middleware to maintain Supabase cookie stability).
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) enabled on all 18 core commerce tables.
- **Payment Gateway:** Razorpay Standard Checkout SDK + Server-side HMAC SHA-256 signature verification & Webhook endpoint (`/api/payments/razorpay/webhook`).
- **State Management:** URL searchParams for admin filters/pagination; LocalStorage with custom `ghyamajha-cart-updated` events for shopping cart and badge synchronization.

---

## 2. Directory Structure Analysis
```
ghyamahja/
├── docs/                     # Project audit, checklists, security & testing reports
├── src/
│   ├── app/
│   │   ├── (storefront)/     # Home (/), collections, search, devices, product details
│   │   ├── account/          # Customer profile, orders, addresses
│   │   ├── admin/            # Mission-control dashboard, products, inventory, orders, sections
│   │   ├── api/              # Checkout order creation, Razorpay verification & webhook, products
│   │   ├── cart/             # Shopping bag page
│   │   ├── checkout/         # Multi-step checkout & payment
│   │   ├── login/            # Role-aware authentication with instant admin routing
│   │   └── track-order/      # Public order tracking
│   ├── components/
│   │   ├── admin/            # Data tables, order forms, status dialogs, print action
│   │   └── storefront/       # Headers, footers, product cards, magnifiers, carousels
│   ├── data/                 # Static catalog baseline & mock fallbacks
│   └── lib/
│       ├── admin/            # Permission resolution, server session security, role definitions
│       ├── storefront/       # Live Supabase product retrieval & catalog merging
│       └── supabase/         # SSR cookie-safe clients (server, client, middleware)
└── supabase/
    ├── migrations/           # PostgreSQL schema, constraints, triggers, and RPCs
    └── scripts/              # Verified operational scripts for admin roles & permissions
```

---

## 3. Core Findings & Work Completed
1. **Admin Authorization & Middleware Stabilization**:
   - Resolved Edge runtime PostgREST permission failure by performing role evaluation inside Server Components via `requireAdminPermission`.
   - Admin roles are validated against `public.admin_roles` and cached in memory with fallback to `is_admin()`.
2. **Product Catalog & Live Storefront Synchronization**:
   - Replaced static-only catalogue usage with `getStorefrontProducts()` in `src/lib/storefront/products.ts`.
   - Storefront routes (`/`, `/collections/[slug]`, `/search`, `/product/[slug]`) now load dynamic Supabase products.
3. **Multi-Image File & URL Management**:
   - Product modal handles concurrent batch uploads (`Promise.all`) directly to the Supabase `product-images` storage bucket.
   - Synchronizes `products.primary_image` and all child rows in `public.product_images`.
4. **Cart & Bag Synchronization**:
   - Resolved cart disconnect where items added from database were missing from `/cart`.
   - Added instant "Added ✓" feedback to quick-add and product detail pages.
   - Wired cart quantity adjustments and line removal with real-time badge updates.
5. **Checkout & Payment Engine**:
   - Enhanced `/api/checkout/create-order` to validate dynamic database products.
   - Supported Razorpay key integration from test environment (`rzp-test-key.csv`).
