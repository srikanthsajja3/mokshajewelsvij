import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { record } = await req.json()
    console.log(`Processing order confirmation for: ${record.id}`);

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch full order details including user email and items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name),
        auth_user:user_id (email),
        order_items (
          quantity,
          price_at_purchase,
          product:products (name)
        )
      `)
      .eq('id', record.id)
      .single()

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`)
    }

    const customerEmail = (order.auth_user as any)?.email;
    const customerName = (order.profiles as any)?.full_name || 'Valued Customer';
    
    if (!customerEmail) {
      throw new Error("Customer email missing from order record.")
    }

    // 2. Prepare Email HTML (Branded for Moksha Jewels)
    const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price_at_purchase.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: auto; border: 1px solid #d4af37; padding: 40px; color: #291c0e; background-color: #fff;">
        <h1 style="text-align: center; color: #d4af37; letter-spacing: 4px; text-transform: uppercase;">Moksha Jewels</h1>
        <p style="text-align: center; font-style: italic; color: #888; margin-bottom: 40px;">Timeless Artistry & Eternal Elegance</p>
        
        <p>Dear ${customerName},</p>
        <p>Thank you for choosing Moksha Jewels. We are pleased to confirm that your order for a luxury masterpiece has been received and is being processed with the utmost care.</p>
        
        <div style="background-color: #fcfcfc; padding: 20px; border-radius: 4px; margin: 30px 0;">
          <h3 style="color: #d4af37; margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          
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
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #d4af37;">$${order.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <p><strong>Shipping Address:</strong><br/>
        ${order.shipping_address}<br/>
        ${order.city}, ${order.zip_code}<br/>
        ${order.shipping_country}</p>
        
        <p style="margin-top: 40px;">We will notify you as soon as your masterpiece begins its journey to you.</p>
        
        <p style="margin-top: 40px; border-top: 1px solid #d4af37; paddingTop: 20px;">
          Warm regards,<br/>
          <strong>The Moksha Jewels Team</strong><br/>
          <span style="font-size: 12px; color: #888;">Crafted for Eternity</span>
        </p>
      </div>
    `;

    // 3. Send via Resend (Requires RESEND_API_KEY to be set in Supabase Secrets)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set. Email simulation active.");
      return new Response(
        JSON.stringify({ message: "Email simulation successful", orderId: record.id }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Moksha Jewels <orders@mokshajewels.com>',
        to: [customerEmail],
        subject: `Order Confirmation - #${order.id.slice(0, 8).toUpperCase()}`,
        html: emailHtml,
      })
    });

    const responseData = await res.json();

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
