/**
 * src/components/GlobalMic.tsx
 *
 * 全局悬浮麦克风组件（階段三外殼）
 *
 * 职责：
 * 1. 悬浮在底部导航上方、應用欄右側 (Z-Index 60)，不壓在導航上；頁面底部留白見 app.css 的 --shell-clearance。
 * 2. 提供语音输入的入口，点击即可开始/停止录音。
 * 3. 通过视觉状态（颜色、动画、图标）反馈当前的语音服务状态：
 *    - 待机 (Idle): 白色輕浮鈕（階段 S2），显示麦克风图标。
 *    - 录音中 (Listening): 红色呼吸效果，显示停止图标。
 *    - 处理中 (Processing): 灰色，显示旋转 Loading 动画，此时不可点击。
 */

import React from 'react';
import {uiIcons} from './ui/icons';

interface GlobalMicProps {
    // 是否正在录音 (用户正在说话)
    isListening: boolean;

    // 是否正在处理录音结果 (如等待 API 响应)
    isProcessing: boolean;

    // 点击事件处理函数 (通常触发 start/stop 逻辑)
    onClick: () => void;
}

export const GlobalMic: React.FC<GlobalMicProps> = ({isListening, isProcessing, onClick}) => {
    const MicIcon = uiIcons.mic;
    const StopIcon = uiIcons.stop;
    const stateClass = isProcessing
        ? ' ds-shell-mic-processing'
        : isListening
            ? ' ds-shell-mic-listening'
            : '';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isProcessing} // 处理中禁用点击，防止重复提交
            className={`ds-root ds-shell-mic ds-control print:hidden${stateClass}`}
            aria-label={isListening ? "停止錄音" : "開始錄音"}
        >
            {isProcessing ? (
                // 处理中显示旋转菊花
                <span className="ds-shell-mic-spinner" aria-hidden />
            ) : isListening ? (
                <StopIcon size={26} strokeWidth={2} fill="currentColor" aria-hidden />
            ) : (
                <MicIcon size={28} strokeWidth={2} aria-hidden />
            )}
        </button>
    );
};
