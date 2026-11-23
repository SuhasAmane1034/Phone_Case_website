type OrderConfirmationPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  totalPaise: number;
  paymentMethod: string;
  shippingAddress: {
    fullName?: string;
    house?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    phone?: string;
  };
};

export async function sendOrderConfirmationNotification(payload: OrderConfirmationPayload) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    items,
    totalPaise,
    paymentMethod,
    shippingAddress,
  } = payload;

  const totalFormatted = `Rs. ${(totalPaise / 100).toLocaleString("en-IN")}.00`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const contactQuery = customerEmail || customerPhone || "";
  const trackingUrl = `${siteUrl}/track-order?order=${orderNumber}&contact=${encodeURIComponent(contactQuery)}`;

  // 1. Send / Log SMS & WhatsApp Message
  const smsBody = `✨ GHYAMAJHA ORDER CONFIRMED ✨\n\nDear ${customerName},\nYour order #${orderNumber} for ${items.length} item(s) has been confirmed!\nTotal: ${totalFormatted} (${paymentMethod === "cod" ? "Cash on Delivery" : "Paid"}).\n\nTrack your order real-time:\n${trackingUrl}\n\nThank you for choosing GHYAMAJHA luxury protection.`;

  console.log(`\n======================================================`);
  console.log(`[SMS & WHATSAPP NOTIFICATION TRIGGERED]`);
  console.log(`To: ${customerPhone || "Customer Phone"}`);
  console.log(`Message:\n${smsBody}`);
  console.log(`======================================================\n`);

  // If external SMS/WhatsApp webhook or API is configured (e.g. MSG91, Twilio, Fast2SMS)
  const smsApiUrl = process.env.SMS_WEBHOOK_URL;
  if (smsApiUrl && customerPhone) {
    try {
      await fetch(smsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customerPhone,
          message: smsBody,
          orderNumber,
        }),
      });
      console.log(`[Notification] SMS dispatched via external gateway.`);
    } catch (err) {
      console.error(`[Notification] SMS dispatch error:`, err);
    }
  }

  // 2. Send / Log Luxury HTML Email
  if (customerEmail) {
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; margin: 0; padding: 20px; color: #171717; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E5E5E5; overflow: hidden; }
            .header { background: #171717; padding: 32px 24px; text-align: center; color: #ffffff; }
            .brand { font-size: 22px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; }
            .content { padding: 32px 28px; }
            .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 4px 12px; rounded: 9999px; }
            .order-title { font-size: 24px; font-weight: 800; margin: 12px 0 4px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            .items-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; border-bottom: 1px solid #E5E5E5; padding-bottom: 8px; }
            .items-table td { padding: 12px 0; border-bottom: 1px solid #F5F5F5; font-size: 14px; }
            .total-row { font-size: 16px; font-weight: 800; }
            .button { display: block; text-align: center; background: #171717; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 24px; border-radius: 12px; margin-top: 28px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #737373; background: #FAFAFA; border-top: 1px solid #E5E5E5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="brand">GHYAMAJHA</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #D4AF37; letter-spacing: 0.15em; text-transform: uppercase;">Luxury Device Protection</p>
            </div>
            <div class="content">
              <span class="badge">Order Confirmed</span>
              <h2 class="order-title">Thank You, ${customerName}</h2>
              <p style="font-size: 14px; color: #525252; margin: 0 0 20px;">
                Your order <strong>#${orderNumber}</strong> has been received and scheduled for handcrafted inspection and packing.
              </p>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${items
                    .map(
                      (item) => `
                    <tr>
                      <td>
                        <strong>${item.name}</strong>
                        ${item.variant ? `<br><small style="color: #737373;">${item.variant}</small>` : ""}
                      </td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}.00</td>
                    </tr>
                  `
                    )
                    .join("")}
                  <tr>
                    <td colspan="2" class="total-row" style="padding-top: 16px;">Total Amount:</td>
                    <td class="total-row" style="text-align: right; padding-top: 16px;">${totalFormatted}</td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 24px; background: #F9FAFB; padding: 16px; border-radius: 10px; font-size: 13px;">
                <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: #525252;">Shipping Destination:</strong>
                <p style="margin: 6px 0 0; color: #171717;">
                  ${shippingAddress.fullName || customerName}<br>
                  ${shippingAddress.house ? `${shippingAddress.house}, ` : ""}${shippingAddress.street || ""}<br>
                  ${shippingAddress.city || ""}, ${shippingAddress.state || ""} ${shippingAddress.pinCode ? `— ${shippingAddress.pinCode}` : ""}<br>
                  Phone: ${shippingAddress.phone || customerPhone || "—"}
                </p>
              </div>

              <a href="${trackingUrl}" class="button">Track Your Order Live →</a>
            </div>
            <div class="footer">
              <p style="margin: 0;">GHYAMAJHA Concierge • Precision-Fit Phone Cases & Sapphire Screen Protection</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`\n======================================================`);
    console.log(`[ORDER CONFIRMATION EMAIL GENERATED]`);
    console.log(`To: ${customerEmail}`);
    console.log(`Subject: Your GHYAMAJHA Order #${orderNumber} is Confirmed`);
    console.log(`Tracking Link: ${trackingUrl}`);
    console.log(`======================================================\n`);

    // Resend API Integration if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "GHYAMAJHA <orders@ghyamajha.com>",
            to: [customerEmail],
            subject: `Order Confirmed: #${orderNumber} — GHYAMAJHA`,
            html: htmlEmail,
          }),
        });
        console.log(`[Notification] Order email sent successfully via Resend.`);
      } catch (err) {
        console.error(`[Notification] Resend API error:`, err);
      }
    }
  }

  return { success: true, trackingUrl, smsBody };
}
