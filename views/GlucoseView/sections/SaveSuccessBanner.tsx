import type {GlucoseViewModel} from '../useGlucoseViewModel';
import {SyncBanner} from './recordUi';

export function SaveSuccessBanner({vm, syncHint}: {vm: GlucoseViewModel; syncHint: string}) {
    const {saveSuccessMessage} = vm;
    if (!saveSuccessMessage) return null;
    return <SyncBanner message={saveSuccessMessage} hint={syncHint} />;
}
