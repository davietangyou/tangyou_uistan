import {createRoot} from 'react-dom/client';
import {UiKitPreview} from '../../../components/ui/UiKitPreview';

const root = document.getElementById('root');
if (!root) throw new Error('uikit: #root missing');
createRoot(root).render(<UiKitPreview />);
