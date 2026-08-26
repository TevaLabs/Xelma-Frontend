import EmptyState from '../components/EmptyState';

export default { title: 'Glass Card Primitives/EmptyState' };

export const Default = () => <EmptyState />;

export const WithTitle = () => (
  <EmptyState title="No Rounds Available" description="Check back soon for new prediction rounds." />
);

export const WithIcon = () => (
  <EmptyState
    title="No Activity Yet"
    description="Your prediction history will appear here."
    icon={<span style={{ fontSize: 40 }}>📭</span>}
  />
);

export const WithAction = () => (
  <EmptyState
    title="No Predictions"
    description="You haven't submitted any predictions yet."
    icon={<span style={{ fontSize: 40 }}>🎯</span>}
    action={<button style={{ padding: '8px 16px', borderRadius: 8 }}>Make a Prediction</button>}
  />
);
