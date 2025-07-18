import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
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

  try {
    const res = await fetch(orderUrl, {
      headers: {
        'X-Auth-Token': token || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`BigCommerce API returned ${res.status}`);
    }

    const orderDetails = await res.json();
    console.log('✅ Order Details:', orderDetails);

    return NextResponse.json({
      message: 'Order processed',
      orderDetails,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Failed to fetch full order:', err.message);
    } else {
      console.error('❌ Unknown error occurred');
    }

    return NextResponse.json(
      { error: 'Failed to fetch full order' },
      { status: 500 }
    );
  }
}
