import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Link className="footer-brand" href="/">
            GHYAMAJHA
          </Link>
          <p>Premium protection. Everyday performance.</p>
          <p className="footer-tagline">
            Built for your device. Designed for your drive.
          </p>
        </div>
        <div>
          <h3>The essentials</h3>
          <Link href="/track-order">Track Order</Link>
          <Link href="/info/shipping">Shipping Policy</Link>
          <Link href="/info/terms">Terms & Conditions</Link>
        </div>
        <div>
          <h3>Shop</h3>
          <Link href="/collections/all">All products</Link>
          <Link href="/collections/bestsellers">Best sellers</Link>
          <Link href="/collections/motorsport">Motorsport</Link>
          <Link href="/collections/accessories">Accessories</Link>
        </div>
        <div>
          <h3>Stay in the race</h3>
          <p>New drops and private offers, delivered occasionally.</p>
          <form className="newsletter">
            <input
              aria-label="Email address"
              type="email"
              required
              placeholder="Email address"
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 GHYAMAJHA. All rights reserved.</span>
        <div>
          <Link href="/info/privacy">Privacy</Link>
          <Link href="/info/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
