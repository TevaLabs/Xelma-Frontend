import type React from 'react';
import StatusChip from '../components/hud/StatusChip';

export default {
  title: 'Glass Card Primitives/StatusChip',
  decorators: [
    (Story: React.FC) => (
      <div style={{ background: '#0A0F1A', padding: '24px', minHeight: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Active = () => <StatusChip label="Active" status="active" value="Online" />;
export const Loading = () => <StatusChip label="Loading" status="loading" />;
export const Error = () => <StatusChip label="Error" status="error" value="Failed" />;
export const Warning = () => <StatusChip label="Warning" status="warning" value="Degraded" />;
export const Inactive = () => <StatusChip label="Inactive" status="inactive" />;
export const Info = () => <StatusChip label="Info" status="info" value="Round #42" />;
