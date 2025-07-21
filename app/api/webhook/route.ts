import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body?.data?.id;
 
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID not found in webhook' }, { status: 400 });
    }
 
    const storeHash = process.env.BC_STORE_HASH;
    const token = process.env.BC_API_TOKEN;
 
    if (!storeHash || !token) {
      return NextResponse.json({ error: 'Missing BigCommerce credentials' }, { status: 500 });
    }
 
    const headers = {
      'X-Auth-Token': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
 
    const baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`;
 
    // Get main order details
    const res = await fetch(baseUrl, { headers });
    if (!res.ok) {
      throw new Error(`BigCommerce API returned ${res.status}`);
    }
    const orderDetails = await res.json();
 
    // Additional endpoints to fetch details from
    const endpoints = ['fees', 'products', 'consignments', 'shipping_addresses', 'coupons'];
 
    const subData: Record<string, any> = {};
 
    for (const endpoint of endpoints) {
      const res = await fetch(`${baseUrl}/${endpoint}`, { headers });
 
      if (res.ok) {
        const text = await res.text();
 
        if (text) {
          subData[endpoint] = JSON.parse(text);
        } else {
          subData[endpoint] = null;
        }
      } else {
        subData[endpoint] = `Error ${res.status}`;
      }
    }
 
    const fullOrderData = {
      ...orderDetails,
      ...subData,
    };
 
    console.log('✅ Full Order:', fullOrderData);
 
    return NextResponse.json({ message: 'Order processed', fullOrderData });
  } catch (err: any) {
    console.error('❌ Failed to process order:', err.message);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
 