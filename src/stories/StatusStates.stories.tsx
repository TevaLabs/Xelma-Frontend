import type React from 'react';
import { LoadingState, ErrorState } from '../components/ui/StatusStates';

export default {
  title: 'Glass Card Primitives/StatusStates',
  decorators: [
    (Story: React.FC) => (
      <div style={{ background: '#0A0F1A', padding: '24px', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const LoadingSpinner = () => (
  <LoadingState variant="spinner" message="Loading content..." />
);

export const LoadingSkeleton = () => (
  <LoadingState variant="skeleton" message="Loading data..." skeletonLines={3} />
);

export const ErrorDefault = () => (
  <ErrorState 
    title="Oops! Something went wrong" 
    message="Failed to load the prediction data." 
  />
);

export const ErrorWithRetry = () => (
  <ErrorState 
    title="Connection Error" 
    message="Could not connect to the server." 
    onRetry={() => console.log('Retry clicked')}
  />
);
