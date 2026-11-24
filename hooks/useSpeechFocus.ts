/**
 * src/hooks/useSpeechFocus.ts
 *
 * 语音与焦点逻辑 Hook
 *
 * 职责：
 * 1. 管理全局语音识别服务的生命周期 (Start/Stop/Processing)。
 * 2. 追踪页面上最后一个被聚焦的输入框 (Input/Textarea)，以便语音转文字后能自动填入。
 * 3. 处理语音转文字后的 DOM 操作（自动插入文字、触发 React onChange 事件）。
 * 4. 管理录音文件的播放 (Audio Player)。
 */

import {useEffect, useRef, useState} from 'react';
import {createSpeechService, SpeechService} from '../services/speechService';
import {AudioLog} from '../utils/types';

export const useSpeechFocus = () => {
    // === 状态定义 ===

    // 全局录音与聚焦追踪状态
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFocusToast, setShowFocusToast] = useState(false); // 提示用户点击输入框的 Toast
    const [audioLogs, setAudioLogs] = useState<AudioLog[]>([]); // 本次会话产生的语音记录
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null); // 当前正在播放的音频 ID

    // === Refs 定义 ===

    // 记录最后一个获得焦点的输入框，用于语音输入的目标定位
    const lastFocusedRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    // 语音服务实例引用
    const speechServiceRef = useRef<SpeechService | null>(null);
    // 音频播放元素引用
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // === Effects ===

    // 1. 全局监听 Focus 事件，纪录最后一个被点击的输入框
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            // 只有 INPUT 或 TEXTAREA 才是合法的语音输入目标
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                lastFocusedRef.current = target as HTMLInputElement | HTMLTextAreaElement;
            }
        };
        document.addEventListener('focusin', handleFocus);
        return () => document.removeEventListener('focusin', handleFocus);
    }, []);

    // 2. 提示 "点击即消失" 逻辑
    // 当显示 "请先点击输入框" 的提示时，用户点击任意位置即可关闭提示
    useEffect(() => {
        if (showFocusToast) {
            const dismiss = () => setShowFocusToast(false);
            window.addEventListener('mousedown', dismiss);
            return () => window.removeEventListener('mousedown', dismiss);
        }
    }, [showFocusToast]);

    // 3. 初始化语音服务 (核心逻辑)
    useEffect(() => {
        const getCurrentTime = () => new Date().toLocaleString();
        const getElementLabel = (el: any) => el ? (el.placeholder || el.name || el.id || el.tagName) : '無聚焦元素';

        // 创建语音服务实例
        speechServiceRef.current = createSpeechService({
            onResult: (transcript, audioBlob) => {
                console.log(`转译结果 - ${getCurrentTime()} - ${transcript}`);

                // A. 储存语音纪录
                const newLog: AudioLog = {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    blob: audioBlob,
                    transcript: transcript
                };
                setAudioLogs(prev => [newLog, ...prev]);

                // B. 填入文字到输入框 (DOM 操作)
                const input = lastFocusedRef.current;
                if (input && document.body.contains(input)) {
                    const start = input.selectionStart || 0;
                    const end = input.selectionEnd || 0;
                    const value = input.value;

                    // 在光标位置插入文字
                    const newValue = value.substring(0, start) + transcript + value.substring(end);

                    // 获取 React 内部的 setter，绕过 React 的状态去重机制，确保值能被更新
                    const prototype = Object.getPrototypeOf(input);
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(input, newValue);
                        // 同时触发 input 和 change 事件，确保 React 18+ 的 State 同步机制能捕捉到变化
                        input.dispatchEvent(new Event('input', {bubbles: true}));
                        input.dispatchEvent(new Event('change', {bubbles: true}));
                    } else {
                        input.value = newValue;
                    }

                    // 移动光标到插入文字的后面，并保持聚焦
                    const newCursorPos = start + transcript.length;
                    setTimeout(() => {
                        input.setSelectionRange(newCursorPos, newCursorPos);
                        input.focus();
                    }, 0);
                }
            },
            onStart: () => {
                setIsListening(true);
                setIsProcessing(false);
                console.log(`录音开始 - ${getCurrentTime()} - ${getElementLabel(lastFocusedRef.current)}`);
            },
            onProcessing: () => {
                setIsListening(false);
                setIsProcessing(true);
                console.log(`录音请求 - ${getCurrentTime()}`);
            },
            onEnd: () => {
                setIsListening(false);
                setIsProcessing(false);
                console.log(`录音結束 - ${getCurrentTime()} - ${getElementLabel(lastFocusedRef.current)}`);
            },
            onError: (error) => {
                console.error("Speech recognition error", error);
                setIsListening(false);
                setIsProcessing(false);
            }
        });
    }, []);

    // === Handlers ===

    /**
     * 处理全局麦克风点击事件
     * 负责状态校验、启动/停止录音、以及无焦点时的提示
     */
    const handleGlobalMicClick = () => {
        if (isProcessing) return; // 正在处理请求时（转菊花）不可点击

        // 如果正在录音，点击则停止
        if (isListening) {
            speechServiceRef.current?.stop();
            return;
        }

        // 检查是否有聚焦的输入框
        if (!lastFocusedRef.current || !document.body.contains(lastFocusedRef.current)) {
            setShowFocusToast(true);
            setTimeout(() => setShowFocusToast(false), 3000);
            return;
        }

        // 检查浏览器支持
        if (!speechServiceRef.current?.isSupported) {
            alert("您的瀏覽器不支援語音輸入。");
            return;
        }

        // 启动录音
        try {
            speechServiceRef.current.start();
        } catch (e) {
            console.error("Start recognition failed", e);
            setIsListening(false);
        }
    };

    /**
     * 播放/暂停录音日志
     * @param log 要播放的语音日志对象
     */
    const toggleAudio = (log: AudioLog) => {
        if (playingAudioId === log.id) {
            // 如果点击的是当前正在播放的，则暂停
            audioPlayerRef.current?.pause();
            setPlayingAudioId(null);
        } else {
            // 停止之前的播放
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }

            // 创建新的播放源
            const url = URL.createObjectURL(log.blob);
            const audio = new Audio(url);

            // 播放结束回调
            audio.onended = () => setPlayingAudioId(null);

            audio.play();
            audioPlayerRef.current = audio;
            setPlayingAudioId(log.id);
        }
    };

    return {
        isListening,
        isProcessing,
        showFocusToast,
        audioLogs,
        playingAudioId,
        handleGlobalMicClick,
        toggleAudio
    };
};
