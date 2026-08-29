import type React from 'react';
import RoundCard from '../components/RoundCard';
import type { MockRound } from '../types';

export default {
  title: 'Glass Card Primitives/RoundCard',
  decorators: [
    (Story: React.FC) => (
      <div style={{ background: '#0A0F1A', padding: '24px', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

const updownRound: MockRound = {
  id: 1,
  asset: 'BTC',
  mode: 'updown',
  status: 'live',
  startPrice: 67420,
  poolUp: 2800,
  poolDown: 1400,
  closesInSeconds: 194,
};

const precisionRound: MockRound = {
  id: 2,
  asset: 'ETH',
  mode: 'precision',
  status: 'live',
  startPrice: 3241,
  totalPool: 1800,
  predictionCount: 22,
  closesInSeconds: 760,
};

const newRound: MockRound = {
  id: 3,
  asset: 'XLM',
  mode: 'updown',
  status: 'new',
  startPrice: 0.2891,
  poolUp: 200,
  poolDown: 0,
  closesInSeconds: 1200,
};

const closedRound: MockRound = {
  id: 4,
  asset: 'BTC',
  mode: 'updown',
  status: 'live',
  startPrice: 65000,
  poolUp: 500,
  poolDown: 500,
  closesInSeconds: 0,
};

const urgentRound: MockRound = {
  id: 5,
  asset: 'BTC',
  mode: 'updown',
  status: 'live',
  startPrice: 67420,
  poolUp: 2800,
  poolDown: 1400,
  closesInSeconds: 25,
};

const noop = () => {};

export const UpDown = () => <RoundCard round={updownRound} onSubmitPrediction={noop} />;
export const Precision = () => <RoundCard round={precisionRound} onSubmitPrediction={noop} />;
export const NewRound = () => <RoundCard round={newRound} onSubmitPrediction={noop} />;
export const Closed = () => <RoundCard round={closedRound} onSubmitPrediction={noop} />;
export const Urgent = () => <RoundCard round={urgentRound} onSubmitPrediction={noop} />;
