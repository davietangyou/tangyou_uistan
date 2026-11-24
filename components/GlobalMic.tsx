/**
 * src/components/GlobalMic.tsx
 *
 * 全局悬浮麦克风组件
 *
 * 职责：
 * 1. 作为一个始终悬浮在页面右下角的按钮存在 (Z-Index 60)。
 * 2. 提供语音输入的入口，点击即可开始/停止录音。
 * 3. 通过视觉状态（颜色、动画、图标）反馈当前的语音服务状态：
 *    - 待机 (Idle): 蓝色，显示麦克风图标。
 *    - 录音中 (Listening): 红色呼吸灯效果，显示停止图标。
 *    - 处理中 (Processing): 灰色，显示旋转 Loading 动画，此时不可点击。
 */

import React from 'react';

interface GlobalMicProps {
    // 是否正在录音 (用户正在说话)
    isListening: boolean;

    // 是否正在处理录音结果 (如等待 API 响应)
    isProcessing: boolean;

    // 点击事件处理函数 (通常触发 start/stop 逻辑)
    onClick: () => void;
}

export const GlobalMic: React.FC<GlobalMicProps> = ({isListening, isProcessing, onClick}) => {
    return (
        <button
            onClick={onClick}
            disabled={isProcessing} // 处理中禁用点击，防止重复提交
            className={`fixed bottom-24 right-4 w-16 h-16 sm:bottom-28 sm:right-6 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all shadow-2xl z-[60] border-4 border-white ${
                isProcessing
                    ? 'bg-slate-400 cursor-wait' // 处理中：灰色
                    : isListening
                        ? 'bg-rose-500 text-white animate-pulse active:scale-90' // 录音中：红色呼吸 + 点击缩放
                        : 'bg-blue-600 text-white active:scale-90'               // 待机：蓝色 + 点击缩放
            }`}
            aria-label={isListening ? "停止錄音" : "開始錄音"}
        >
            {isProcessing ? (
                // 处理中显示旋转菊花
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                // 非处理中显示图标 (录音中显示方块/停止，待机显示麦克风)
                <span className="text-2xl sm:text-4xl">{isListening ? '⏹' : '🎙️'}</span>
            )}
        </button>
    );
};
