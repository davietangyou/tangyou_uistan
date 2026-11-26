import {View} from '../../utils/types';
import {Button, StatTile} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';
import {glucoseCardStatus, glucosePeriodLabel} from './glucoseStatus';

export function LatestGlucoseCard({vm}: {vm: HomeViewModel}) {
    const {glucoseRecords, setView} = vm;
    const latest = glucoseRecords[0];
    const status = glucoseCardStatus(latest);
    const period = latest ? glucosePeriodLabel(latest) : '';
    const meta = latest
        ? `最後檢測：${latest.date}${period ? ` · ${period}` : ''}`
        : '最後檢測：未有紀錄';

    return (
        <StatTile
            className="ds-home-glucose"
            label="最近血糖"
            value={latest?.value || '--'}
            unit="mmol/L"
            tone={status?.tone ?? 'neutral'}
            statusLabel={status?.statusLabel}
        >
            <p className="t-caption t-ink-3 ds-home-glucose-meta">{meta}</p>
            <Button variant="secondary" fullWidth onClick={() => setView(View.Glucose)}>
                查看紀錄
            </Button>
        </StatTile>
    );
}
