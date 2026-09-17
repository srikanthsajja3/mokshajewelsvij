import { supabase } from '../../supabase';

interface OrderEmailParams {
  orderId: string;
  customerEmail: string;
  customerName: string;
  cart: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  cartTotal: number;
  currencySymbol?: string;
  shippingDetails: {
    address: string;
    city: string;
    zip: string;
    country: string;
  };
}

/**
 * Sends order confirmation email via Supabase Edge Function or directly via Resend API if fallback key is configured.
 */
export async function sendOrderConfirmationEmail(params: OrderEmailParams): Promise<{ success: boolean; message?: string }> {
  const { orderId, customerEmail, customerName, cart, cartTotal, currencySymbol = '$', shippingDetails } = params;

  // 1. Try Supabase Edge Function first
  try {
    console.log('[EmailService] Attempting Supabase Edge Function order-confirmation...');
    const { data, error } = await supabase.functions.invoke('order-confirmation', {
      body: { record: { id: orderId, status: 'paid' } }
    });

    if (!error && data?.success) {
      console.log('[EmailService] Edge Function email sent successfully.');
      return { success: true, message: 'Edge Function email sent.' };
    } else if (error) {
      console.warn('[EmailService] Edge function invoke notice/error:', error.message || error);
    }
  } catch (err: any) {
    console.warn('[EmailService] Edge function call exception:', err?.message || err);
  }

  // 2. Fallback to direct Resend API call if EXPO_PUBLIC_RESEND_API_KEY is configured
  const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;

  if (!resendApiKey || resendApiKey.includes('...')) {
    console.log('[EmailService] No active EXPO_PUBLIC_RESEND_API_KEY provided in .env');
    return { success: false, message: 'Resend API key missing or masked.' };
  }

  try {
    console.log('[EmailService] Sending email directly via Resend API to:', customerEmail);
    const shortId = orderId.slice(0, 8).toUpperCase();

    const itemsHtml = cart.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: auto; border: 1px solid #d4af37; padding: 40px; color: #291c0e; background-color: #fff;">
        <h1 style="text-align: center; color: #d4af37; letter-spacing: 4px; text-transform: uppercase;">Moksha Jewels</h1>
        <p style="text-align: center; font-style: italic; color: #888; margin-bottom: 40px;">Timeless Artistry & Eternal Elegance</p>
        
        <p>Dear ${customerName || 'Valued Customer'},</p>
        <h2 style="color: #d4af37;">Order Confirmed</h2>
        <p>Thank you for choosing Moksha Jewels. We are pleased to confirm that your order for a luxury masterpiece has been received and is being processed with the utmost care.</p>
        
        <div style="background-color: #fcfcfc; padding: 20px; border-radius: 4px; margin: 30px 0;">
          <h3 style="color: #d4af37; margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> #${shortId}</p>
          <p><strong>Status:</strong> Paid</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #d4af37;">${currencySymbol}${cartTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <p><strong>Shipping Address:</strong><br/>
        ${shippingDetails.address}<br/>
        ${shippingDetails.city}, ${shippingDetails.zip}<br/>
        ${shippingDetails.country}</p>
        
        <p style="margin-top: 40px;">We will notify you as soon as your masterpiece progresses further in its journey.</p>
        
        <p style="margin-top: 40px; border-top: 1px solid #d4af37; padding-top: 20px;">
          Warm regards,<br/>
          <strong>The Moksha Jewels Team</strong><br/>
          <span style="font-size: 12px; color: #888;">Crafted for Eternity</span>
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Moksha Jewels <onboarding@resend.dev>',
        to: [customerEmail],
        subject: `Order Confirmation - #${shortId}`,
        html: emailHtml,
      })
    });

    const responseData = await res.json();
    if (res.ok) {
      console.log('[EmailService] Direct Resend email sent successfully:', responseData);
      return { success: true, message: 'Direct Resend email sent.' };
    } else {
      console.error('[EmailService] Resend API error:', responseData);
      return { success: false, message: responseData.message || 'Resend API error' };
    }
  } catch (err: any) {
    console.error('[EmailService] Failed to send email via Resend:', err?.message || err);
    return { success: false, message: err?.message };
  }
}
