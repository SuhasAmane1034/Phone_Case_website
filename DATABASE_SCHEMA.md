# Ghyamajha Database Schema

Database target: Supabase PostgreSQL

## Design Principles

- Use UUID primary keys.
- Store monetary values in integer paise (₹1 = 100 paise).
- Store timezone-aware timestamps (`TIMESTAMPTZ`).
- Use foreign keys and restrictive/controlled delete behavior.
- Keep immutable customer and variant snapshots in order items.
- Never store Razorpay secret values or webhook secrets in database tables.
- Enforce public catalog read access and admin-only mutations.
- Use row-level security for private customer data.
- Use database constraints and RPC/transactions for inventory and order mutations.

## Core Tables

### profiles

- `id UUID PRIMARY KEY REFERENCES auth.users(id)`
- `full_name TEXT`
- `phone TEXT UNIQUE`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### admin_roles

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE`
- `role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### categories

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `parent_id UUID REFERENCES categories(id)`
- `position INTEGER NOT NULL DEFAULT 0`
- `is_active BOOLEAN NOT NULL DEFAULT true`

### devices

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL UNIQUE`
- `slug TEXT NOT NULL UNIQUE`
- `brand TEXT NOT NULL CHECK (brand IN ('Apple', 'Samsung', 'Other'))`
- `series TEXT`
- `position INTEGER NOT NULL DEFAULT 0`
- `is_active BOOLEAN NOT NULL DEFAULT true`

### products

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE`
- `sku TEXT UNIQUE`
- `description TEXT`
- `short_description TEXT`
- `regular_price_paise INTEGER NOT NULL CHECK (regular_price_paise >= 0)`
- `sale_price_paise INTEGER CHECK (sale_price_paise IS NULL OR sale_price_paise >= 0)`
- `category_id UUID REFERENCES categories(id)`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `is_bestseller BOOLEAN NOT NULL DEFAULT false`
- `is_featured BOOLEAN NOT NULL DEFAULT false`
- `is_new_arrival BOOLEAN NOT NULL DEFAULT false`
- `is_active BOOLEAN NOT NOT NULL DEFAULT true`
- `created_at`, `updated_at`, `published_at`

Constraint: if `sale_price_paise` is set, it must be less than or equal to `regular_price_paise`.

### product_images

- `id UUID PRIMARY KEY`
- `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE`
- `storage_path TEXT NOT NULL`
- `alt_text TEXT`
- `position INTEGER NOT NULL DEFAULT 0`
- `is_primary BOOLEAN NOT NULL DEFAULT false`

### product_device_compatibility

- `product_id UUID REFERENCES products(id) ON DELETE CASCADE`
- `device_id UUID REFERENCES devices(id) ON DELETE CASCADE`
- Primary key: `(product_id, device_id)`

### product_variants

- `id UUID PRIMARY KEY`
- `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE`
- `sku TEXT NOT NULL UNIQUE`
- `name TEXT NOT NULL`
- `colour TEXT`
- `colour_hex TEXT`
- `device_id UUID REFERENCES devices(id)`
- `regular_price_paise INTEGER NOT NULL CHECK (regular_price_paise >= 0)`
- `sale_price_paise INTEGER CHECK (sale_price_paise IS NULL OR sale_price_paise >= 0)`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- Unique constraint: `(product_id, device_id, colour)`

Variants require a product/device compatibility record when `device_id` is populated.

### inventory

- `variant_id UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE`
- `quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)`
- `reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0)`
- `low_stock_threshold INTEGER NOT NULL DEFAULT 5`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Available quantity is `quantity - reserved_quantity` and must remain non-negative.

## Cart and Wishlist

### carts

- `id UUID PRIMARY KEY`
- `user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE`
- `guest_token_hash TEXT UNIQUE`
- `expires_at TIMESTAMPTZ`
- `created_at`, `updated_at`

At least one owner field must be present.

### cart_items

- `id UUID PRIMARY KEY`
- `cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE`
- `variant_id UUID NOT NULL REFERENCES product_variants(id)`
- `quantity INTEGER NOT NULL CHECK (quantity > 0)`
- Unique constraint: `(cart_id, variant_id)`

### wishlists

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE`
- Unique constraint: `(user_id, product_id)`

## Customer Data

### addresses

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `full_name TEXT NOT NULL`
- `phone TEXT NOT NULL`
- `email TEXT`
- `house TEXT NOT NULL`
- `street TEXT NOT NULL`
- `landmark TEXT`
- `city TEXT NOT N NOT NULL`
- `state TEXT NOT NULL`
- `pin_code TEXT NOT NULL`
- `is_default_shipping BOOLEAN NOT NULL DEFAULT false`
- `is_default_billing BOOLEAN NOT NULL DEFAULT false`

## Coupons

### coupons

- `id UUID PRIMARY KEY`
- `code TEXT NOT NULL UNIQUE`
- `discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed'))`
- `discount_value INTEGER NOT NULL CHECK (discount_value > 0)`
- `minimum_order_paise INTEGER NOT NULL DEFAULT 0`
- `usage_limit INTEGER`
- `per_user_limit INTEGER`
- `starts_at`, `ends_at`
- `is_active BOOLEAN NOT NULL DEFAULT true`

## Orders

### orders

- `id UUID PRIMARY KEY`
- `order_number TEXT NOT NULL UNIQUE`
- `user_id UUID REFERENCES profiles(id)`
- `customer_email TEXT`
- `customer_phone TEXT NOT NULL`
- `status TEXT NOT NULL CHECK (status IN ('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned'))`
- `payment_status TEXT NOT NULL CHECK (payment_status IN ('pending','authorized','captured','failed','refunded','partially_refunded'))`
- `payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay','cod'))`
- `subtotal_paise INTEGER NOT NULL`
- `discount_paise INTEGER NOT NULL DEFAULT 0`
- `shipping_paise INTEGER NOT NULL DEFAULT 0`
- `total_paise INTEGER NOT NOT NULL`
- `shipping_address JSONB NOT NULL`
- `billing_address JSONB`
- `coupon_id UUID REFERENCES coupons(id)`
- `shiprocket_shipment_id TEXT`
- `tracking_number TEXT`
- `tracking_url TEXT`
- `created_at`, `updated_at`, `paid_at`, `cancelled_at`

Constraint: `total_paise = subtotal_paise - discount_paise + shipping_paise`.

### order_items

- `id UUID PRIMARY KEY`
- `order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE`
- `product_id UUID REFERENCES products(id)`
- `variant_id UUID REFERENCES product_variants(id)`
- `product_name_snapshot TEXT NOT NULL`
- `variant_name_snapshot TEXT NOT NULL`
- `sku_snapshot TEXT NOT NULL`
- `device_name_snapshot TEXT`
- `colour_snapshot TEXT`
- `quantity INTEGER NOT NULL CHECK (quantity > 0)`
- `unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0)`
- `line_total_paise INTEGER NOT NULL CHECK (line_total_paise >= 0)`
- Unique constraint: `(order_id, variant_id)`

## Payment and Webhooks

### payments

- `id UUID PRIMARY KEY`
- `order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE`
- `provider TEXT NOT NULL DEFAULT 'razorpay'`
- `provider_order_id TEXT UNIQUE`
- `provider_payment_id TEXT UNIQUE`
- `provider_signature TEXT`
- `amount_paise INTEGER NOT NULL`
- `currency TEXT NOT NULL DEFAULT 'INR'`
- `status TEXT NOT NULL CHECK (status IN ('created','authorized','captured','failed','refunded','partially_refunded'))`
- `method TEXT`
- `failure_reason TEXT`
- `captured_at`, `created_at`, `updated_at`

### webhook_events

- `id UUID PRIMARY KEY`
- `provider TEXT NOT NULL DEFAULT 'razorpay'`
- `event_id TEXT NOT NULL UNIQUE`
- `event_type TEXT NOT NULL`
- `payload JSONB NOT NULL`
- `signature_valid BOOLEAN NOT NULL`
- `processed_at TIMESTAMPTZ`
- `processing_error TEXT`
- `received_at TIMESTAMPTZ NOT NULL DEFAULT now()`

## Reviews

### reviews

- `id UUID PRIMARY KEY`
- `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE`
- `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `order_item_id UUID REFERENCES order_items(id)`
- `rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)`
- `title TEXT`
- `body TEXT`
- `status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected'))`
- `created_at`, `updated_at`

## Storefront Content

### banners

- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `subtitle TEXT`
- `image_path TEXT NOT NULL`
- `href TEXT`
- `position INTEGER NOT NULL DEFAULT 0`
- `starts_at`, `ends_at`
- `is_active BOOLEAN NOT NULL DEFAULT true`

### shipping_settings

- `id UUID PRIMARY KEY`
- `free_shipping_threshold_paise INTEGER NOT NULL DEFAULT 0`
- `flat_shipping_paise INTEGER NOT NULL DEFAULT 0`
- `cod_enabled BOOLEAN NOT NULL DEFAULT false`
- `cod_limit_paise INTEGER`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

## Recommended Indexes

- `products(slug, is_active)`
- `products(category_id, is_active)`
- `products(is_bestseller, is_active)`
- `products(is_featured, is_active)`
- `products(is_new_arrival, is_active)`
- `product_variants(product_id, is_active)`
- `product_variants(device_id, is_active)`
- `orders(order_number)`
- `orders(user_id, created_at DESC)`
- `orders(status, created_at DESC)`
- `payments(provider_order_id)`
- `payments(provider_payment_id)`
- `webhook_events(event_id, event_type)`
- `reviews(product_id, status)`

## Transactional Rules

Use database functions or server transactions for:

1. Reserving inventory during checkout.
2. Releasing inventory on failed/cancelled orders when reservation is used.
3. Deducting stock after a successful captured payment or confirmed COD order.
4. Applying coupons atomically.
5. Updating webhook events and order status idempotently.
6. Generating unique order numbers.

## RLS Summary

- Public can read only active products, images, compatibility, variants and active storefront content.
- Public cannot modify catalog, inventory, orders, payment or webhook records.
- Customers can read/update their own profile and addresses.
- Customers can read only their own carts and wishlists.
- Customers can read only their own orders and order items.
- Admin roles can manage catalog and operational records.
- Webhook and payment mutations must use the Supabase service role only inside server-side handlers.

## Migration Strategy

- Store SQL migrations under `supabase/migrations`.
- Never include credentials or secrets in migrations.
- Create initial schema and RLS policies in separate migration files.
- Seed only development/test data.
- Maintain a migration rollback or forward-fix procedure.
