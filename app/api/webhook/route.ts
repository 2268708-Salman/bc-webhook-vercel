import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  // Safely check body before parsing
  const contentLength = req.headers.get('content-length');
  if (!contentLength || parseInt(contentLength) === 0) {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
  }
 
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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
      throw new Error(`BigCommerce order fetch failed: ${res.status}`);
    }
 
    const orderDetails = await res.json();
 
    // SAFELY fetch related URLs
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
        console.error(`Failed to fetch ${url}: ${res.status}`);
        return null;
      }
 
      const text = await res.text(); // safe parse fallback
      if (!text) return null;
 
      try {
        return JSON.parse(text);
      } catch (err) {
        console.error(`❌ JSON parse error for ${url}:`, err);
        return null;
      }
    }
 
    // Fetch related info
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
 