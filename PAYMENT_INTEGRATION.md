# Ghyamajha Razorpay Integration Plan

Provider: Razorpay Standard Checkout
Official reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

## Environment Variables

Server-only:

```text
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Public variable:

```text
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

`NEXT_PUBLIC_RAZORPAY_KEY_ID` may expose only the public key. The key ID is also safer to return from the create-order API after server validation. Never expose secret values to client code, browser bundles or logs.

Use separate test/live values. Live credentials must be configured only in the production environment.

## Checkout Flow

### 1. Create Server-Side Pending Order

The create-order endpoint receives only customer, address and cart/variant selection data. It must:

1. Validate and sanitize customer details.
2. Validate address requirements and PIN code format.
3. Authenticate the customer if signed in or associate a guest checkout token safely.
4. Fetch variant and product records from the database.
5. Revalidate product and variant active state.
6. Revalidate compatibility with the selected device.
7. Revalidate inventory for the requested quantity.
8. Fetch the current price from the database.
9. Apply and revalidate any coupon server-side.
10. Calculate subtotal, discount, shipping and final payable amount.
11. Create or reuse one internal pending order to prevent duplicate retries.
12. Create Razorpay order with the server-calculated amount and INR currency.
13. Store the Razorpay order ID and payment records.
14. Reserve inventory transactionally when appropriate.
15. Return public key ID and Razorpay order information.

Never accept or use a frontend-submitted price, discount or shipping amount.

### 2. Open Razorpay Standard Checkout

Initialize Checkout using:

- Public key ID
- Razorpay order ID
- Server-calculated amount
- Currency
- Customer name, email and contact
- Pre-filled supported details
- Original Ghyamajha theme and brand copy

Support payment methods enabled in the merchant account, including UPI, cards, net banking and other supported methods.

### 3. Verify Frontend Response

The frontend sends:

- `razorpay_payment_id`
- `razorpay_order_id`
- `razorpay_signature`

The backend must:

1. Fetch the original internal order using the stored Razorpay order ID.
2. Recalculate the expected HMAC:
   `HMAC_SHA256(razorpay_order_id + ':' + razorpay_payment_id, RAZORPAY_KEY_SECRET)`
3. Compare signatures using a constant-time comparison implementation.
4. Reject mismatched, missing or previously consumed values.
5. Fetch the payment directly from the Razorpay API.
6. Confirm that the payment belongs to the stored Razorpay order.
7. Confirm that the payment amount matches the stored order amount.
8. Mark the order captured only after confirming a captured status.

A browser success callback is not sufficient to mark the order paid.

### 4. Payment Status and Failure

- Keep order and payment in pending/failed states until server verification succeeds.
- Use provider status `captured` as the successful payment state.
- Do not expose fake success responses.
- Failed payments remain available for retry.
- Reuse the existing internal order and Razorpay order where the provider permits safe retry logic.
- Prevent duplicate order creation for the same checkout attempt.
- Show user-safe error messages and retain a retry action.

## Webhooks

Endpoint: `/api/payments/razorpay/webhook`

Implementation requirements:

1. Read and preserve the raw request body.
2. Read `x-razorpay-signature`.
3. Calculate HMAC SHA256 with `RAZORPAY_WEBHOOK_SECRET`.
4. Perform constant-time signature comparison.
5. Reject invalid or missing signatures.
6. Store valid webhook deliveries idempotently by a provider event ID or delivery identifier.
7. Support `payment.captured`, `payment.failed` and `order.paid`.
8. Reconcile provider event payload with the database and Razorpay API.
9. Process events within a transaction or guarded idempotency mechanism.
10. Store processed time and processing errors.
11. Return success for duplicate deliveries only after safe no-op handling.

## COD

COD must be disabled until approved in admin settings.

A COD order must:

- Use server-calculated amounts.
- Revalidate inventory.
- Respect COD amount limits and shipping eligibility.
- Have payment status `pending`.
- Create an order status of `confirmed` or `pending` according to admin policy.
- Never call Razorpay.

## Refunds and Cancellations

- Only admins may initiate refunds.
- Create a provider refund through Razorpay server SDK.
- Store provider refund reference and status.
- Release inventory only when the order policy permits it.
- Prevent duplicate refunds using provider references and database status.
- Update order status and payment status only after provider/API reconciliation.

## Idempotency

Use unique constraints for:

- Razorpay order ID
- Razorpay payment ID
- Webhook event ID

Use checkout attempt IDs and database transactions to prevent duplicate order creation and stock reservation.

## Logging and Auditing

Log:

- Event type
- Internal order number
- Razorpay order/payment reference
- Signature validation success/failure
- Provider response status
- Processing result/error

Do not log secrets, full card data, signatures, CVV or unnecessary customer PII.

## Security Checklist

- [ ] All secrets server-only
- [ ] No hardcoded live credentials
- [ ] Amounts recalculated in server code
- [ ] Inventory revalidated at checkout
- [ ] Coupon recalculated server-side
- [ ] Signature checked with constant-time comparison
- [ ] Payment status fetched from Razorpay API
- [ ] Only captured payments are successful
- [ ] Raw body used for webhook validation
- [ ] Webhook event IDs are unique
- [ ] Duplicate deliveries are safe
- [ ] Payment and order mutations use transactions
- [ ] Customer data and RLS are protected
- [ ] Rate limiting is enabled on checkout and webhook routes
- [ ] Provider errors use safe customer-facing messages

## TEST Environment

Required setup:

- Razorpay Test Mode account
- Test key ID/secret
- Test webhook secret
- Test domain or preview URL
- Test UPI/cards/net banking methods enabled in account
- Supabase test database
- Playwright test data

Test scenarios:

- Captured payment
- Failed payment
- Retried payment
- Duplicate signature verification
- Duplicate webhook delivery
- Amount mismatch rejection
- Unknown provider order rejection
- COD enabled/disabled
- Stock sold out during checkout
- Coupon changed or expired during checkout
- Unauthorized/admin mutation attempts

## LIVE Environment

Before activation:

1. Configure production Supabase database.
2. Configure production Vercel variables.
3. Add live Razorpay key ID and secret.
4. Add live webhook secret.
5. Register the exact production webhook URL.
6. Run live-mode minimum-value test only if approved.
7. Confirm settlement, refund and COD configuration.
8. Verify SSL and domain ownership.
9. Enable monitoring and payment failure alerts.

Do not switch to live mode until staging tests and business approval are complete.

## Recommended API Shape

- `POST /api/checkout/create-order`
- `POST /api/payments/razorpay/verify`
- `POST /api/payments/razorpay/webhook`
- `GET /api/orders/[orderNumber]/status`
- `POST /api/orders/[orderNumber]/retry-payment`
- `POST /api/orders/[orderNumber]/cancel`

Exact routes may vary with framework conventions but the server-side trust boundaries must remain unchanged.
