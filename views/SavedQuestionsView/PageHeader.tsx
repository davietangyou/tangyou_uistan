import { View } from '../../utils/types';
import { Button } from '../../components/ui';
import type { SavedQuestionsViewModel } from './useSavedQuestionsViewModel';
import { Icon } from './questionUi';

export function PageHeader({vm}: {vm: SavedQuestionsViewModel}) {
    const { setView } = vm;
    return (
        <header className="ds-sq-header">
            <div className="ds-sq-header-text">
                <h2 className="t-h1">問題紀錄</h2>
                <p className="t-body t-ink-2">AI 自動總結常見類別，挑選重要問題加入下次問診清單！</p>
            </div>
            <Button variant="secondary" onClick={() => setView(View.Consult)} className="ds-sq-header-btn">
                <Icon name="consult" />
                <span>問問 AI</span>
            </Button>
        </header>
    );
}
