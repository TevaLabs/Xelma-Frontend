import React from 'react';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { Table } from '@/components/ui/Table';

interface LeaderboardProps {
  title: string;
  data: Array<{
    rank: number;
    name: string;
    score: number;
  }>;
}

export const Leaderboard = ({ title, data }: LeaderboardProps) => {
  return (
    <div className='space-y-4'>
      <PanelHeader
        title={title}
        variant='hero'
        actions={['Refresh', 'Export']}
      />
      <Table data={data} />
    </div>
  );
};
