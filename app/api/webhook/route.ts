import { NextRequest, NextResponse } from "next/server";
 
export async function POST(req: NextRequest) {
  const body = await req.json();
  const orderId = body?.data?.id;
 
  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }
  const storeHash = "nhff37cehc";
  const accessToken = "7x177ybng0ujl4avpfueyb41nk144st";
 
  try {
    const response = await fetch(
      `https://api.bigcommerce.com/stores/$nhff37cehc/v2/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "X-Auth-Token": "7x177ybng0ujl4avpfueyb41nk144st",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );
 
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ BigCommerce API error:", errorText);
      return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
    }
 
    const fullOrder = await response.json();
    console.log("✅ FULL ORDER DETAILS:", fullOrder);
 
    return NextResponse.json({ success: true, order: fullOrder }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
 
export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint ready" });
}
 
 
 