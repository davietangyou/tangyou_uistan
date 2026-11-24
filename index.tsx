import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ------------------------------------------------
// 預防在受限的 Iframe Sandbox 中調用 alert/confirm 等彈窗引發「Script error」或 SecurityError DOMException
try {
    const originalAlert = window.alert;
    window.alert = (message) => {
        console.log('[糖友導航 Iframe-Alert]:', message);
        try {
            originalAlert(message);
        } catch (e) {
            console.warn('window.alert 由於 Iframe 受限或被瀏覽器阻止，已改為控制台輸出或控制點警告：', e);
        }
    };
} catch (e) {
    console.warn('無法安全重寫 window.alert:', e);
}
// ------------------------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);