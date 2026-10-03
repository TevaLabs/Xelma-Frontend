import type React from 'react';
import PanelHeader from '../components/ui/PanelHeader';

export default {
  title: 'Glass Card Primitives/PanelHeader',
  decorators: [
    (Story: React.FC) => (
      <div
        style={{
          background: '#0A0F1A',
          padding: '24px',
          minHeight: '200px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const TitleOnly = () => (
  <PanelHeader title="Market Overview" />
);

export const WithSubtitle = () => (
  <PanelHeader
    title="Active Rounds"
    subtitle="Live prediction markets"
  />
);

export const WithActions = () => (
  <PanelHeader
    title="Leaderboard"
    subtitle="Top traders this week"
    action={
      <button
        type="button"
        style={{
          padding: '6px 12px',
          borderRadius: 8,
        }}
      >
        View All
      </button>
    }
  />
);

export const WithStatus = () => (
  <PanelHeader
    title="Live Predictions"
    subtitle="Realtime prediction feed"
    status={{
      label: 'Live',
      variant: 'success',
    }}
  />
);

export const WithStatusAndAction = () => (
  <PanelHeader
    title="Network Status"
    status={{
      label: 'Connected',
      variant: 'success',
    }}
    action={
      <button
        type="button"
        style={{
          padding: '6px 12px',
          borderRadius: 8,
        }}
      >
        Refresh
      </button>
    }
  />
);

export const HeroVariant = () => (
  <PanelHeader
    title="Predict With Confidence"
    subtitle="Follow live Stellar prediction markets."
    variant="hero"
    action={
      <button
        type="button"
        style={{
          padding: '8px 16px',
          borderRadius: 8,
        }}
      >
        Start Predicting
      </button>
    }
  />
);

export const LongTitle = () => (
  <PanelHeader
    title="Recent Prediction History & Analytics"
    subtitle="Your last 30 days of activity"
  />
);
