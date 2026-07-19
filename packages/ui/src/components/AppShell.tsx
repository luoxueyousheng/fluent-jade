/* AppShell — 标题栏 + 侧导航合并的应用外壳,mode 控制形态:
 *   'multi'(默认)= 多页文档:标题栏含汉堡(展开/收缩),下方 侧导航 + 内容区;
 *   'single'      = 单页应用:仅标题栏 + 内容区,不渲染汉堡与侧导航。
 * 返回键与 mode 解耦:传 onBack 即显示。TitleBar 的宿主相关能力
 *(controls 三模式 / dragProps / maximized)原样透传,宿主不限语言。 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { useMergedState } from '../useMergedState';
import { TitleBar, type TitleBarProps } from './TitleBar';
import { NavView, type NavEntry } from './NavView';

export interface AppShellProps {
  /** 'multi' 多页(侧导航 + 汉堡)/ 'single' 单页(仅标题栏) */
  mode?: 'single' | 'multi';

  /* ---- 标题栏(透传 TitleBar) ---- */
  appName: string;
  sub?: ReactNode;
  logo?: ReactNode;
  controls?: TitleBarProps['controls'];
  hostControlsWidth?: number;
  maximized?: boolean;
  dragProps?: HTMLAttributes<HTMLElement>;
  /** 标题栏内交互元素(自动 no-drag) */
  titleBarActions?: ReactNode;
  /** 返回键:传入即显示(单页/多页均可用) */
  onBack?: () => void;
  backDisabled?: boolean;

  /* ---- 侧导航(multi 模式) ---- */
  items?: NavEntry[];
  value?: string;
  onChange?: (key: string) => void;
  /** 导航列表上方固定插槽(如搜索框) */
  navHeader?: ReactNode;
  /** 折叠态:受控 collapsed / 非受控 defaultCollapsed(汉堡驱动) */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;

  /** 内容区(自动包 .content/.content-inner 滚动容器) */
  children: ReactNode;
  className?: string;
}

export function AppShell({
  mode = 'multi',
  appName, sub, logo, controls, hostControlsWidth, maximized, dragProps,
  titleBarActions, onBack, backDisabled,
  items = [], value = '', onChange,
  navHeader, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange,
  children, className,
}: AppShellProps) {
  const multi = mode !== 'single';
  const [collapsed, setCollapsed] = useMergedState(defaultCollapsed, collapsedProp, onCollapsedChange);

  const content = (
    <main className="content">
      <div className="content-inner">{children}</div>
    </main>
  );

  return (
    <div className={cn('app', className)}>
      <TitleBar appName={appName} sub={sub} logo={logo}
                controls={controls} hostControlsWidth={hostControlsWidth}
                maximized={maximized} dragProps={dragProps}
                onBack={onBack} backDisabled={backDisabled}
                onMenu={multi ? () => setCollapsed(!collapsed) : undefined}>
        {titleBarActions}
      </TitleBar>
      {multi ? (
        <div className="shell">
          <NavView items={items} value={value} onChange={onChange ?? (() => {})}
                   collapsed={collapsed} header={navHeader} />
          {content}
        </div>
      ) : content}
    </div>
  );
}
