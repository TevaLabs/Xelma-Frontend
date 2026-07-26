import type { ReactNode } from 'react';

interface PanelHeaderProps {
  /** Main title displayed prominently */
  title: string;
  /** Optional subtitle rendered smaller beneath the title */
  subtitle?: string;
  /** Optional slot for action elements such as buttons or menus */
  actions?: ReactNode;
}

/**
 * Reusable panel header component used across the Xelma-Frontend UI.
 *
 * The layout mirrors the previous ad‑hoc headers:
 *   - Small screens stack title/subtitle and actions vertically (`flex-col`).
 *   - Medium screens (`sm:`) place them side‑by‑side (`flex-row`) and justify space between.
 *   - Consistent typography and spacing are applied via Tailwind utilities.
 */
export default function PanelHeader({ title, subtitle, actions }: PanelHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between gap-3">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold leading-none text-white">{title}</h2>
        {subtitle && <p className="truncate mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="self-start sm:self-auto">{actions}</div>}
    </header>
  );
}
