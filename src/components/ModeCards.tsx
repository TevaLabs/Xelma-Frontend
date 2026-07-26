import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

/**
 * STUBBED for Stellar Wave hackathon — rebuild prediction mode cards.
 * Must link CTAs to `/dashboard` (and optionally coming-soon modes).
 * Visual language: glass-card, blue for UP/DOWN, teal for Precision.
 */
export default function ModeCards() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="modes-title">
      <h2 id="modes-title" className="text-center text-3xl font-bold text-white">
        Two Prediction Modes
      </h2>
      <ContributorTaskPlaceholder
        className="mx-auto mt-10 max-w-3xl"
        title="Rebuild Mode Cards"
        issueHint="Build UP/DOWN and Precision mode cards with feature bullets and CTAs to /dashboard. Match Landing fintech theme (glass-card, blue/teal accents)."
      />
    </section>
  );
}
