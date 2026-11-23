import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Cases for ${slug.replaceAll("-", " ")}` };
}

export default async function DevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = slug.replaceAll("-", " ");

  return (
    <>
      <Header />
      <main className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose your exact model</p>
            <h2 style={{ textTransform: "capitalize" }}>{name}</h2>
          </div>
          <Link href="/collections/all">All products</Link>
        </div>
        <div className="benefit-grid">
          <article>
            <b>01</b>
            <h3>Pro / Plus / Ultra</h3>
            <p>
              Select the exact supported model during product configuration.
            </p>
          </article>
          <article>
            <b>02</b>
            <h3>Colour options</h3>
            <p>Original finishes selected for the GHYAMAJHA catalogue.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Fit guarantee</h3>
            <p>Compatibility is validated before purchase.</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
