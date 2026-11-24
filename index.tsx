import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 檢查 window.fetch 是否可寫入，
 * 這是為了在某些受限環境中安全地進行 API 攔截。
 */
function isFetchWritable(): boolean {
    try {
        if (typeof window.fetch !== 'function') return false;
        const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
        if (!descriptor) return true;
        if (descriptor.writable === false) return false;
        const originalFetch = window.fetch;
        const testFetch: any = () => {
        };
        (window as any).fetch = testFetch;
        const modified = (window.fetch as any) === testFetch;
        window.fetch = originalFetch;
        return modified;
    } catch (error) {
        console.warn('檢測到 window.fetch 不可修改:', error);
        return false;
    }
}

// 使用示例
console.log('window.fetch 是否可修改:', isFetchWritable());

// --- 全局請求攔截器 (Global Fetch Interceptor) ---
// 這是為了強制重定向 Google Gemini SDK 發出的 API 請求。
// SDK 預設會請求 generativelanguage.googleapis.com
// 這裡將其攔截並修改為 tangyou-app.alphathought.org
if (isFetchWritable()) {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        let [resource, config] = args;

        // 情況 1: resource 是一個 URL 字串
        if (typeof resource === 'string') {
            if (resource.includes('generativelanguage.googleapis.com') && (false
                || resource.includes('/v1beta/models/')
            )) {
                resource = resource.replace(
                    'generativelanguage.googleapis.com',
                    'tangyou-app.alphathought.org'
                );
            }
        }
        // 情況 2: resource 是一個 Request 對象 (雖然 SDK 通常使用字串，但為了保險起見也處理此情況)
        else if (resource instanceof Request) {
            const url = resource.url;
            if (url.includes('generativelanguage.googleapis.com') && (false
                || url.includes('/v1beta/models/')
            )) {
                const newUrl = url.replace(
                    'generativelanguage.googleapis.com',
                    'tangyou-app.alphathought.org'
                );
                // 建立一個新的 Request 對象指向新地址
                resource = new Request(newUrl, resource);
            }
        }

        return originalFetch(resource, config);
    };
}

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
