/* 滚动指示器控制(WinUI 3 ScrollBar 逻辑):
 * 细滑块只在「正在滚动」时出现(元素打 sb-active 类),静止 900ms 后消失;
 * 指针压到滚动条轨道上时由 CSS :hover 直接浮现并展宽。
 * 指针仅停在内容区内不显示——这是与「悬停容器常显」的关键差别。
 * FluentProvider 挂载时自动安装(capture 监听,覆盖所有滚动容器)。 */

let installed = false;

export function installScrollIndicators(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const timers = new WeakMap<Element, number>();
  document.addEventListener('scroll', (e) => {
    const el = e.target === document ? document.documentElement : e.target;
    if (!(el instanceof Element)) return;
    el.classList.add('sb-active');
    const prev = timers.get(el);
    if (prev) clearTimeout(prev);
    timers.set(el, window.setTimeout(() => el.classList.remove('sb-active'), 900));
  }, { capture: true, passive: true });
}
