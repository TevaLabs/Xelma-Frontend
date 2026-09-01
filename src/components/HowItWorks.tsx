import { Wallet, Coins, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from './ui/GlassCard';

export interface StepItem {
  id: string;
  stepNumber: string;
  titleKey: string;
  titleDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  accent: 'blue' | 'teal';
}

const STEPS: StepItem[] = [
  {
    id: 'connect-freighter',
    stepNumber: '01',
    titleKey: 'landing.howItWorksSection.step1.title',
    titleDefault: 'Connect Freighter',
    descriptionKey: 'landing.howItWorksSection.step1.description',
    descriptionDefault:
      'Link your Stellar Freighter wallet to access testnet predictions securely.',
    icon: Wallet,
    accent: 'blue',
  },
  {
    id: 'practice-vxlm',
    stepNumber: '02',
    titleKey: 'landing.howItWorksSection.step2.title',
    titleDefault: 'Practice vXLM',
    descriptionKey: 'landing.howItWorksSection.step2.description',
    descriptionDefault:
      'Receive 1,000 practice vXLM automatically to explore predictions risk-free.',
    icon: Coins,
    accent: 'teal',
  },
  {
    id: 'submit-prediction',
    stepNumber: '03',
    titleKey: 'landing.howItWorksSection.step3.title',
    titleDefault: 'Submit Prediction',
    descriptionKey: 'landing.howItWorksSection.step3.description',
    descriptionDefault:
      'Choose Directional or Precision mode and lock in your price forecast on-chain.',
    icon: TrendingUp,
    accent: 'blue',
  },
];

const ACCENT_STYLES = {
  blue: {
    borderGlow: 'border-xelma-blue/30 hover:border-xelma-blue/50',
    glow: 'shadow-[0_0_24px_rgba(44,75,253,0.10)]',
    badge: 'bg-xelma-blue/10 text-xelma-blue border-xelma-blue/20',
    iconBg: 'bg-xelma-blue/10 text-xelma-blue',
    topBar: 'from-xelma-blue to-xelma-blue/60',
  },
  teal: {
    borderGlow: 'border-xelma-teal/30 hover:border-xelma-teal/50',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.10)]',
    badge: 'bg-xelma-teal/10 text-xelma-teal border-xelma-teal/20',
    iconBg: 'bg-xelma-teal/10 text-xelma-teal',
    topBar: 'from-xelma-teal to-xelma-teal/60',
  },
} as const;

/**
 * Polished 3-step onboarding section for the Landing page.
 * Displays Connect Freighter → Practice vXLM → Submit Prediction.
 */
export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="how-it-works-title">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="how-it-works-title"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {t('landing.howItWorksSection.title', 'How It Works')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-400 sm:text-lg">
            {t(
              'landing.howItWorksSection.subtitle',
              'Start predicting market trends on Stellar in three simple steps.'
            )}
          </p>
        </div>

        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const styles = ACCENT_STYLES[step.accent];

            return (
              <GlassCard
                as="article"
                key={step.id}
                className={`group relative flex flex-col rounded-2xl p-6 transition-all duration-300 sm:p-8 ${styles.borderGlow} ${styles.glow}`}
              >
                {/* Accent top gradient line */}
                <div
                  aria-hidden="true"
                  className={`absolute -inset-x-px -top-px h-1 rounded-t-2xl bg-gradient-to-r ${styles.topBar}`}
                />

                {/* Header row with icon and step badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${styles.badge}`}
                  >
                    {step.stepNumber}
                  </span>
                </div>

                {/* Step content */}
                <h3 className="mt-6 text-xl font-bold text-white">
                  {t(step.titleKey, step.titleDefault)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {t(step.descriptionKey, step.descriptionDefault)}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

