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
 
    const orderUrl = `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`;
 
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
 
    // Helper to fetch nested URLs
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
      return await res.json();
    }
 
    // Fetch and attach related data
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
    console.error('❌ Error handling webhook:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: (err as Error).message },
      { status: 500 }
    );
  }
}
 