import {View} from '../../utils/types';
import {Button, uiIcons} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function LifestyleGuide({vm}: {vm: HomeViewModel}) {
    const {setView, isProfileEnriched} = vm;
    if (isProfileEnriched) return null;
    const ProfileIcon = uiIcons.profile;

    return (
        <section className="ds-home-enrich">
            <div className="ds-home-enrich-row">
                <span className="ds-home-enrich-mark" aria-hidden><ProfileIcon size={24} strokeWidth={2} /></span>
                <p className="t-body">
                    已建立基礎資料！可在「個人檔案」進一步完善就醫與生活習慣
                </p>
            </div>
            <Button variant="secondary" fullWidth onClick={() => setView(View.Me)}>
                去完善
            </Button>
        </section>
    );
}
