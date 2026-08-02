/* StatusBar — 应用底部状态栏:start / center / end 三段布局。
 * 对齐 react-desktop-shell AppStatusBar;支持静态项与可交互按钮项。 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../cn';

export interface StatusBarProps {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export interface StatusBarItemProps {
  children?: ReactNode;
  icon?: ReactNode;
  /** true = 可交互按钮,显示 hover 背景 */
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatusBar({ start, center, end, ariaLabel, className, style }: StatusBarProps) {
  return (
    <div
      aria-label={ariaLabel ?? '状态栏'}
      className={cn('status-bar', className)}
      role="status"
      style={style}
    >
      <div className="status-bar-region status-bar-start">{start}</div>
      <div className="status-bar-region status-bar-center">{center}</div>
      <div className="status-bar-region status-bar-end">{end}</div>
    </div>
  );
}

export function StatusBarItem({ children, icon, interactive, onClick, className }: StatusBarItemProps) {
  const content = (
    <>
      {icon ? <span className="status-bar-icon">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (interactive || onClick) {
    return (
      <button
        className={cn('status-bar-item interactive', className)}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <span className={cn('status-bar-item', className)}>
      {content}
    </span>
  );
}
