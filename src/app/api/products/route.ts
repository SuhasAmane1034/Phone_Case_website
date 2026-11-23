import { NextResponse } from "next/server";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getStorefrontProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Could not fetch storefront products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
