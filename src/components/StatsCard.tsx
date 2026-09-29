import React from 'react';
import { PanelHeader } from '@/components/ui/PanelHeader';

interface StatsCardProps {
  title: string;
  value: string;
  status?: {
    label: string;
    value: string;
    variant?: 'success' | 'warning' | 'danger';
  };
}

export const StatsCard = ({ title, value, status }: StatsCardProps) => {
  return (
    <div className='p-4 border rounded-lg'>
      <PanelHeader
        title={title}
        action={
          <button className='text-sm text-primary hover:underline'>
            View details
          </button>
        }
      />
      <div className='mt-2'>
        <h4 className='text-2xl font-bold'>{value}</h4>
        {status && (
          <div className='mt-1 flex items-center gap-1'>
            <span className='text-xs'>{status.label}:</span>
            <span className='text-xs font-medium'>{status.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
