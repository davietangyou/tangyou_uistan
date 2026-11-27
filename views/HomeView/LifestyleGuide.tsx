import {View} from '../../utils/types';
import {uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function LifestyleGuide({vm}: {vm: HomeViewModel}) {
    const {setView, isProfileEnriched, nextClinicQuestions} = vm;
    const ProfileIcon = uiIcons.profile;
    const SavedIcon = uiIcons.savedQuestions;
    const count = nextClinicQuestions.length;

    if (!isProfileEnriched) {
        const Icon = ProfileIcon;
        return (
            <section className="ds-home-tile ds-home-tile-sage">
                <p className="ds-home-tile-kicker">
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    個人檔案
                </p>
                <p className="ds-home-tile-value ds-home-tile-phrase">待完善</p>
                <p className="ds-home-tile-note">可再補就醫與生活習慣</p>
                <button
                    type="button"
                    className="ds-home-tile-btn ds-control"
                    onClick={() => setView(View.Me)}
                >
                    去完善
                </button>
            </section>
        );
    }

    const Icon = SavedIcon;
    return (
        <section className="ds-home-tile ds-home-tile-lilac">
            <p className="ds-home-tile-kicker">
                <Icon size={18} strokeWidth={1.8} aria-hidden />
                問診清單
            </p>
            <p className="ds-home-tile-value">
                <span>{count}</span>
                <span className="ds-home-tile-unit">題</span>
            </p>
            <p className="ds-home-tile-note">{count === 0 ? '尚未挑選覆診問題' : '已為下次覆診選好'}</p>
            <button
                type="button"
                className="ds-home-tile-btn ds-control"
                onClick={() => setView(View.SavedQuestions)}
            >
                查看清單
            </button>
        </section>
    );
}
