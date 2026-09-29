import React, { ReactNode } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type PanelHeaderVariant = 'default' | 'hero';

export interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode[];
  variant?: PanelHeaderVariant;
  status?: {
    label: string;
    value: string;
    variant?: 'success' | 'warning' | 'danger';
  };
  className?: string;
}

export const PanelHeader = ({
  title,
  subtitle,
  action,
  actions,
  variant = 'default',
  status,
  className,
}: PanelHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        variant === 'hero' && 'rounded-xl p-6 border border-border',
        className
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold'>{title}</h3>
          {subtitle && <p className='text-sm text-muted-foreground'>{subtitle}</p>}
        </div>

        {status && (
          <Chip
            variant='outline'
            className='ml-2'
            size='sm'
          >
            {status.label}: {status.value}
          </Chip>
        )}
      </div>

      <div className='flex items-center gap-2'>
        {action && <div className='flex-1'>{action}</div>}
        {actions && (
          <div className='flex gap-2'>
            {actions.map((action, index) => (
              <Button key={index} variant='ghost' size='sm'>
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
