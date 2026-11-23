# GhayMajha Database & Schema Audit

**Database:** Supabase PostgreSQL  
**Schema Version:** `20261123120000_admin_operations.sql`  

---

## 1. Core Tables Summary

| Table | Primary Key | Key Relationships | RLS Status | Description |
|---|---|---|---|---|
| `public.profiles` | `id (uuid)` | `auth.users(id)` | Enabled | User profiles with full name, phone, and role |
| `public.admin_roles` | `id (uuid)` | `profiles(id)` | Enabled | Role assignments (`super_admin`, `admin`, `catalog_manager`, `order_manager`, `support`) |
| `public.categories` | `id (uuid)` | Self-referencing parent | Enabled | Hierarchical catalog categories with slugs |
| `public.products` | `id (uuid)` | `categories(id)` | Enabled | Main product records, prices in paise, cover image |
| `public.product_images` | `id (uuid)` | `products(id)` | Enabled | Multiple gallery images with position and is_primary flag |
| `public.product_variants` | `id (uuid)` | `products(id)`, `devices(id)` | Enabled | Device variants, SKUs, colors, and prices |
| `public.devices` | `id (uuid)` | Self | Enabled | Supported phone models (iPhone 17, Galaxy S24, etc.) |
| `public.inventory` | `variant_id (uuid)`| `product_variants(id)` | Enabled | On-hand quantity, reservations, low-stock alerts |
| `public.inventory_logs` | `id (uuid)` | `product_variants(id)` | Enabled | Historical stock movement logs |
| `public.orders` | `id (uuid)` | `profiles(id)`, `coupons(id)` | Enabled | Customer orders, statuses, shipping & billing JSON |
| `public.order_items` | `id (uuid)` | `orders(id)`, `variants(id)` | Enabled | Order item snapshots, quantities, paise totals |
| `public.payments` | `id (uuid)` | `orders(id)` | Enabled | Razorpay transaction IDs, status, and paise amounts |
| `public.coupons` | `id (uuid)` | None | Enabled | Promo codes, percentage or fixed discount, usage limits |
| `public.activity_logs` | `id (uuid)` | `profiles(id)` | Enabled | System audit trails for administrative actions |
| `public.site_settings` | `key (text)` | None | Enabled | Key-value store for store configurations |

---

## 2. Integrity Constraints & Foreign Keys
- `orders.total_paise = subtotal_paise - discount_paise + shipping_paise` (Check constraint `valid_order_total`).
- `order_items` cascades on `orders(id)` deletion.
- `product_images` cascades on `products(id)` deletion.
- Positive price checks on `regular_price_paise >= 0` and `quantity >= 0`.

---

## 3. Database Functions & Procedures (RPCs)
- `get_user_admin_role(user_uuid)`: Security definer function returning role permissions without privilege escalation.
- `is_admin()`: Helper function returning boolean status for quick policy checks.
- `adjust_inventory(target_variant_id, quantity_delta, reason, reference_id)`: Atomic inventory modification preventing race conditions.
- `admin_metrics_summary()`: High-performance rollup of total revenue, orders, active products, and low stock.
- `admin_customer_summary()`: Aggregation of customer order counts, lifetime spending, and last order dates.
