/* NavigationView — 火山 Demo 风格外观 + JadeView 示例打磨过的指示条逻辑:
 * 指示条 getBoundingClientRect 相对 nav 定位(色条高 = 项高-16,中线对齐);
 * 折叠动画 transitionend 后重定位;ResizeObserver 兜底;受控 value。 */
import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import {
  ChevronDownRegular,
  PanelLeftRegular,
} from '@fluent-jade/icon';

export interface NavItemDef {
  key: string;
  label: string;
  icon?: ReactNode;
  /** 徽标内容(数字/点) */
  badge?: ReactNode;
  /** 禁用项 */
  disabled?: boolean;
  /** true 时排到底部区(nav-bottom) */
  bottom?: boolean;
  /** 子项;提供即为可展开/折叠的子菜单 */
  children?: NavItemDef[];
}

/** 分组标题行(不可交互;折叠时淡出) */
export interface NavHeaderDef { header: string }
export type NavEntry = NavItemDef | NavHeaderDef;

const isHeader = (e: NavEntry): e is NavHeaderDef => 'header' in e;

type Dir = 'up' | 'down' | null;

interface FlyoutState {
  key: string;
  rect: DOMRect;
  items: NavItemDef[];
}

export interface NavViewProps {
  items: NavEntry[];
  value: string;
  onChange: (key: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 汉堡下方、列表上方的固定插槽(如搜索框);折叠时隐藏 */
  header?: ReactNode;
  className?: string;
}

function findParentSubmenu(items: NavEntry[], value: string | undefined): NavItemDef | undefined {
  if (!value) return undefined;
  for (const it of items) {
    if (!isHeader(it) && it.children?.some((c) => c.key === value)) return it;
  }
  return undefined;
}

function flattenVisible(items: NavEntry[], expanded: Set<string>, collapsed: boolean): string[] {
  const out: string[] = [];
  for (const it of items) {
    if (isHeader(it)) continue;
    out.push(it.key);
    if (!collapsed && it.children && expanded.has(it.key)) {
      out.push(...it.children.map((c) => c.key));
    }
  }
  return out;
}

export function NavView({ items, value, onChange, collapsed, onCollapsedChange, header, className }: NavViewProps) {
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const parent = findParentSubmenu(items, value);
    return parent ? new Set([parent.key]) : new Set();
  });
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const parent = findParentSubmenu(items, value);
    if (parent) setExpanded((prev) => new Set(prev).add(parent.key));
  }, [items, value]);

  const isCollapsed = !!collapsed;
  const indicatorTarget = useMemo(() => {
    const parent = findParentSubmenu(items, value);
    if (!parent) return value;
    return isCollapsed || !expanded.has(parent.key) ? parent.key : value;
  }, [items, value, expanded, isCollapsed]);

  const visibleOrder = useMemo(
    () => flattenVisible(items, expanded, isCollapsed),
    [items, expanded, isCollapsed],
  );

  const prevTargetRef = useRef<string>(indicatorTarget);
  const [selectionDirection, setSelectionDirection] = useState<Dir>(null);

  useLayoutEffect(() => {
    const prev = prevTargetRef.current;
    const curr = indicatorTarget;
    if (prev !== curr) {
      const iPrev = visibleOrder.indexOf(prev);
      const iCurr = visibleOrder.indexOf(curr);
      setSelectionDirection(
        iCurr > iPrev ? 'down' : iCurr < iPrev ? 'up' : null,
      );
      prevTargetRef.current = curr;
    }
  }, [indicatorTarget, visibleOrder]);

  const updateScrollHint = useCallback(() => {
    const nav = navRef.current?.querySelector<HTMLElement>('.nav-top');
    if (!nav) return;
    setCanScrollDown(nav.scrollTop + nav.clientHeight < nav.scrollHeight - 1);
  }, []);

  /* 展开/收起动画期间指示条跟随:rAF 循环跟踪 active 项位置,
     直到 CSS grid-rows 动画结束(transitionend)或超时兜底 */
  const prevExpanded = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (prevExpanded.current === expanded) return;   // 首次或 Set 未变时不跑
    prevExpanded.current = expanded;
    const nav = navRef.current;
    if (!nav) return;

    let raf = 0;
    let lastY = -1;
    const follow = () => {
      const item = nav.querySelector<HTMLElement>('.nav-item.active');
      if (item) {
        const r = item.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const y = r.top - navRect.top;
        if (Math.abs(y - lastY) > 0.5) {
          lastY = y;
          updateScrollHint();
        }
      }
      raf = requestAnimationFrame(follow);
    };
    follow();

    const stop = () => { cancelAnimationFrame(raf); updateScrollHint(); };
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'grid-template-rows') stop();
    };
    nav.addEventListener('transitionend', onEnd);
    const timer = setTimeout(stop, 220);   // 动画 180ms + 余量

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      nav.removeEventListener('transitionend', onEnd);
    };
  }, [expanded, updateScrollHint]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(() => { updateScrollHint(); });
    ro.observe(nav);
    const onEnd = (e: TransitionEvent) => { if (e.propertyName === 'width') updateScrollHint(); };
    nav.addEventListener('transitionend', onEnd);
    const onScroll = () => { updateScrollHint(); };
    nav.addEventListener('scroll', onScroll, { capture: true, passive: true });
    updateScrollHint();
    return () => {
      ro.disconnect();
      nav.removeEventListener('transitionend', onEnd);
      nav.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [updateScrollHint]);

  const handleItemChange = useCallback((key: string) => {
    const item = items.find((it) => !isHeader(it) && it.key === key) as NavItemDef | undefined
      ?? items.flatMap((it) => (!isHeader(it) && it.children ? it.children : [])).find((c) => c.key === key);
    if (item?.disabled) return;
    setFlyout(null);
    if (key !== value) onChange(key);
  }, [items, value, onChange]);

  const toggleSubmenu = useCallback((item: NavItemDef) => {
    if (item.disabled) return;
    if (isCollapsed) {
      const trigger = triggerRefs.current.get(item.key);
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setFlyout((cur) =>
        cur?.key === item.key ? null : { key: item.key, rect, items: item.children ?? [] },
      );
      return;
    }
    setFlyout(null);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  }, [isCollapsed]);

  const renderItem = (it: NavItemDef, depth = 0) => {
    const active = indicatorTarget === it.key;
    const hasChildren = !!it.children?.length;
    const isExpanded = expanded.has(it.key);
    const isFlyoutOpen = flyout?.key === it.key;

    const trigger = (
      <button
        ref={(node) => {
          if (node) triggerRefs.current.set(it.key, node);
          else triggerRefs.current.delete(it.key);
        }}
        className={cn(
          'nav-item',
          active && 'active',
          active && selectionDirection && `indicator-${selectionDirection}`,
          it.disabled && 'disabled',
          hasChildren && 'nav-submenu-trigger',
          depth > 0 && 'nav-subitem',
        )}
        role='tab'
        aria-selected={active}
        aria-disabled={it.disabled}
        aria-expanded={hasChildren ? (isCollapsed ? isFlyoutOpen : isExpanded) : undefined}
        title={it.label}
        style={depth > 0 ? { paddingLeft: `calc(var(--sp-m) + ${depth * 20}px)` } : undefined}
        onClick={() => {
          if (hasChildren) toggleSubmenu(it);
          else handleItemChange(it.key);
        }}
      >
        {(it.icon || isCollapsed) && (
          <span className='nav-icon'>
            {it.icon}
            {isCollapsed && it.badge != null && <span className='nav-badge-dot' aria-hidden />}
          </span>
        )}
        {!isCollapsed && (
          <>
            <span className='label'>{it.label}</span>
            {it.badge != null && <span className='nav-badge'>{it.badge}</span>}
            {hasChildren && (
              <ChevronDownRegular
                size={12}
                className={cn('nav-submenu-chev', isExpanded && 'expanded')}
              />
            )}
          </>
        )}
      </button>
    );

    const wrapped = isCollapsed && depth === 0 ? (
      <span className='nav-tooltip-trigger' title={it.label} key={it.key}>
        {trigger}
      </span>
    ) : trigger;

    if (!hasChildren || isCollapsed) return wrapped;

    return (
      <div key={it.key} className='nav-submenu'>
        {wrapped}
        <div className={cn('nav-submenu-content', isExpanded && 'expanded')}>
          <div className='nav-submenu-inner'>
            {it.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav ref={navRef} className={cn('nav', className)} role='tablist' aria-orientation='vertical'
         {...(isCollapsed ? { 'data-collapsed': '' } : {})}>
      {onCollapsedChange && (
        <button className='nav-item nav-hamburger' title='展开/收缩导航' aria-label='展开或收缩导航'
                onClick={() => onCollapsedChange(!collapsed)}>
          <PanelLeftRegular />
          <span className='label'>导航</span>
        </button>
      )}
      {header != null && <div className='nav-slot'>{header}</div>}
      <div className={cn('nav-top', canScrollDown && 'nav-fade-bottom')}>
        {items.filter((i) => isHeader(i) || !i.bottom).map((it, idx) =>
          isHeader(it) ? (
            !isCollapsed && <div key={`h-${idx}`} className='nav-header'>{it.header}</div>
          ) : (
            renderItem(it)
          ),
        )}
      </div>
      <div className='nav-bottom'>
        {items.filter((i) => !isHeader(i) && i.bottom).map((it) => renderItem(it as NavItemDef))}
      </div>

      {isCollapsed && flyout && (
        <NavFlyout
          state={flyout}
          activeValue={value}
          onChange={handleItemChange}
          onClose={() => setFlyout(null)}
        />
      )}
    </nav>
  );
}

function NavFlyout({ state, activeValue, onChange, onClose }: {
  state: FlyoutState;
  activeValue: string;
  onChange: (key: string) => void;
  onClose: () => void;
}) {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: state.rect.right + 4,
    top: state.rect.top,
    zIndex: 1000,
  };
  return createPortal(
    <div className='nav-flyout' style={style}>
      <div className='nav-flyout-items'>
        {state.items.map((it) => (
          <button
            key={it.key}
            className={cn('nav-flyout-item', it.key === activeValue && 'active')}
            disabled={it.disabled}
            onClick={() => { onChange(it.key); onClose(); }}
          >
            {it.icon}
            <span className='label'>{it.label}</span>
            {it.badge != null && <span className='nav-badge'>{it.badge}</span>}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
