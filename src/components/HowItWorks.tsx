import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

/**
 * STUBBED for Stellar Wave hackathon — rebuild this landing section.
 * Keep the section landmark (`aria-labelledby="how-it-works-title"`) and
 * three clear steps (Connect wallet → Practice vXLM → Submit prediction).
 * Prefer lucide/SVG icons over emoji. Match glass-card + brand tokens.
 */
export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="how-it-works-title">
      <h2
        id="how-it-works-title"
        className="text-center text-3xl font-bold text-white sm:text-4xl"
      >
        How It Works
      </h2>
      <ContributorTaskPlaceholder
        className="mx-auto mt-10 max-w-3xl"
        title="Rebuild How It Works steps"
        issueHint="Replace this placeholder with a 3-step glass-card grid explaining Freighter connect, practice vXLM, and on-chain prediction. Use brand icons — no emoji."
      />
    </section>
  );
}
