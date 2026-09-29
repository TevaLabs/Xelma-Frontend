import type { Meta, StoryObj } from '@storybook/react';
import { PanelHeader } from '@/components/ui/PanelHeader';

const meta = {
  title: 'Components/PanelHeader',
  component: PanelHeader,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'hero'],
    },
    status: {
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof PanelHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Panel',
    subtitle: 'Subtitle text goes here',
    action: 'View all',
  },
};

export const WithStatus: Story = {
  args: {
    title: 'With Status',
    status: {
      label: 'Status',
      value: 'Active',
      variant: 'success',
    },
  },
};

export const HeroVariant: Story = {
  args: {
    variant: 'hero',
    title: 'Hero Panel',
    subtitle: 'Detailed description of the hero content',
    actions: ['Action 1', 'Action 2', 'Action 3'],
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: 'Multiple Actions',
    actions: ['Primary', 'Secondary', 'Tertiary'],
  },
};
