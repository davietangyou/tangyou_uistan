/**
 * Dev-only specimen. Not imported by the application router.
 * Opened only by scripts/verify/fixtures/uikit.html.
 */
import React, {useMemo, useState} from 'react';
import {Button} from './Button';
import {Card} from './Card';
import {Chip} from './Chip';
import {Dialog} from './Dialog';
import {Field} from './Field';
import {IconButton} from './IconButton';
import {ListRow} from './ListRow';
import {SectionHeader} from './SectionHeader';
import {Segmented} from './Segmented';
import {Sheet} from './Sheet';
import {StatTile} from './StatTile';
import {UI_ICON_DEFAULTS, type UiIconName, uiIcons} from './icons';

const PERIODS = [
    {value: 'fasting', label: '空腹'},
    {value: 'after', label: '餐後'},
    {value: 'bed', label: '睡前'},
] as const;

const TOKEN_SWATCHES: Array<{name: string; varName: string; fg?: string}> = [
    {name: 'canvas', varName: '--c-canvas', fg: 'var(--c-ink)'},
    {name: 'surface', varName: '--c-surface', fg: 'var(--c-ink)'},
    {name: 'muted', varName: '--c-surface-muted', fg: 'var(--c-ink)'},
    {name: 'ink', varName: '--c-ink', fg: '#fff'},
    {name: 'ink-2', varName: '--c-ink-2', fg: '#fff'},
    {name: 'ink-3', varName: '--c-ink-3', fg: '#fff'},
    {name: 'sage-100', varName: '--c-sage-100', fg: 'var(--c-sage-700)'},
    {name: 'sage-200', varName: '--c-sage-200', fg: 'var(--c-sage-700)'},
    {name: 'sage-700', varName: '--c-sage-700', fg: '#fff'},
    {name: 'lavender', varName: '--c-lavender-100', fg: 'var(--c-lavender)'},
    {name: 'mist', varName: '--c-mist-100', fg: 'var(--c-mist)'},
    {name: 'butter', varName: '--c-butter-100', fg: 'var(--c-butter)'},
    {name: 'legacy', varName: '--c-brand-legacy', fg: '#fff'},
    {name: 'low', varName: '--c-glucose-low', fg: '#fff'},
    {name: 'target', varName: '--c-glucose-target', fg: '#fff'},
    {name: 'high', varName: '--c-glucose-high', fg: '#fff'},
];

const TYPE_ROWS: Array<{cls: string; label: string; sample: string}> = [
    {cls: 't-caption t-ink-3', label: 'caption', sample: '時間與註釋 14 / 16'},
    {cls: 't-body t-ink', label: 'body', sample: '正文給長者讀，行距要鬆。'},
    {cls: 't-body-strong t-ink', label: 'body-strong', sample: '重點句子用半粗體。'},
    {cls: 't-label t-ink', label: 'label', sample: '按鈕與表單標籤'},
    {cls: 't-title t-ink', label: 'title', sample: '卡片標題 陳伯'},
    {cls: 't-h2 t-ink', label: 'h2', sample: '區塊標題'},
    {cls: 't-h1 t-ink', label: 'h1', sample: '頁面問候'},
    {cls: 't-display-strong t-ink', label: 'display', sample: '7.2'},
];

const ICON_NAMES = Object.keys(uiIcons) as UiIconName[];

const KitColumn: React.FC<{large: boolean; id: string}> = ({large, id}) => {
    const [period, setPeriod] = useState<'fasting' | 'after' | 'bed'>('after');
    const [chip, setChip] = useState('breakfast');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const title = large ? '大字模式' : '標準字';

    return (
        <div id={id} className={large ? 'large-font' : undefined} data-kit-mode={large ? 'large' : 'standard'}>
            <div className="ds-root ds-page" style={{paddingTop: 24, paddingBottom: 48, background: 'var(--c-canvas)'}}>
                <header style={{marginBottom: 24}}>
                    <p className="t-caption t-ink-3" style={{margin: '0 0 4px'}}>設計基座樣張 · 不進應用路由</p>
                    <h1 className="t-h1 t-ink" style={{margin: 0}}>{title}</h1>
                </header>

                <div className="ds-stack-sections">
                    <section>
                        <SectionHeader title="顏色令牌" />
                        <div className="ds-cluster" style={{marginTop: 12}}>
                            {TOKEN_SWATCHES.map((swatch) => (
                                <div
                                    key={swatch.name}
                                    data-token={swatch.varName}
                                    style={{
                                        minWidth: 72,
                                        minHeight: 'var(--touch-min)',
                                        padding: '8px 10px',
                                        borderRadius: 12,
                                        background: `var(${swatch.varName})`,
                                        color: swatch.fg,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {swatch.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="字階" />
                        <Card style={{marginTop: 12}}>
                            {TYPE_ROWS.map((row) => (
                                <div key={row.cls} data-type={row.label} style={{marginBottom: 8}}>
                                    <span className="t-caption t-ink-3" style={{display: 'block'}}>{row.label}</span>
                                    <span className={row.cls} data-type-sample>{row.sample}</span>
                                </div>
                            ))}
                        </Card>
                    </section>

                    <section>
                        <SectionHeader title="數據與狀態" />
                        <div className="ds-stack-cards" style={{marginTop: 12}}>
                            <StatTile label="早餐後血糖" value="7.2" unit="mmol/L" tone="high" statusLabel="偏高 需注意" />
                            <StatTile label="空腹血糖" value="5.4" unit="mmol/L" tone="target" statusLabel="達標" />
                            <StatTile label="低血糖警示" value="3.2" unit="mmol/L" tone="low" statusLabel="過低 請小心" />
                            <StatTile label="資料輔色示例" value="6.8" unit="mmol/L" tone="info" statusLabel="參考數值" />
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="動作" />
                        <Card style={{marginTop: 12}}>
                            <div className="ds-stack-cards">
                                <Button fullWidth>主要動作</Button>
                                <Button variant="secondary" fullWidth>次要動作</Button>
                                <Button variant="ghost" fullWidth>輔助動作</Button>
                                <Button variant="danger" fullWidth>刪除紀錄</Button>
                                <div className="ds-cluster">
                                    <IconButton icon="add" aria-label="新增" tone="ink" />
                                    <IconButton icon="mic" aria-label="開始錄音" />
                                    <IconButton icon="close" aria-label="關閉" tone="plain" />
                                </div>
                            </div>
                        </Card>
                    </section>

                    <section>
                        <SectionHeader title="分段與標籤" />
                        <div className="ds-stack-cards" style={{marginTop: 12}}>
                            <Segmented<'fasting' | 'after' | 'bed'>
                                name={`${id}-period`}
                                aria-label="測量時段"
                                value={period}
                                options={PERIODS}
                                onChange={setPeriod}
                            />
                            <div className="ds-cluster">
                                <Chip selected={chip === 'breakfast'} onClick={() => setChip('breakfast')}>早餐</Chip>
                                <Chip selected={chip === 'lunch'} onClick={() => setChip('lunch')}>午餐</Chip>
                                <Chip selected={chip === 'dinner'} onClick={() => setChip('dinner')}>晚餐</Chip>
                            </div>
                        </div>
                    </section>

                    <section>
                        <SectionHeader title="列表" />
                        <Card flush style={{marginTop: 12, padding: '4px 16px'}}>
                            <ListRow title="今日覆診提醒" description="請帶備藥物清單" leading={<uiIcons.clinic size={22} strokeWidth={1.75} aria-hidden />} onClick={() => undefined} />
                            <ListRow title="飲食習慣" description="少飯、多菜" leading={<uiIcons.edit size={22} strokeWidth={1.75} aria-hidden />} onClick={() => undefined} />
                            <ListRow title="只有說明，不可點" description="靜態列" showChevron={false} />
                        </Card>
                    </section>

                    <section>
                        <SectionHeader title="表單欄位" />
                        <Card style={{marginTop: 12}}>
                            <div className="ds-stack-cards">
                                <Field label="稱呼" hint="例如：陳伯" defaultValue="陳伯" autoComplete="off" />
                                <Field as="select" label="時段" defaultValue="after">
                                    <option value="fasting">空腹</option>
                                    <option value="after">餐後</option>
                                    <option value="bed">睡前</option>
                                </Field>
                                <Field as="textarea" label="備註" hint="可選填" rows={3} />
                                <Field label="錯誤示例" error="請輸入數字" defaultValue="" inputMode="decimal" />
                            </div>
                        </Card>
                    </section>

                    <section>
                        <SectionHeader title="彈層" />
                        <div className="ds-cluster" style={{marginTop: 12}}>
                            <Button variant="secondary" onClick={() => setSheetOpen(true)}>打開底部彈層</Button>
                            <Button variant="secondary" onClick={() => setDialogOpen(true)}>打開對話框</Button>
                        </div>
                        <Sheet open={sheetOpen} title="底部彈層" onClose={() => setSheetOpen(false)}>
                            <p className="t-body t-ink-2">內容區預留安全底部。關閉可用按鈕、遮罩或 Escape。</p>
                            <div style={{marginTop: 16}}>
                                <Button fullWidth onClick={() => setSheetOpen(false)}>完成</Button>
                            </div>
                        </Sheet>
                        <Dialog open={dialogOpen} title="確認刪除？" onClose={() => setDialogOpen(false)}>
                            <p className="t-body t-ink-2">破壞性操作會再確認，且不與主操作同色同位。</p>
                            <div className="ds-stack-cards" style={{marginTop: 16}}>
                                <Button variant="danger" fullWidth onClick={() => setDialogOpen(false)}>確認刪除</Button>
                                <Button variant="ghost" fullWidth onClick={() => setDialogOpen(false)}>取消</Button>
                            </div>
                        </Dialog>
                    </section>

                    <section>
                        <SectionHeader title="圖標映射" />
                        <Card style={{marginTop: 12}}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                    gap: 4,
                                }}
                            >
                                {ICON_NAMES.map((name) => {
                                    const Icon = uiIcons[name];
                                    return (
                                        <span
                                            key={name}
                                            data-icon={name}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                minHeight: 44,
                                                color: 'var(--c-ink-2)',
                                            }}
                                        >
                                            <Icon size={UI_ICON_DEFAULTS.size} strokeWidth={UI_ICON_DEFAULTS.strokeWidth} aria-hidden />
                                            <span className="t-caption">{name}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    );
};

export const UiKitPreview: React.FC<{mode?: 'both' | 'standard' | 'large'}> = ({mode = 'both'}) => {
    const showStandard = mode === 'both' || mode === 'standard';
    const showLarge = mode === 'both' || mode === 'large';
    const queryMode = useMemo(() => {
        if (typeof window === 'undefined') return mode;
        const q = new URLSearchParams(window.location.search).get('mode');
        if (q === 'standard' || q === 'large' || q === 'both') return q;
        return mode;
    }, [mode]);

    const effective = queryMode;

    return (
        <div style={{background: 'var(--c-canvas)', minHeight: '100vh'}}>
            {(effective === 'both' || effective === 'standard') && showStandard ? (
                <KitColumn large={false} id="kit-standard" />
            ) : null}
            {(effective === 'both' || effective === 'large') && showLarge ? (
                <KitColumn large={true} id="kit-large" />
            ) : null}
        </div>
    );
};
