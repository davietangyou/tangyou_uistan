import type {MeViewModel} from './useMeViewModel';
import type {GroupProps} from './MeView';
import {OptionTile, ProfileGroup} from '../ProfileShared/formParts';

export function CaregiverCard({vm, open, onToggle}: {vm: MeViewModel} & GroupProps) {
    const {
        profile,
        setProfile
    } = vm;

    const summary = profile.hasCaregiverSupport
        ? '有家人或照顧者日常協助'
        : profile.hasNoCaregiverSupport
            ? '我獨自一人照顧自己'
            : '未選擇';

    return (
        <ProfileGroup id="caregiver" icon="support" tone="butter" title="家庭照顧支持" summary={summary} open={open} onToggle={onToggle}>
            {/* 4. 家庭照顧支持 */}
            <div className="ds-pf-field" role="group" aria-labelledby="ds-pf-caregiver-label">
                <span className="t-label" id="ds-pf-caregiver-label">家庭照顧支持：</span>
                <div className="ds-pf-options is-two">
                    <OptionTile
                        selected={Boolean(profile.hasCaregiverSupport)}
                        onClick={() => {
                            setProfile({
                                ...profile,
                                hasCaregiverSupport: true,
                                hasNoCaregiverSupport: false
                            });
                        }}
                    >
                        有家人或照顧者日常協助
                    </OptionTile>
                    <OptionTile
                        selected={Boolean(profile.hasNoCaregiverSupport)}
                        onClick={() => {
                            setProfile({
                                ...profile,
                                hasNoCaregiverSupport: true,
                                hasCaregiverSupport: false
                            });
                        }}
                    >
                        我獨自一人照顧自己
                    </OptionTile>
                </div>
            </div>
        </ProfileGroup>
    );
}
