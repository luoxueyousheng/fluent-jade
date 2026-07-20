/* 首页 = 组件画廊:全部组件的预览卡片墙(手工策划的迷你预览 + 名称),
 * 点击卡片进入对应文档页;顶部搜索框过滤卡片。 */
import { useMemo, useState, type ReactNode } from 'react';
import { SearchBox } from '@fluent-jade/ui';
import { docGroups } from '../docs/registry';
import { galleryPreviews } from './galleryPreviews';

/* 策划预览缺失时回退到首个演示,并 warn 一次便于发现遗漏 */
const missed = new Set<string>();
const previewOf = (key: string, fallback: ReactNode) => {
  const p = galleryPreviews[key];
  if (p === undefined && !missed.has(key)) {
    missed.add(key);
    console.warn(`[gallery] 缺少策划预览:${key}`);
  }
  return p ?? fallback;
};

export function HomePage({ onOpen }: {
  /** 点击卡片打开对应组件文档页 */
  onOpen: (key: string) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const componentGroups = useMemo(() => docGroups.filter((g) => !g.guide), []);
  const groups = useMemo(
    () => componentGroups
      .map((g) => ({
        title: g.title,
        items: q
          ? g.items.filter((d) =>
              d.name.toLowerCase().includes(q) || d.cn.includes(query.trim()) || d.key.includes(q))
          : g.items,
      }))
      .filter((g) => g.items.length > 0),
    [componentGroups, q, query],
  );
  const total = componentGroups.reduce((n, g) => n + g.items.length, 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <h1 className="t-title">Fluent UI × JadeView</h1>
      <p className="desc muted">
        {total} 个组件 · WinUI 3 视觉与动效 · antd API 惯例 · 点击卡片查看用法与 API
      </p>
      <div className="gallery-search">
        <SearchBox value={query} onChange={setQuery} placeholder="搜索组件(名称 / 拼写)" />
        {q && <span className="gallery-count">{shown} / {total}</span>}
      </div>

      {groups.length === 0 && <p className="muted" style={{ marginTop: 24 }}>没有匹配「{query.trim()}」的组件。</p>}

      {groups.map((g) => (
        <section key={g.title} className="gallery-group">
          <h2 className="gallery-title">{g.title}</h2>
          <div className="gallery-grid">
            {g.items.map((d) => (
              <div key={d.key} className="gallery-card" role="button" tabIndex={0}
                   aria-label={`打开 ${d.cn} ${d.name} 文档`}
                   onClick={() => onOpen(d.key)}
                   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(d.key); } }}>
                {/* 迷你预览:手工策划的静态形态,不可交互 */}
                <div className="gc-preview" aria-hidden="true">
                  <div className="gc-fit">{previewOf(d.key, d.sections[0]?.demo)}</div>
                </div>
                <div className="gc-meta">
                  <span className="gc-name">{d.cn}<i>{d.name}</i></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
