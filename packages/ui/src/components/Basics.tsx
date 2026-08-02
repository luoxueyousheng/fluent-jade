/* CSS 驱动的简单件:Checkbox / Radio / Switch / Progress / Ring / InfoBar /
 * Card / Expander / Badge / Skeleton / Empty。薄封装,类契约与 fluent-kit 一致。 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';
import {
  CheckmarkCircleRegular,
  CheckmarkFilled,
  CheckmarkRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  ErrorCircleRegular,
  InfoRegular,
  SubtractFilled,
  SubtractRegular,
  WarningRegular,
} from '@fluent-jade/icon';
import { colorClass, radiusClass, type Radius, type SemanticColor } from '../modifiers';

type InputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children' | 'color'>;

export interface CheckboxProps extends InputBase {
  children?: ReactNode;
  /** 半选态(视觉为横杠;不影响 checked 值,antd 惯例) */
  indeterminate?: boolean;
  /** 卡片形态:整卡可点,选中 accent 描边 + 浅充;children 为标题 */
  card?: boolean;
  /** 卡片形态的描述行(标题下方,弱化字色) */
  description?: ReactNode;
  /** 语义着色:选中态随之变色 */
  color?: SemanticColor;
}

export function Checkbox({ children, className, indeterminate, card, description, color, ...rest }: CheckboxProps) {
  return (
    <label className={cn('check', card && 'check-card', colorClass(color), className)}>
      <input type="checkbox"
             ref={(el) => { if (el) el.indeterminate = !!indeterminate; }}
             {...rest} />
      <span className="box">
        {indeterminate
          ? <SubtractFilled size={14} color="var(--text-on-accent)" />
          : <CheckmarkFilled size={14} color="var(--text-on-accent)" />}
      </span>
      {card ? (
        <span className="cc-body">
          <span className="cc-title">{children}</span>
          {description != null && <span className="cc-desc">{description}</span>}
        </span>
      ) : children}
    </label>
  );
}

export interface RadioProps extends InputBase {
  children?: ReactNode;
  /** 卡片形态:整卡可点,选中 accent 描边 + 浅充;children 为标题 */
  card?: boolean;
  /** 卡片形态的描述行 */
  description?: ReactNode;
  /** 语义着色:选中态随之变色 */
  color?: SemanticColor;
}

export function Radio({ children, className, card, description, color, ...rest }: RadioProps) {
  return (
    <label className={cn('check radio', card && 'check-card', colorClass(color), className)}>
      <input type="radio" {...rest} />
      <span className="box" />
      {card ? (
        <span className="cc-body">
          <span className="cc-title">{children}</span>
          {description != null && <span className="cc-desc">{description}</span>}
        </span>
      ) : children}
    </label>
  );
}

export interface SwitchProps extends InputBase {
  children?: ReactNode;
  /** 卡片形态:标题/描述在左、轨道钉右,选中 accent 描边 + 浅充 */
  card?: boolean;
  /** 卡片形态的描述行 */
  description?: ReactNode;
  /** 语义着色:开启态轨道随之变色 */
  color?: SemanticColor;
}

export function Switch({ children, className, card, description, color, ...rest }: SwitchProps) {
  return (
    <label className={cn('switch', card && 'check-card switch-card', colorClass(color), className)}>
      <input type="checkbox" {...rest} />
      {/* track 必须紧跟 input(input:checked + .track 相邻选择器);卡片布局用 flex order 调 */}
      <span className="track" />
      {card ? (
        <span className="cc-body">
          <span className="cc-title">{children}</span>
          {description != null && <span className="cc-desc">{description}</span>}
        </span>
      ) : children}
    </label>
  );
}

/** @deprecated 已改名 Switch(antd 惯例;且易与 ToggleButton 混淆),别名保留兼容旧代码 */
export const Toggle = Switch;

export interface ProgressBarProps {
  value?: number;
  indeterminate?: boolean;
  /** 右侧显示进度文字(antd showInfo 惯例) */
  showInfo?: boolean;
  format?: (value: number) => string;
  /** 语义着色:填充条随之变色 */
  color?: SemanticColor;
  className?: string;
}

export function ProgressBar({ value, indeterminate, showInfo, format, color, className }: ProgressBarProps) {
  const v = Math.min(100, Math.max(0, value ?? 0));
  const bar = (
    <div className={cn('progress', indeterminate && 'indeterminate', colorClass(color), !showInfo && className)}
         role="progressbar" aria-valuenow={indeterminate ? undefined : v} aria-valuemin={0} aria-valuemax={100}>
      <i style={indeterminate ? undefined : { width: `${v}%` }} />
    </div>
  );
  if (!showInfo) return bar;
  return (
    <div className={cn('progress-line', className)}>
      {bar}
      <span className="progress-info">{indeterminate ? '' : format ? format(v) : `${Math.round(v)}%`}</span>
    </div>
  );
}

export interface ProgressRingProps {
  /** 进度 0~100;缺省为不定态旋转圆环 */
  value?: number;
  /** 像素直径:不定态默认 24,确定态默认 64 */
  size?: number;
  /** 环心显示进度文字(仅确定态) */
  showInfo?: boolean;
  format?: (value: number) => string;
  /** 语义着色:圆环随之变色 */
  color?: SemanticColor;
  className?: string;
}

const RING_R = 45;                                   // viewBox 100 的半径
const RING_C = 2 * Math.PI * RING_R;

export function ProgressRing({ value, size, showInfo, format, color, className }: ProgressRingProps) {
  // 类名 progress-ring/progress-circle:避开 Tailwind 的 ring 工具类(撞名会叠 box-shadow)
  if (value == null) {
    return (
      <svg className={cn('progress-ring', colorClass(color), className)} viewBox="0 0 24 24" role="progressbar" aria-label="加载中"
           style={size != null ? { width: size, height: size } : undefined}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  const v = Math.min(100, Math.max(0, value));
  const px = size ?? 64;
  return (
    <span className={cn('progress-circle', colorClass(color), className)} style={{ width: px, height: px }}
          role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <svg viewBox="0 0 100 100">
        <circle className="pc-track" cx="50" cy="50" r={RING_R} />
        <circle className="pc-fill" cx="50" cy="50" r={RING_R}
                strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - v / 100)} />
      </svg>
      {showInfo && (
        <span className="pc-text" style={{ fontSize: Math.max(11, px * 0.22) }}>
          {format ? format(v) : `${Math.round(v)}%`}
        </span>
      )}
    </span>
  );
}

const INFOBAR_ICON = {
  info: InfoRegular,
  success: CheckmarkCircleRegular,
  warning: WarningRegular,
  error: ErrorCircleRegular,
} as const;

export function InfoBar({ level = 'info', title, children, className }: {
  level?: keyof typeof INFOBAR_ICON; title?: string; children?: ReactNode; className?: string;
}) {
  const LevelIcon = INFOBAR_ICON[level];
  return (
    <div className={cn('infobar', level, className)} role={level === 'error' ? 'alert' : 'status'}>
      <LevelIcon className="icon" size={16} />
      <div className="body">
        {title && <b>{title}</b>}
        <span className="msg">{children}</span>
      </div>
    </div>
  );
}

export function Card({ layer, radius, reveal, className, onPointerMove, ...rest }: HTMLAttributes<HTMLDivElement> & {
  layer?: boolean;
  /** 圆角:none / sm / md(默认) / lg */
  radius?: Radius;
  /** 指针跟随 Reveal 光效(默认关闭) */
  reveal?: boolean;
}) {
  return (
    <div
      className={cn('card', reveal && 'reveal', layer && 'layer', radiusClass(radius), className)}
      onPointerMove={reveal ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
        onPointerMove?.(e);
      } : onPointerMove}
      {...rest}
    />
  );
}

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-header', props.className)} {...props} />;
}

export function CardBody(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-body', props.className)} {...props} />;
}

export function CardFooter(props: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-footer', props.className)} {...props} />;
}

export interface ExpanderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  value?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  actions?: ReactNode;
  appearance?: 'default' | 'subtle';
  children: ReactNode;
  className?: string;
}

export interface ExpanderGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  expansionMode?: 'independent' | 'single' | 'multiple';
  value?: string | readonly string[] | null;
  defaultValue?: string | readonly string[] | null;
  onValueChange?: (value: string | string[] | null) => void;
  collapsible?: boolean;
}

const ExpanderGroupContext = createContext<{
  isExpanded: (value: string) => boolean;
  requestExpandedChange: (value: string, expanded: boolean) => boolean;
} | null>(null);

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export function Expander({
  title, description, icon, value, expanded, defaultExpanded = false,
  onExpandedChange, disabled = false, actions, appearance = 'default',
  children, className,
}: ExpanderProps) {
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const regionId = `${generatedId}-panel`;
  const group = useContext(ExpanderGroupContext);
  const itemValue = value ?? generatedId;
  const grouped = group !== null;
  const controlled = grouped || expanded !== undefined;
  const [internal, setInternal] = useState(defaultExpanded);
  const open = grouped ? group.isExpanded(itemValue) : expanded ?? internal;
  const reducedMotion = useReducedMotion();
  const [retainedContent, setRetainedContent] = useState(open);
  const [animatedExpanded, setAnimatedExpanded] = useState(open);
  const animatedExpandedRef = useRef(open);
  const animationFrameRef = useRef<number | null>(null);
  const transitionGenerationRef = useRef(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const contentVisible = open || (!reducedMotion && retainedContent);
  const visiblyExpanded = open && (reducedMotion || animatedExpanded);

  const restoreFocusIfNeeded = () => {
    if (regionRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    const generation = ++transitionGenerationRef.current;
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (open) {
      setRetainedContent(true);
      if (reducedMotion) {
        animatedExpandedRef.current = true;
        setAnimatedExpanded(true);
      } else if (!animatedExpandedRef.current) {
        setAnimatedExpanded(false);
        animationFrameRef.current = requestAnimationFrame(() => {
          if (transitionGenerationRef.current !== generation) return;
          animationFrameRef.current = null;
          animatedExpandedRef.current = true;
          setAnimatedExpanded(true);
        });
      }
    } else {
      const expansionStarted = animatedExpandedRef.current;
      animatedExpandedRef.current = false;
      setAnimatedExpanded(false);
      if (reducedMotion || !expansionStarted) {
        restoreFocusIfNeeded();
        setRetainedContent(false);
      }
    }
    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [open, reducedMotion]);

  const toggle = () => {
    if (disabled) return;
    const next = !open;
    if (group && !group.requestExpandedChange(itemValue, next)) return;
    if (!controlled) setInternal(next);
    onExpandedChange?.(next);
  };

  const finishTransition = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || open || animatedExpandedRef.current) return;
    restoreFocusIfNeeded();
    setRetainedContent(false);
  };

  return (
    <section className={cn(
      'expander',
      `expander--${appearance}`,
      visiblyExpanded && 'expanded',
      disabled && 'disabled',
      className,
    )}>
      <header className="expander-header">
        <button
          aria-controls={regionId}
          aria-expanded={open}
          className="expander-trigger"
          disabled={disabled}
          id={triggerId}
          onClick={toggle}
          ref={triggerRef}
          type="button"
        >
          {icon ? <span aria-hidden="true" className="expander-icon">{icon}</span> : null}
          <span className="expander-heading">
            <span className="expander-title">{title}</span>
            {description ? <span className="expander-description">{description}</span> : null}
          </span>
          <span aria-hidden="true" className="expander-chevron">
            <ChevronDownRegular size={14} />
          </span>
        </button>
        {actions ? <div className="expander-actions">{actions}</div> : null}
      </header>
      <div
        aria-labelledby={triggerId}
        className="expander-region"
        hidden={!contentVisible}
        id={regionId}
        inert={!open ? true : undefined}
        onTransitionEnd={finishTransition}
        ref={regionRef}
        role="region"
      >
        <div className="expander-region-inner">
          <div className="expander-content">{children}</div>
        </div>
      </div>
    </section>
  );
}

function normalizeValue(
  expansionMode: 'single' | 'multiple',
  value: string | readonly string[] | null | undefined,
) {
  if (expansionMode === 'single') {
    if (typeof value === 'string') return value;
    return Array.isArray(value) ? value[0] ?? null : null;
  }
  if (Array.isArray(value)) return [...new Set(value)];
  return typeof value === 'string' ? [value] : [];
}

export function ExpanderGroup({
  children, className, collapsible = true, defaultValue = null,
  expansionMode = 'independent', onValueChange, value, ...rest
}: ExpanderGroupProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const coordinated = expansionMode !== 'independent';
  const selectedValue = useMemo(
    () => coordinated
      ? normalizeValue(expansionMode, controlled ? value : internalValue)
      : null,
    [controlled, coordinated, expansionMode, internalValue, value],
  );
  const selectedItems = useMemo(
    () => Array.isArray(selectedValue)
      ? selectedValue
      : selectedValue == null ? [] : [selectedValue],
    [selectedValue],
  );

  const requestExpandedChange = useCallback((itemValue: string, expanded: boolean) => {
    if (!coordinated) return true;
    let nextValue: string | string[] | null;
    if (expansionMode === 'single') {
      if (!expanded && !collapsible) return false;
      nextValue = expanded ? itemValue : null;
    } else {
      nextValue = expanded
        ? selectedItems.includes(itemValue)
          ? [...selectedItems]
          : [...selectedItems, itemValue]
        : selectedItems.filter((entry) => entry !== itemValue);
    }
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    return true;
  }, [collapsible, controlled, coordinated, expansionMode, onValueChange, selectedItems]);

  const contextValue = useMemo(() => ({
    isExpanded: (itemValue: string) => selectedItems.includes(itemValue),
    requestExpandedChange,
  }), [requestExpandedChange, selectedItems]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || !coordinated || !(event.target instanceof HTMLButtonElement) || !event.target.classList.contains('expander-trigger')) return;
    const triggers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.expander-trigger')).filter((trigger) => (
      !trigger.disabled && trigger.closest('.expander')?.parentElement === event.currentTarget
    ));
    const currentIndex = triggers.indexOf(event.target);
    if (currentIndex < 0 || triggers.length === 0) return;
    let nextIndex: number;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % triggers.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = triggers.length - 1;
    else return;
    event.preventDefault();
    triggers[nextIndex]?.focus();
  };

  const group = (
    <div
      {...rest}
      className={cn('expander-group', `expander-group--${expansionMode}`, className)}
      data-expansion-mode={expansionMode}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );

  return coordinated
    ? <ExpanderGroupContext.Provider value={contextValue}>{group}</ExpanderGroupContext.Provider>
    : group;
}

export function Badge({ dot, color, className, style, children }: {
  dot?: boolean;
  /** 语义着色(缺省 critical 红) */
  color?: SemanticColor;
  className?: string; style?: React.CSSProperties; children?: ReactNode;
}) {
  return <span className={cn('badge', dot && 'dot', colorClass(color), className)} style={style}>{children}</span>;
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden="true" />;
}

/* 默认空态插画:Fluent 线稿风(等距空箱 + 点缀),currentColor 随主题 */
function EmptyImage({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor"
         strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 20 L24 13 L40 20 L24 27 Z" />
      <path d="M8 20 V33 L24 40 L40 33 V20" />
      <path d="M24 27 V40" />
      <path d="M14 8.5 L15.5 10 M33 6 L34.5 7.5 M40.5 12 L42 13.5" opacity=".55" />
    </svg>
  );
}

export interface EmptyProps {
  /** 'simple' = 紧凑变体(列表/表格内嵌);ReactNode = 自定义插画;缺省 = 默认插画 */
  image?: ReactNode | 'simple';
  /** 描述文案(antd 惯例),默认「暂无数据」 */
  description?: ReactNode;
  /** 操作区(如「新建」按钮) */
  children?: ReactNode;
  className?: string;
}

export function Empty({ image, description = '暂无数据', children, className }: EmptyProps) {
  const simple = image === 'simple';
  return (
    <div className={cn('empty', simple && 'simple', className)}>
      <div className="empty-img">
        {image == null || simple ? <EmptyImage size={simple ? 36 : 56} /> : image}
      </div>
      <div className="empty-desc">{description}</div>
      {children && <div className="empty-act">{children}</div>}
    </div>
  );
}
