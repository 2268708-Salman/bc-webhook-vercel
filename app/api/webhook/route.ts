import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body?.data?.id;
 
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID not found in webhook' },
        { status: 400 }
      );
    }
 
    const storeHash = process.env.BC_STORE_HASH;
    const token = process.env.BC_API_TOKEN;
 
    const baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`;
    const headers = {
      'X-Auth-Token': token || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
 
    const orderRes = await fetch(baseUrl, { headers });
    if (!orderRes.ok) {
      throw new Error(`Main order fetch failed with ${orderRes.status}`);
    }
    const orderDetails = await orderRes.json();
 
    const endpoints = ['fees', 'products', 'consignments', 'shipping_addresses', 'coupons'];
    const subData: Record<string, unknown> = {};
 
    for (const endpoint of endpoints) {
      const res = await fetch(`${baseUrl}/${endpoint}`, { headers });
      if (res.ok) {
        subData[endpoint] = await res.json();
      }
    }
 
    const fullOrder = {
      ...orderDetails,
      ...subData,
    };
 
    console.log('✅ Full Order:', fullOrder);
 
    return NextResponse.json({
      message: 'Order processed successfully',
      fullOrder,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Error:', err.message);
    } else {
      console.error('❌ Unknown error:', err);
    }
 
    return NextResponse.json(
      { error: 'Failed to fetch full order' },
      { status: 500 }
    );
  }
}
 