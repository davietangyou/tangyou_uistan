import {View} from '../../utils/types';
import {uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';
import {glucoseCardStatus, glucosePeriodLabel} from './glucoseStatus';

export function LatestGlucoseCard({vm}: {vm: HomeViewModel}) {
    const {glucoseRecords, setView} = vm;
    const latest = glucoseRecords[0];
    const status = glucoseCardStatus(latest);
    const period = latest ? glucosePeriodLabel(latest) : '';
    const Droplet = uiIcons.glucose;

    return (
        <section className={`ds-home-tile ds-home-tile-sky${status ? ` is-${status.tone}` : ''}`}>
            <p className="ds-home-tile-kicker">
                <Droplet size={18} strokeWidth={1.8} aria-hidden />
                最新血糖
            </p>
            {latest ? (
                <>
                    <p className="ds-home-tile-value">
                        <span>{latest.value}</span>
                        <span className="ds-home-tile-unit">mmol/L</span>
                    </p>
                    {status?.statusLabel && (
                        <p className="ds-home-tile-status">{status.statusLabel}</p>
                    )}
                    <p className="ds-home-tile-note">
                        {latest.date}{period ? ` · ${period}` : ''}
                    </p>
                </>
            ) : (
                <>
                    <p className="ds-home-tile-value ds-home-tile-empty">—</p>
                    <p className="ds-home-tile-note">尚未有血糖紀錄</p>
                </>
            )}
            <button
                type="button"
                className="ds-home-tile-btn ds-control"
                onClick={() => setView(View.Glucose)}
            >
                {latest ? '查看紀錄' : '+ 記錄血糖'}
            </button>
        </section>
    );
}
