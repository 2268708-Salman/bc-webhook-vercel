import { NextRequest, NextResponse } from 'next/server';
 
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
 
    console.log('🔔 Webhook received:', body);
    return NextResponse.json({ success: true, message: 'Order received' });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }
}
 