/* Table — antd API 规范(columns/dataSource/rowKey/pagination/onRow/rowSelection/
 * loading),WinUI DataGrid 形态(复用 dg-* 类):layer 表头、灰 hover、
 * 排序循环 升→降→无;striped 斑马纹、size=small 紧凑密度、loading 套 Spin、
 * maxHeight 控表体滚动高(表头本就吸顶);toolbar 工具条插槽、
 * rowContextMenu 行右键菜单(表级单浮层)、pagination 透传每页条数选择。 */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';
import {
  ChevronDownRegular,
  ChevronUpRegular,
} from '@fluent-jade/icon';
import { Checkbox, Empty } from './Basics';
import { Button } from './Button';
import { Pagination } from './Pagination';
import { SearchBox } from './SearchBox';
import { Spin } from './Spin';
import { useFlyout, MenuList, type MenuItemDef } from './Flyout';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ColumnType<T> {
  title: ReactNode;
  dataIndex?: keyof T & string;
  key?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: (a: T, b: T) => number;
  /** 列对齐:left 左齐 / center 居中 / right 右齐(数字列,挂 .num 等宽数字) */
  align?: 'left' | 'center' | 'right';
  width?: string;               // grid 轨道,如 '2fr' / '120px';缺省 1fr
}

const cellAlign = (align?: 'left' | 'center' | 'right') =>
  align === 'right' ? 'num align-right'
    : align === 'center' ? 'align-center'
    : align === 'left' ? 'align-left'
    : undefined;

function SortInd({ active }: { active?: 'asc' | 'desc' }) {
  return (
    <span className="sort-ind" data-dir={active} aria-hidden>
      <ChevronUpRegular size={10} className="sort-up" />
      <ChevronDownRegular size={10} className="sort-down" />
    </span>
  );
}

export interface TableRowSelection<T> {
  /** checkbox 多选(默认)/ radio 单选 */
  type?: 'checkbox' | 'radio';
  selectedRowKeys?: string[];
  defaultSelectedRowKeys?: string[];
  onChange?: (keys: string[], rows: T[]) => void;
  /** 按行禁用选择 */
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

/** 行右键菜单:items 可按行生成;onPick 收菜单键 + 行记录 */
export interface TableContextMenu<T> {
  items: MenuItemDef[] | ((record: T) => MenuItemDef[]);
  onPick: (key: string, record: T) => void;
}

export interface TableFilterOption {
  value: string;
  label: ReactNode;
}

export interface TableFilter<T> {
  columnKey: string;
  label: ReactNode;
  options: TableFilterOption[];
  mode?: 'single' | 'multiple';
  filterFn?: (record: T, values: string[]) => boolean;
}

export interface TableControls<T> {
  search?: boolean;
  filters?: TableFilter<T>[];
  clearAll?: boolean;
}

export interface TableProps<T> {
  columns: ColumnType<T>[];
  dataSource: T[];
  rowKey?: (keyof T & string) | ((record: T) => string);
  pagination?: false | { pageSize?: number; showSizeChanger?: boolean; pageSizeOptions?: number[] };
  onRow?: (record: T) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
  };
  /** 表格上方工具条插槽(放 Button / SearchBox / CommandBar 等) */
  toolbar?: ReactNode;
  /** 搜索 + 筛选控制栏 */
  controls?: TableControls<T>;
  /** 行右键菜单(整表一个浮层,按行取菜单项) */
  rowContextMenu?: TableContextMenu<T>;
  /** 行选择:表头全选(带半选态),radio 为单选 */
  rowSelection?: TableRowSelection<T>;
  /** 加载态:套 Spin 遮罩 */
  loading?: boolean;
  /** 斑马纹 */
  striped?: boolean;
  /** small = 紧凑密度(行高 32) */
  size?: 'small' | 'middle';
  /** 无数据占位,缺省 <Empty image="simple" /> */
  empty?: ReactNode;
  /** 表体滚动高度上限(px),缺省 320 */
  maxHeight?: number;
  /** 表头吸顶 */
  stickyHeader?: boolean;
  /** 左侧吸附列(列 key 或 dataIndex 数组) */
  stickyColumns?: string[];
  className?: string;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

let tblSeq = 0;

export function Table<T extends object>({
  columns, dataSource, rowKey = 'key' as keyof T & string,
  pagination = { pageSize: 10 }, onRow, rowSelection,
  loading, striped, size, empty, maxHeight, toolbar, controls, rowContextMenu,
  stickyHeader, stickyColumns, className,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  // 每页条数:初值取 pageSize(缺省 10),之后由分页器的条数选择驱动
  const [innerSize, setInnerSize] = useState(
    pagination === false ? 10 : (pagination.pageSize ?? pagination.pageSizeOptions?.[0] ?? 10),
  );
  /* pageSize 至少为 1:pagination===false 且 dataSource 为空时为 0,
     会让 maxPage=Math.ceil(0/0)=NaN,进而 setPage(NaN) */
  const pageSize = Math.max(1, pagination === false ? dataSource.length : innerSize);
  const nameRef = useRef('');
  if (!nameRef.current) nameRef.current = `tbl-${++tblSeq}`;

  /* 行右键菜单:整表一个 MenuList 浮层(逐行包 ContextMenuArea 会破坏
     dg-body 直接子级结构,斑马纹 nth-child 会错) */
  const rootRef = useRef<HTMLDivElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const ctxFly = useFlyout(rootRef, ctxMenuRef);
  const [ctx, setCtx] = useState<{ x: number; y: number; record: T } | null>(null);
  useLayoutEffect(() => {
    if (!ctxFly.isOpen || !ctx) return;
    const m = ctxMenuRef.current;
    if (!m) return;
    const r = m.getBoundingClientRect();
    m.style.left = `${Math.max(8, Math.min(ctx.x, innerWidth - r.width - 8))}px`;
    m.style.top = `${Math.max(48, Math.min(ctx.y, innerHeight - r.height - 8))}px`;
  }, [ctxFly.isOpen, ctx]);

  /* fixed 菜单只在打开时按视口钳位,滚动后会悬空:打开期间挂 capture
     滚动监听(含嵌套滚动容器),一滚动即关 */
  useLayoutEffect(() => {
    if (!ctxFly.isOpen) return;
    const onScroll = () => ctxFly.close();
    addEventListener('scroll', onScroll, true);
    return () => removeEventListener('scroll', onScroll, true);
  }, [ctxFly.isOpen, ctxFly.close]);

  /* 行选择(受控/非受控) */
  const selType = rowSelection?.type ?? 'checkbox';
  const [innerKeys, setInnerKeys] = useState<string[]>(rowSelection?.defaultSelectedRowKeys ?? []);
  const selKeys = rowSelection?.selectedRowKeys ?? innerKeys;

  const keyOf = (r: T, i: number): string =>
    typeof rowKey === 'function' ? rowKey(r) : String((r as any)[rowKey] ?? i);
  /* 行键统一以 dataSource 全量索引为口径(记录 → 键),翻页/排序后选择不串行 */
  const rowKeys = useMemo(() => {
    const m = new Map<T, string>();
    dataSource.forEach((r, i) => m.set(r, keyOf(r, i)));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, rowKey]);
  const rowKeyOf = (r: T): string => rowKeys.get(r) ?? '';

  const commitKeys = (keys: string[]) => {
    if (rowSelection?.selectedRowKeys == null) setInnerKeys(keys);
    rowSelection?.onChange?.(keys, dataSource.filter((r) => keys.includes(rowKeyOf(r))));
  };

  const colKey = (c: ColumnType<T>, i: number) => c.key ?? c.dataIndex ?? String(i);
  const rowDisabled = (r: T) => !!rowSelection?.getCheckboxProps?.(r).disabled;

  /* 搜索 + 筛选 */
  const hasSearch = controls?.search === true;
  const filterDefs = controls?.filters ?? [];
  const hasActiveSearch = globalFilter.length > 0;
  const activeFilterCount = Object.values(columnFilters).filter((v) => v.length > 0).length;
  const hasActiveFilters = activeFilterCount > 0;
  const hasActiveControls = hasActiveSearch || hasActiveFilters;

  const filtered = useMemo(() => {
    let out = dataSource;
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => {
          const raw = c.dataIndex ? (r as any)[c.dataIndex] : undefined;
          return String(raw ?? '').toLowerCase().includes(q);
        }),
      );
    }
    for (const [key, values] of Object.entries(columnFilters)) {
      if (values.length === 0) continue;
      const def = filterDefs.find((f) => f.columnKey === key);
      if (!def) continue;
      if (def.filterFn) {
        out = out.filter((r) => def.filterFn!(r, values));
      } else {
        const colIdx = columns.findIndex((c, i) => colKey(c, i) === key);
        if (colIdx < 0) continue;
        const col = columns[colIdx];
        out = out.filter((r) => {
          const raw = col.dataIndex ? (r as any)[col.dataIndex] : undefined;
          return values.includes(String(raw ?? ''));
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, globalFilter, columnFilters, columns, filterDefs]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c, i) => colKey(c, i) === sort.key);
    if (!col?.sorter) return filtered;
    const s = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => col.sorter!(a, b) * s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sort, columns]);

  /* dataSource 缩减后当前页可能越界:钳到 [1, maxPage] 并回写内部态
     (page 为非受控内部 state,不存在受控语义冲突) */
  const maxPage = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, maxPage);
  useLayoutEffect(() => { if (page !== curPage) setPage(curPage); }, [page, curPage]);

  const paged = pagination === false ? sorted
    : sorted.slice((curPage - 1) * pageSize, curPage * pageSize);

  /* antd 排序循环:无 → 升 → 降 → 无 */
  const cycleSort = (key: string) => {
    setSort((cur) => (cur?.key !== key ? { key, dir: 'asc' }
      : cur.dir === 'asc' ? { key, dir: 'desc' } : null));
    setPage(1);
  };

  /* 表头全选:作用于当前页可选行(antd 行为);先取键再过滤,免得索引回退错位 */
  const pageKeys = paged.map((r) => ({ r, k: rowKeyOf(r) }))
    .filter(({ r }) => !rowDisabled(r)).map(({ k }) => k);
  const pageSelected = pageKeys.filter((k) => selKeys.includes(k));
  const allChecked = pageKeys.length > 0 && pageSelected.length === pageKeys.length;
  const someChecked = pageSelected.length > 0 && !allChecked;
  const toggleAll = () => {
    if (allChecked) commitKeys(selKeys.filter((k) => !pageKeys.includes(k)));
    else commitKeys([...new Set([...selKeys, ...pageKeys])]);
  };
  const toggleRow = (k: string) => {
    if (selType === 'radio') { commitKeys([k]); return; }
    commitKeys(selKeys.includes(k) ? selKeys.filter((x) => x !== k) : [...selKeys, k]);
  };

  const gridCols = {
    gridTemplateColumns: (rowSelection ? ['44px'] : [])
      .concat(columns.map((c) => c.width ?? '1fr')).join(' '),
  };

  /* sticky 列:计算每列左偏移(仅水平 sticky 场景) */
  const stickyOffsets = useMemo(() => {
    if (!stickyColumns?.length) return null;
    const offsets = new Map<string, number>();
    let offset = rowSelection ? 44 : 0;
    for (const c of columns) {
      const k = colKey(c, columns.indexOf(c));
      if (stickyColumns.includes(k)) {
        offsets.set(k, offset);
        // width 可能是 '1fr' 或 '100px',只有 px 可计算;fr 列不吸附
        const w = c.width ?? '1fr';
        const px = w.endsWith('px') ? parseFloat(w) : 0;
        offset += px;
      } else {
        const w = c.width ?? '1fr';
        const px = w.endsWith('px') ? parseFloat(w) : 0;
        offset += px;
      }
    }
    return offsets;
  }, [columns, stickyColumns, rowSelection]);

  const body = (
    <div className={className} ref={rootRef}>
      {toolbar != null && <div className="tbl-toolbar">{toolbar}</div>}
      {(hasSearch || filterDefs.length > 0) && (
        <div className="tbl-controls">
          {hasSearch && (
            <div className="tbl-search">
              <SearchBox
                aria-label="搜索"
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder="搜索…"
                size="small"
              />
              {hasActiveSearch && (
                <button className="tbl-clear" aria-label="清除搜索" onClick={() => setGlobalFilter('')}>
                  ×
                </button>
              )}
            </div>
          )}
          {filterDefs.length > 0 && (
            <div className="tbl-filter">
              <Button size="small" variant="subtle" aria-label="筛选"
                      onClick={() => { /* 筛选菜单暂略,后续用 MenuList 实现 */ }}>
                筛选{activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>
            </div>
          )}
          {hasActiveControls && controls?.clearAll !== false && (
            <Button size="small" variant="link" onClick={() => { setGlobalFilter(''); setColumnFilters({}); }}>
              清除全部
            </Button>
          )}
        </div>
      )}
      <div className={cn('datagrid', striped && 'striped', size === 'small' && 'compact',
                         stickyHeader && 'sticky-header')} role="grid">
        <div className="dg-row dg-head" style={gridCols} role="row">
          {rowSelection && (
            <div className="dg-cell dg-sel" role="columnheader"
                 style={stickyColumns?.length ? { position: 'sticky', left: 0, zIndex: 3 } : undefined}>
              {selType === 'checkbox' && (
                <Checkbox aria-label="全选本页" checked={allChecked} indeterminate={someChecked}
                          onChange={toggleAll} />
              )}
            </div>
          )}
          {columns.map((c, i) => {
            const k = colKey(c, i);
            const active = sort?.key === k ? sort.dir : undefined;
            const stickyLeft = stickyOffsets?.get(k);
            const isSticky = stickyLeft !== undefined;
            return (
              <div key={k}
                   className={cn('dg-cell', c.sorter && 'sortable', cellAlign(c.align))}
                   data-sort={active}
                   role="columnheader"
                   aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined}
                   style={isSticky ? { position: 'sticky', left: stickyLeft, zIndex: 2 } : undefined}
                   onClick={() => c.sorter && cycleSort(k)}>
                {c.title}
                {c.sorter && <SortInd active={active} />}
              </div>
            );
          })}
        </div>
        {/* key 随页码/排序变化:表体整体做一次轻微淡入(dg-refresh),
            行不做逐行错峰飞入——数据表格逐行动画在翻页/排序时过于喧闹 */}
        <div className="dg-body dg-refresh" key={`${curPage}|${sort?.key ?? ''}|${sort?.dir ?? ''}`}
             style={maxHeight != null ? { maxHeight } : undefined}>
          {paged.length === 0 && (empty ?? <Empty image="simple" />)}
          {paged.map((r, ri) => {
            const extra = onRow?.(r);
            const k = rowKeyOf(r);
            const selected = !!rowSelection && selKeys.includes(k);
            const dis = !!rowSelection && rowDisabled(r);
            return (
              <div key={k} className="dg-row" role="row" tabIndex={0}
                   aria-selected={rowSelection ? selected : undefined}
                   style={gridCols} onClick={extra?.onClick}
                   onDoubleClick={extra?.onDoubleClick}
                   onContextMenu={(e) => {
                     extra?.onContextMenu?.(e);
                     if (!rowContextMenu) return;
                     e.preventDefault();
                     setCtx({ x: e.clientX, y: e.clientY, record: r });
                     ctxFly.open();
                   }}
                   onKeyDown={(e) => { if (e.key === 'Enter') extra?.onClick?.(); }}>
                {rowSelection && (
                  <div className="dg-cell dg-sel" onClick={(e) => e.stopPropagation()}
                       style={stickyColumns?.length ? { position: 'sticky', left: 0, zIndex: 1 } : undefined}>
                    {selType === 'checkbox' ? (
                      <Checkbox aria-label={`选择行 ${k}`} checked={selected} disabled={dis}
                                onChange={() => toggleRow(k)} />
                    ) : (
                      <label className="check radio">
                        <input type="radio" name={nameRef.current} aria-label={`选择行 ${k}`}
                               checked={selected} disabled={dis} onChange={() => toggleRow(k)} />
                        <span className="box" />
                      </label>
                    )}
                  </div>
                )}
                {columns.map((c, ci) => {
                  const raw = c.dataIndex ? (r as any)[c.dataIndex] : undefined;
                  const stickyLeft = stickyOffsets?.get(colKey(c, ci));
                  const isSticky = stickyLeft !== undefined;
                  return (
                    <div key={colKey(c, ci)} className={cn('dg-cell', cellAlign(c.align))}
                         style={isSticky ? { position: 'sticky', left: stickyLeft, zIndex: 1 } : undefined}>
                      {c.render ? c.render(raw, r, ri) : String(raw ?? '')}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {pagination !== false && (sorted.length > pageSize || pagination.showSizeChanger) && (
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <Pagination current={curPage} total={sorted.length} pageSize={pageSize}
                      showSizeChanger={pagination.showSizeChanger}
                      pageSizeOptions={pagination.pageSizeOptions}
                      onChange={(p, s) => { setPage(p); if (s !== pageSize) { setInnerSize(s); setPage(1); } }} />
        </div>
      )}
      {rowContextMenu && ctxFly.isOpen && ctx && createPortal(
        <MenuList ref={ctxMenuRef}
                  items={typeof rowContextMenu.items === 'function' ? rowContextMenu.items(ctx.record) : rowContextMenu.items}
                  closing={ctxFly.closing}
                  onPick={(k) => { ctxFly.close(); rowContextMenu.onPick(k, ctx.record); }}
                  style={{ position: 'fixed', left: ctx.x, top: ctx.y, zIndex: 850 }} />,
        document.body,
      )}
    </div>
  );

  /* loading 未传时不包 Spin,DOM 结构对旧用法零变化 */
  return loading == null ? body : <Spin spinning={loading} delay={150}>{body}</Spin>;
}
