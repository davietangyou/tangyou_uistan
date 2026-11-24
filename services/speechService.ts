import {transcribeAudio} from './geminiService';

export interface SpeechService {
    start: () => void;
    stop: () => void;
    isSupported: boolean;
}

export interface SpeechCallbacks {
    onResult: (text: string, audioBlob: Blob) => void;
    onStart: () => void;
    onProcessing?: () => void;
    onEnd: () => void;
    onError: (error: any) => void;
}

/**
 * 創建語音識別服務實例
 * 使用 MediaRecorder 錄製音訊，並通過 Google Gemini API 進行語音轉文字
 */
export function createSpeechService(callbacks: SpeechCallbacks): SpeechService {
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let stream: MediaStream | null = null;

    // 檢查瀏覽器是否支援 getUserMedia
    const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // 移除 Data URL 前綴 (例如: "data:audio/webm;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    return {
        isSupported,
        start: async () => {
            if (!isSupported) {
                callbacks.onError(new Error("Browser not supported"));
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({audio: true});
                // 讓瀏覽器選擇支援的最佳 MIME type (通常是 audio/webm;codecs=opus)
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstart = () => {
                    callbacks.onStart();
                };

                mediaRecorder.onstop = async () => {
                    // 通知 UI 進入處理狀態
                    if (callbacks.onProcessing) {
                        callbacks.onProcessing();
                    }

                    // 組合所有的音訊片段
                    // 使用 recorder 實際採用的 mimeType，確保 Gemini 能正確解碼
                    const mimeType = mediaRecorder?.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunks, {type: mimeType});

                    try {
                        // 轉換為 Base64
                        const base64Audio = await blobToBase64(audioBlob);

                        // 呼叫 Gemini API 進行轉錄
                        // 注意：這裡我們會等待 API 返回結果後才調用 onEnd
                        // 這樣在 App.tsx 中，UI 會保持在「錄音/處理中」的狀態
                        const text = await transcribeAudio(base64Audio, mimeType);

                        if (text) {
                            callbacks.onResult(text, audioBlob);
                        }
                    } catch (error) {
                        console.error("Gemini Transcription Failed", error);
                        callbacks.onError(error);
                    } finally {
                        // 清理資源
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                            stream = null;
                        }
                        // 通知 UI 結束
                        callbacks.onEnd();
                    }
                };

                mediaRecorder.start();
            } catch (error) {
                console.error("Microphone access denied or error", error);
                callbacks.onError(error);
            }
        },
        stop: () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        }
    };
}
