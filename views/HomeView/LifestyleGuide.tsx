import {View} from '../../utils/types';
import {Button, Card} from '../../components/ui';
import type {HomeViewModel} from './useHomeViewModel';

export function LifestyleGuide({vm}: {vm: HomeViewModel}) {
    const {setView, isProfileEnriched} = vm;
    if (isProfileEnriched) return null;

    return (
        <Card>
            <p className="t-body" style={{margin: '0 0 12px'}}>
                已建立基礎資料！可在「個人檔案」進一步完善就醫與生活習慣
            </p>
            <Button variant="secondary" fullWidth onClick={() => setView(View.Me)}>
                去完善
            </Button>
        </Card>
    );
}
