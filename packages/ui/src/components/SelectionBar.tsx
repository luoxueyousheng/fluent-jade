/* SelectionBar — 行选择状态栏:显示已选数量 + 操作按钮 + 清除。
 * 对齐 react-desktop-shell AppSelectionBar。 */
import { cn } from '../cn';
import { Button } from './Button';
import { DismissRegular } from '@fluent-jade/icon';
import type { CSSProperties, ReactNode } from 'react';

export interface SelectionBarProps {
  count: number;
  label?: ReactNode;
  actions?: ReactNode;
  onClear?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function SelectionBar({ count, label, actions, onClear, className, style }: SelectionBarProps) {
  if (count <= 0) return null;

  return (
    <div className={cn('selection-bar', className)} style={style}>
      <span className="selection-bar-label">
        {label ?? `已选 ${count} 项`}
      </span>
      {actions}
      {onClear && (
        <Button size="small" variant="subtle" iconOnly aria-label="清除选择" onClick={onClear}>
          <DismissRegular size={12} />
        </Button>
      )}
    </div>
  );
}
