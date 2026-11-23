import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartPage } from "@/components/storefront/cart-page";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export default async function CartRoute() {
  const products = await getStorefrontProducts();

  return (
    <>
      <Header />
      <CartPage allProducts={products} />
      <Footer />
    </>
  );
}
