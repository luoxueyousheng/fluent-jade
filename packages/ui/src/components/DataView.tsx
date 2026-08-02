/* DataView — 数据视图布局:toolbar / body / footer。
 * 对齐 react-desktop-shell AppDataView:头部可选工具条/选择栏,主体可滚动,
 * 底部可选页脚;高度 auto(内容决定) / fill(占满父级)。 */
import { cn } from '../cn';
import type { CSSProperties, ReactNode } from 'react';

export interface DataViewProps {
  height?: 'auto' | 'fill';
  toolbar?: ReactNode;
  selectionBar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function DataView({
  height = 'auto',
  toolbar,
  selectionBar,
  footer,
  children,
  className,
  style,
}: DataViewProps) {
  const header = selectionBar ?? toolbar;

  return (
    <div
      className={cn('data-view', `data-view--${height}`, className)}
      style={style}
    >
      {header != null ? <div className="data-view-header">{header}</div> : null}
      <div className="data-view-body">{children}</div>
      {footer != null ? <div className="data-view-footer">{footer}</div> : null}
    </div>
  );
}
