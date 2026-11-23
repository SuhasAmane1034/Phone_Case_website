"use client";

import { useEffect, useState } from "react";

export function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const items = JSON.parse(
          localStorage.getItem("ghyamajha-cart") ?? "[]",
        ) as Array<{ quantity: number }>;
        setCount(items.reduce((total, item) => total + item.quantity, 0));
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("ghyamajha-cart-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("ghyamajha-cart-updated", read);
    };
  }, []);

  return (
    <b key={count} aria-live="polite">
      {count}
    </b>
  );
}
