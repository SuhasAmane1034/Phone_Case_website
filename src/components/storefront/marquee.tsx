const phrases = [
  "GHYAMAJHA RACING DIVISION",
  "BUILT DIFFERENT",
  "PROTECT YOUR DEVICE. OWN YOUR STYLE.",
];

export function Marquee() {
  return (
    <div
      className="brand-marquee"
      role="img"
      aria-label={phrases.join(" — ")}
    >
      <div className="brand-marquee-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="brand-marquee-group" key={copy}>
            {phrases.map((phrase) => (
              <span key={phrase}>
                {phrase}
                <i>✳</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
