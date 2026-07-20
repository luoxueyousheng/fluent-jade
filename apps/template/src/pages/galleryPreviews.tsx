/* 首页画廊的手工策划迷你预览:键 = 文档 key(registry.ts 各 data/*.tsx,指南组除外)。
 * 策划原则:
 * - 用组件真实 API 渲染「小而典型」的静态形态(uncontrolled / defaultValue,
 *   必须的受控 props 配 noop;预览区 pointer-events:none,无需交互);
 * - 尺寸适配约 210×100 的预览区,超宽组件用少量项 + Tailwind 缩放;
 * - 浮层类(toast/modal/drawer/tooltip/popover/teaching-tip/popconfirm/tour)
 *   只放触发按钮看不出形态,改用令牌 + Tailwind 手绘迷你静态浮层
 *   (尽量复用组件真实 className,如 .toast / .popover-pop / .tour-pop);
 * - 外壳类(app-shell/title-bar/nav-view)画微缩线框(侧栏 + 内容区色块)。 */
import type { CSSProperties, ReactNode } from 'react';
import {
  Anchor,
  AutoSuggest,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Carousel,
  Cascader,
  Checkbox,
  ColorPicker,
  ComboBox,
  CommandBar,
  DataGrid,
  DatePicker,
  Descriptions,
  Divider,
  Dock,
  DockIcon,
  Empty,
  Expander,
  Field,
  Form,
  HotkeyInput,
  Image,
  InfoBar,
  ListBox,
  Marquee,
  MenuBar,
  MenuList,
  MultiSelect,
  NumberBox,
  Pagination,
  PasswordBox,
  ProgressBar,
  ProgressRing,
  Radio,
  RangePicker,
  Rating,
  Result,
  SearchBox,
  SelectorBar,
  SettingsCard,
  Skeleton,
  Slider,
  Spin,
  Splitter,
  Steps,
  Switch,
  Table,
  Tabs,
  TabView,
  Tag,
  TextBox,
  ThemeToggler,
  TimePicker,
  Timeline,
  ToggleButton,
  Transfer,
  Tree,
  Upload,
  VirtualList,
  type ColumnType,
  type DataGridColumn,
  type MenuItemDef,
  type TreeDataNode,
} from '@fluent-jade/ui';
import {
  CalendarLtrRegular,
  ChatRegular,
  CheckmarkCircleRegular,
  ChevronLeftRegular,
  CopyRegular,
  DismissRegular,
  DocumentRegular,
  FolderRegular,
  GlobeRegular,
  HomeRegular,
  PaintBrushRegular,
  PersonRegular,
  SearchRegular,
  SettingsRegular,
  StackRegular,
  WarningRegular,
} from '@fluent-jade/icon';

const noop = () => {};

/* ---- 各预览共用的小数据集 ---- */
const CITY = [
  { value: 'bj', label: '北京' },
  { value: 'sh', label: '上海' },
  { value: 'gz', label: '广州' },
];
const MENU: MenuItemDef[] = [
  { key: 'open', label: '打开', icon: <DocumentRegular size={14} /> },
  { key: 'copy', label: '复制', icon: <CopyRegular size={14} /> },
  { key: 'd1', divider: true },
  { key: 'del', label: '删除', danger: true, icon: <DismissRegular size={14} /> },
];
const TREE_DATA: TreeDataNode[] = [
  { key: 'src', title: 'src', children: [
    { key: 'btn', title: 'Button.tsx' },
    { key: 'combo', title: 'ComboBox.tsx' },
  ] },
  { key: 'pkg', title: 'package.json' },
];
const DAY = new Date(2026, 0, 15);
const WEEK_AGO = new Date(2026, 0, 8);

/* 表格 / 数据网格共用的迷你行列 */
interface MiniRow { key: string; name: string; type: string; size: number }
const T_ROWS: MiniRow[] = [
  { key: '1', name: 'theme.css', type: '样式', size: 48 },
  { key: '2', name: 'Button.tsx', type: '组件', size: 2 },
  { key: '3', name: 'Table.tsx', type: '组件', size: 6 },
];
const T_COLS: ColumnType<MiniRow>[] = [
  { title: '名称', dataIndex: 'name', width: '2fr' },
  { title: '类型', dataIndex: 'type', align: 'center' },
  { title: '大小', dataIndex: 'size', align: 'right' },
];
const G_COLS: DataGridColumn<{ id: string; name: string; type: string; size: number }>[] = [
  { key: 'name', title: '名称', width: '2fr' },
  { key: 'type', title: '类型', width: '1fr', align: 'center' },
  { key: 'size', title: '大小', width: '1fr', align: 'right' },
];
const G_ROWS = T_ROWS.map((r) => ({ id: r.key, name: r.name, type: r.type, size: r.size }));

/* 内联 SVG 渐变图(image / carousel 预览用,无网络依赖) */
const pic = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 60% 45%)"/><stop offset="1" stop-color="hsl(${hue + 40} 60% 30%)"/>` +
    `</linearGradient></defs><rect width="400" height="240" fill="url(#g)"/></svg>`,
  )}`;

/* 手绘浮层面板(令牌 + Tailwind;浮层用亚克力底,窗口线框用实底) */
const surf = 'rounded-lg border border-(--stroke) bg-(--acrylic-bg) shadow-(--shadow-8)';
const win = 'rounded-lg border border-(--stroke) bg-(--bg) shadow-(--shadow-8)';
/* 线框占位条(外壳类预览) */
const bar = (w: string, style?: CSSProperties) => (
  <div className={`h-[5px] rounded-full bg-(--fill-secondary) ${w}`} style={style} />
);

export const galleryPreviews: Record<string, ReactNode> = {
  /* ---- 通用 ---- */
  button: (
    <div className="flex gap-2">
      <Button size="small">标准</Button>
      <Button size="small" variant="accent">主要</Button>
      <Button size="small" variant="subtle">弱化</Button>
    </div>
  ),
  togglebutton: (
    <div className="flex gap-2">
      <ToggleButton size="small" defaultChecked>置顶窗口</ToggleButton>
      <ToggleButton size="small">自动换行</ToggleButton>
    </div>
  ),
  icon: (
    <div className="flex gap-3 items-center text-(--text-1)">
      <HomeRegular size={18} />
      <SearchRegular size={18} />
      <SettingsRegular size={18} />
      <CheckmarkCircleRegular size={18} color="var(--success)" />
      <WarningRegular size={18} color="var(--caution)" />
    </div>
  ),
  'theme-toggler': <ThemeToggler />,

  /* ---- 输入 ---- */
  checkbox: (
    <div className="flex gap-3">
      <Checkbox defaultChecked>已选中</Checkbox>
      <Checkbox>未选中</Checkbox>
    </div>
  ),
  radio: (
    <div className="flex gap-3">
      <Radio name="gp-radio" defaultChecked>选项一</Radio>
      <Radio name="gp-radio">选项二</Radio>
    </div>
  ),
  switch: (
    <div className="flex gap-3">
      <Switch defaultChecked>已开启</Switch>
      <Switch>已关闭</Switch>
    </div>
  ),
  slider: (
    <div className="w-[160px]">
      <Slider header="音量" showValue value={40} onChange={noop} />
    </div>
  ),
  numberbox: <NumberBox defaultValue={8} min={0} max={100} aria-label="数量" />,
  rating: <Rating defaultValue={4} readOnly aria-label="评分" />,
  colorpicker: <ColorPicker defaultValue="#4CC2FF" showText />,
  upload: (
    <div className="w-[190px] scale-[0.85]">
      <Upload.Dragger customRequest={noop} maxCount={3} />
    </div>
  ),

  /* ---- 文本与表单 ---- */
  textbox: (
    <div className="w-[176px]">
      <TextBox placeholder="请输入内容" aria-label="文本" />
    </div>
  ),
  passwordbox: (
    <div className="w-[176px]">
      <PasswordBox defaultValue="secret-token" aria-label="密码" />
    </div>
  ),
  field: (
    <div className="w-[176px]">
      <Field label="邮箱" hint="用于接收通知">
        <TextBox placeholder="you@example.com" aria-label="邮箱" />
      </Field>
    </div>
  ),
  searchbox: (
    <div className="w-[176px]">
      <SearchBox placeholder="搜索" />
    </div>
  ),
  autosuggest: (
    <div className="w-[176px]">
      <AutoSuggest options={['Apple', 'Mango', 'Orange']} defaultValue="Mango" aria-label="水果" />
    </div>
  ),
  form: (
    <Form className="w-[176px] flex flex-col gap-2 items-start">
      <Form.Item name="user" label="用户名" className="w-full">
        <TextBox size="small" placeholder="输入用户名" aria-label="用户名" />
      </Form.Item>
      <Button size="small" variant="accent" type="submit">提交</Button>
    </Form>
  ),

  /* ---- 选择 ---- */
  combobox: <ComboBox options={CITY} defaultValue="sh" aria-label="城市" />,
  multiselect: (
    <div className="w-[190px]">
      <MultiSelect options={CITY} defaultValue={['bj', 'sh', 'gz']} maxTagCount={2} aria-label="多选" />
    </div>
  ),
  listbox: (
    <div className="w-[150px] text-[13px]">
      <ListBox items={CITY} value="sh" onChange={noop} />
    </div>
  ),
  dropdown: (
    /* MenuList 是裸菜单浮层;static 化后直接当静态预览 */
    <MenuList items={MENU} onPick={noop} style={{ position: 'static' }} className="w-[150px]" />
  ),
  tree: (
    <div className="w-[160px]">
      <Tree treeData={TREE_DATA} defaultExpandAll defaultSelectedKeys={['btn']} />
    </div>
  ),

  /* ---- 日期时间 ---- */
  calendar: (
    /* 日历整体太高:放大到可读,纵向裁到表头 + 前两行日期 */
    <div className="h-[100px] overflow-hidden">
      <div className="scale-[0.72] origin-top">
        <Calendar defaultValue={DAY} />
      </div>
    </div>
  ),
  datepicker: <DatePicker defaultValue={DAY} format="YYYY年MM月DD日" aria-label="日期" />,
  rangepicker: (
    <div className="scale-[0.8]">
      <RangePicker format="MM月DD日" defaultValue={[WEEK_AGO, DAY]} aria-label="区间" />
    </div>
  ),
  timepicker: <TimePicker defaultValue={DAY} aria-label="时间" />,

  /* ---- 导航 ---- */
  selectorbar: (
    <SelectorBar value="recent" onChange={noop} aria-label="视图"
      items={[
        { key: 'recent', label: '最近', icon: <CalendarLtrRegular size={14} /> },
        { key: 'shared', label: '共享', icon: <StackRegular size={14} /> },
        { key: 'fav', label: '收藏', icon: <HomeRegular size={14} /> },
      ]} />
  ),
  tabs: (
    <div className="flex flex-col gap-2.5 items-start">
      <Tabs value="all" onChange={noop} aria-label="下划线"
            items={[{ key: 'all', label: '全部' }, { key: 'todo', label: '待办' }, { key: 'done', label: '已完成' }]} />
      <Tabs variant="segmented-accent" value="day" onChange={noop} aria-label="分段"
            items={[{ key: 'day', label: '日' }, { key: 'week', label: '周' }, { key: 'month', label: '月' }]} />
    </div>
  ),
  tabview: (
    <div className="w-[190px]">
      <TabView value="t1" onChange={noop} onClose={noop}
               items={[{ key: 't1', label: '文档 1' }, { key: 't2', label: '文档 2' }]}>
        <p className="m-0 px-2 py-1.5 text-[11px] text-(--text-2)">文档 1 的内容</p>
      </TabView>
    </div>
  ),
  commandbar: (
    <div className="w-[280px] scale-[0.72]">
      <CommandBar onAction={noop} aria-label="命令栏"
        items={[
          { key: 'add', label: '新建' },
          { key: 'upload', label: '导入' },
          { key: 'd1', divider: true },
          { key: 'del', label: '删除', danger: true },
        ]} />
    </div>
  ),
  menubar: (
    <MenuBar onAction={noop}
      menus={[
        { key: 'file', label: '文件', items: [{ key: 'open', label: '打开…' }, { key: 'save', label: '保存' }] },
        { key: 'edit', label: '编辑', items: [{ key: 'undo', label: '撤销' }] },
        { key: 'view', label: '查看', items: [{ key: 'zoom', label: '缩放' }] },
      ]} />
  ),
  breadcrumb: (
    <Breadcrumb onNavigate={noop}
      items={[{ key: 'home', label: '首页' }, { key: 'docs', label: '文档' }, { key: 'button', label: 'Button' }]} />
  ),
  steps: (
    <div className="w-[300px] scale-[0.65]">
      <Steps current={1} items={[{ title: '填写' }, { title: '验证' }, { title: '完成' }]} />
    </div>
  ),
  pagination: (
    <div className="scale-[0.85]">
      <Pagination defaultCurrent={2} total={50} />
    </div>
  ),

  /* ---- 集合 ---- */
  table: (
    <div className="w-[230px] scale-[0.8]">
      <Table columns={T_COLS} dataSource={T_ROWS} pagination={false} size="small" />
    </div>
  ),
  datagrid: (
    <div className="w-[230px] scale-[0.8]">
      <DataGrid columns={G_COLS} rows={G_ROWS} selected="2" onSelect={noop} />
    </div>
  ),

  /* ---- 展示 ---- */
  card: (
    <Card className="w-[168px]">
      <b className="text-[13px]">标准卡片</b>
      <p className="m-0 mt-1 text-[12px] text-(--text-2)">WinUI 描边卡片。</p>
    </Card>
  ),
  expander: (
    <div className="w-[188px]">
      <Expander summary="什么是 Mica?" defaultOpen>
        <p className="m-0 text-[12px] text-(--text-2)">以壁纸着色的窗口材质。</p>
      </Expander>
    </div>
  ),
  splitter: (
    <div className="w-[196px] h-[76px] rounded-md border border-(--card-border) overflow-hidden">
      <Splitter defaultSize={76} min={56} max={140}>
        <div className="h-full bg-(--layer) p-1.5">{bar('w-3/4')}</div>
        <div className="h-full p-1.5 flex flex-col gap-1">{bar('w-full')}{bar('w-2/3')}</div>
      </Splitter>
    </div>
  ),
  settingscard: (
    <div className="w-[200px] scale-[0.9]">
      <SettingsCard icon={<PaintBrushRegular size={16} />} title="主题" description="深浅色随系统">
        <Switch defaultChecked aria-label="跟随系统" />
      </SettingsCard>
    </div>
  ),
  image: <Image src={pic(205)} alt="示例图" width={120} height={72} rounded preview={false} />,
  carousel: (
    <div className="w-[168px]">
      <Carousel dots>
        {[pic(205), pic(150), pic(28)].map((s, i) => (
          <img key={i} src={s} alt={`第 ${i + 1} 张`} className="block w-full h-[72px] object-cover rounded-md" />
        ))}
      </Carousel>
    </div>
  ),
  tag: (
    <div className="flex gap-1.5">
      <Tag color="accent">主题</Tag>
      <Tag color="success">成功</Tag>
      <Tag color="caution">警示</Tag>
      <Tag color="critical">危险</Tag>
    </div>
  ),
  badge: (
    <div className="flex items-center gap-4 text-(--text-1)">
      <span className="relative inline-flex">
        <ChatRegular size={20} />
        <Badge className="absolute -top-1.5 -right-2.5">8</Badge>
      </span>
      <span className="relative inline-flex">
        <SettingsRegular size={20} />
        <Badge dot className="absolute -top-0.5 -right-0.5" />
      </span>
      <Badge>99+</Badge>
    </div>
  ),
  avatar: (
    <div className="flex gap-2">
      <Avatar name="张伟" />
      <Avatar name="李雷" />
      <Avatar name="Han" />
    </div>
  ),
  divider: (
    <div className="w-[168px] text-[12px] text-(--text-2)">
      <p className="m-0">第一段内容</p>
      <Divider>或者</Divider>
      <p className="m-0">第二段内容</p>
    </div>
  ),
  empty: (
    <div className="scale-[0.85]">
      <Empty image="simple" description="暂无数据" />
    </div>
  ),
  skeleton: (
    <div className="flex gap-2.5 items-center w-[168px]">
      <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton style={{ height: 11, width: '60%' }} />
        <Skeleton style={{ height: 10, width: '90%' }} />
      </div>
    </div>
  ),
  timeline: (
    <Timeline items={[
      { content: '构建开始', color: 'accent' },
      { content: '测试通过', color: 'success' },
      { content: '部署失败', color: 'critical' },
    ]} />
  ),
  marquee: (
    <Marquee duration={20} className="w-[180px]">
      {['React 19', 'Tailwind v4', 'WinUI 3', 'Fluent'].map((t) => (
        <span key={t} className="inline-flex px-3 py-1 rounded-md bg-(--fill-subtle)
                                 text-[12px] whitespace-nowrap border border-(--stroke)">
          {t}
        </span>
      ))}
    </Marquee>
  ),
  'bento-grid': (
    /* BentoGrid 本体行高 22rem,卡片内画 2×2 微缩栅格示意 */
    <div className="grid grid-cols-3 gap-1.5 w-[176px]">
      <div className={`col-span-2 h-[42px] p-1.5 ${surf}`}>
        <HomeRegular size={12} />{bar('w-2/3 mt-1')}
      </div>
      <div className={`h-[42px] p-1.5 ${surf}`}><ChatRegular size={12} />{bar('w-full mt-1')}</div>
      <div className={`h-[42px] p-1.5 ${surf}`}><CalendarLtrRegular size={12} />{bar('w-full mt-1')}</div>
      <div className={`col-span-2 h-[42px] p-1.5 ${surf}`}>
        <GlobeRegular size={12} />{bar('w-1/2 mt-1')}
      </div>
    </div>
  ),
  dock: (
    <Dock>
      <DockIcon label="首页"><HomeRegular size={18} /></DockIcon>
      <DockIcon label="搜索"><SearchRegular size={18} /></DockIcon>
      <span className="dock-sep" />
      <DockIcon label="消息"><ChatRegular size={18} /></DockIcon>
      <DockIcon label="设置"><SettingsRegular size={18} /></DockIcon>
    </Dock>
  ),

  /* ---- 反馈(浮层类手绘静态形态) ---- */
  toast: (
    /* 复用真实 .toast 结构(等级色条 + 图标 + 标题/消息) */
    <div className="toast success w-[200px]! p-2.5! text-[13px]">
      <CheckmarkCircleRegular size={15} className="icon" />
      <div className="body">
        <div className="title">已保存</div>
        <div className="msg">更改已同步到全部设备。</div>
      </div>
    </div>
  ),
  modal: (
    /* ContentDialog 静态化:标题栏 + 正文 + 两个按钮 */
    <div className={`w-[184px] p-3 ${win} shadow-(--shadow-16)`}>
      <div className="flex items-center justify-between">
        <b className="text-[13px]">删除此文件?</b>
        <DismissRegular size={12} className="text-(--text-2)" />
      </div>
      <p className="m-0 my-2 text-[12px] text-(--text-2)">此操作无法撤销。</p>
      <div className="flex justify-end gap-1.5">
        <Button size="small">取消</Button>
        <Button size="small" variant="accent">删除</Button>
      </div>
    </div>
  ),
  drawer: (
    /* 微缩窗口 + 右侧抽屉面板 */
    <div className="relative w-[196px] h-[84px] rounded-md border border-(--card-border) bg-(--layer) overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[88px] bg-(--bg) border-l border-(--stroke)">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-(--divider)">
          <b className="text-[11px]">详情</b>
          <DismissRegular size={10} className="text-(--text-2)" />
        </div>
        <div className="p-2 flex flex-col gap-1.5">{bar('w-full')}{bar('w-5/6')}{bar('w-2/3')}</div>
      </div>
    </div>
  ),
  tooltip: (
    /* [data-tip] 气泡的静态化:气泡 + 目标控件 */
    <div className="flex flex-col items-center gap-1.5">
      <span className={`px-2 py-1 text-[11px] whitespace-nowrap ${surf}`}>立即同步全部数据</span>
      <Button size="small">同步</Button>
    </div>
  ),
  popover: (
    <div className="popover-pop w-[168px]! p-2.5!">
      <div className="popover-title mb-1! text-[12.5px]">代理设置</div>
      <div className="popover-content text-[12px]!">使用系统代理,端口 7890。</div>
    </div>
  ),
  teachingtip: (
    /* TeachingTip 静态化(本体 position:fixed,这里手绘同款气泡 + 小尾巴) */
    <div className={`relative w-[172px] p-2.5 ${surf}`}>
      <div className="flex items-start justify-between gap-1">
        <b className="text-[12.5px]">快速搜索</b>
        <DismissRegular size={10} className="text-(--text-2)" />
      </div>
      <p className="m-0 mt-1 text-[11.5px] text-(--text-2)">按 Ctrl + K 全局搜索命令。</p>
      <span className="absolute left-1/2 -bottom-[4.5px] -translate-x-1/2 rotate-45
                       w-[9px] h-[9px] bg-(--acrylic-bg) border-r border-b border-(--stroke)" />
    </div>
  ),
  infobar: (
    <div className="w-[200px] scale-[0.9]">
      <InfoBar level="success" title="已连接">IPC 通道工作正常。</InfoBar>
    </div>
  ),
  spin: <Spin size={20} tip="加载中" />,
  progress: (
    <div className="flex flex-col gap-2.5 w-[160px]">
      <ProgressBar value={60} showInfo />
      <div className="flex gap-3 items-center">
        <ProgressRing value={70} size={40} showInfo />
        <ProgressRing size={22} />
      </div>
    </div>
  ),

  /* ---- 扩展 ---- */
  popconfirm: (
    /* Popover 浮层壳 + 真实 popconfirm 结构 */
    <div className="popover-pop w-[172px]! p-2.5!">
      <div className="popconfirm-head">
        <span className="popconfirm-icon"><WarningRegular size={13} /></span>
        <span className="popconfirm-title text-[12.5px]">确定删除?</span>
      </div>
      <div className="popconfirm-actions mt-2!">
        <Button size="small">取消</Button>
        <Button size="small" variant="accent" danger>删除</Button>
      </div>
    </div>
  ),
  descriptions: (
    <div className="w-[210px] scale-[0.85]">
      <Descriptions size="small" column={2} items={[
        { label: '用户名', children: '张三' },
        { label: '版本', children: 'v0.1.0' },
        { label: '许可证', children: 'MIT' },
        { label: '状态', children: '已认证' },
      ]} />
    </div>
  ),
  result: (
    <div className="scale-[0.55]">
      <Result status="success" title="提交成功" subTitle="你的操作已成功完成。" />
    </div>
  ),
  tour: (
    /* 复用真实 .tour-pop 结构(步骤指示 + 标题 + 内容 + 操作) */
    <div className="tour-pop min-w-0! w-[164px] p-2.5!">
      <div className="tour-head mb-1!"><span className="tour-step-ind">1 / 3</span></div>
      <div className="tour-title text-[12.5px]">欢迎使用</div>
      <div className="tour-content text-[11.5px]! mb-2!">三步了解主要功能。</div>
      <div className="tour-actions"><Button size="small" variant="accent">下一步</Button></div>
    </div>
  ),
  anchor: (
    <Anchor affix={false} activeKey="sec1" items={[
      { key: 'sec1', href: '#gp-sec1', title: '第一节' },
      { key: 'sec2', href: '#gp-sec2', title: '第二节', children: [{ key: 'sec2-1', href: '#gp-sec2-1', title: '小节' }] },
    ]} />
  ),
  hotkeyinput: (
    <div className="w-[168px]">
      <HotkeyInput defaultValue="Ctrl + K" onChange={noop} />
    </div>
  ),
  cascader: (
    <Cascader value={['zh', 'bj', 'hd']} onChange={noop} aria-label="地区"
      options={[{ value: 'zh', label: '中国', children: [
        { value: 'bj', label: '北京', children: [{ value: 'hd', label: '海淀区' }] },
      ] }]} />
  ),
  transfer: (
    <div className="w-[400px] scale-[0.5]">
      <Transfer
        dataSource={Array.from({ length: 6 }, (_, i) => ({ key: String(i), title: `项目 ${i + 1}` }))}
        targetKeys={['1', '3']}
        titles={['所有项目', '已选项目']}
        render={(item) => item.title}
        onChange={noop} />
    </div>
  ),
  virtuallist: (
    <div className="w-[168px] rounded-md border border-(--card-border) overflow-hidden text-[12px]">
      <VirtualList
        items={Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `列表项 ${i + 1}` }))}
        itemHeight={22} height={76}
        renderItem={(item) => (
          <div className="flex items-center px-2 h-full border-b border-(--stroke)">{item.text}</div>
        )} />
    </div>
  ),

  /* ---- 外壳(微缩线框) ---- */
  appshell: (
    <div className={`w-[188px] h-[88px] overflow-hidden flex flex-col ${win}`}>
      <div className="h-[13px] shrink-0 bg-(--layer) border-b border-(--divider)
                      flex items-center px-1.5 gap-1">
        <span className="w-[6px] h-[6px] rounded-full bg-(--fill-secondary)" />
        <span className="w-[6px] h-[6px] rounded-full bg-(--fill-secondary)" />
        <span className="w-[6px] h-[6px] rounded-full bg-(--accent)" />
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-[34px] shrink-0 bg-(--layer) border-r border-(--divider)
                        flex flex-col gap-1 p-1">
          <span className="h-[10px] rounded-[3px] bg-(--accent)" />
          <span className="h-[10px] rounded-[3px] bg-(--fill-subtle)" />
          <span className="h-[10px] rounded-[3px] bg-(--fill-subtle)" />
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-1">{bar('w-1/2')}{bar('w-full')}{bar('w-3/4')}</div>
      </div>
    </div>
  ),
  titlebar: (
    <div className={`w-[188px] h-[30px] flex items-center gap-1 px-1.5 ${win}`}>
      <ChevronLeftRegular size={11} className="text-(--text-2)" />
      <StackRegular size={11} className="text-(--text-2)" />
      <span className="flex-1 text-center text-[10px] text-(--text-2)">应用标题</span>
      <span className="w-[10px] border-b border-(--text-2)" />
      <span className="w-[9px] h-[9px] border border-(--text-2) rounded-[1px]" />
      <DismissRegular size={11} className="text-(--text-2)" />
    </div>
  ),
  navview: (
    <div className={`w-[188px] h-[84px] flex overflow-hidden ${win}`}>
      <div className="w-[46px] shrink-0 bg-(--layer) border-r border-(--divider)
                      flex flex-col gap-1 p-1.5 text-(--text-2)">
        <HomeRegular size={11} />
        <FolderRegular size={11} />
        <PersonRegular size={11} />
        <SettingsRegular size={11} className="mt-auto" />
      </div>
      <div className="flex-1 p-1.5 flex flex-col gap-1">
        <span className="h-[10px] w-[30px] rounded-[3px] bg-(--accent)" />
        {bar('w-full')}{bar('w-2/3')}
      </div>
    </div>
  ),
};
