import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  // Check if content exists before parsing
  const contentLength = req.headers.get('content-length');
  if (!contentLength || parseInt(contentLength) === 0) {
    console.warn('⚠️ Webhook received with empty body');
    return NextResponse.json(
      { error: 'Empty request body' },
      { status: 400 }
    );
  }
 
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('❌ Failed to parse JSON body:', err);
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
 
  const orderId = body?.data?.id;
 
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID not found in webhook payload' },
      { status: 400 }
    );
  }
 
  const storeHash = process.env.BC_STORE_HASH;
  const token = process.env.BC_API_TOKEN;
 
const orderUrl = `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`;
 
  try {
    const res = await fetch(orderUrl, {
      headers: {
        'X-Auth-Token': token!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
 
    if (!res.ok) {
      throw new Error(`BigCommerce API returned ${res.status}`);
    }
 
    const orderDetails = await res.json();
 
    // Helper function
    async function fetchBCData(url: string | undefined) {
      if (!url) return null;
      const res = await fetch(url, {
        headers: {
          'X-Auth-Token': token!,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        console.error(`❌ Failed to fetch ${url}: ${res.status}`);
        return null;
      }
      return await res.json();
    }
 
    // Attach related data
    const [products, shippingAddresses, consignments, fees] = await Promise.all([
      fetchBCData(orderDetails.products?.url),
      fetchBCData(orderDetails.shipping_addresses?.url),
      fetchBCData(orderDetails.consignments?.url),
      fetchBCData(orderDetails.fees?.url),
    ]);
 
    orderDetails.products = products;
    orderDetails.shipping_addresses = shippingAddresses;
    orderDetails.consignments = consignments;
    orderDetails.fees = fees;
 
    console.log('✅ Full Order Details:', orderDetails);
 
    return NextResponse.json({
      message: 'Order processed',
      orderDetails,
    });
 
  } catch (err: unknown) {
    console.error('❌ Error during order fetch or processing:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: (err as Error).message },
      { status: 500 }
    );
  }
}