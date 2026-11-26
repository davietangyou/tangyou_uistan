import {useEffect, useState} from 'react';
import type {ClarificationQuestion, DecisionResult, GlucoseRecord, UserProfile} from '../../utils/types';
import * as DataService from '../../services/dataService';

type UploadAudioLog = {
    id: string;
    timestamp: number;
    transcript?: string;
    blob: Blob;
};

type UseDataUploadParams = {
    audioLogs: UploadAudioLog[];
    profile: UserProfile;
    glucoseRecords: GlucoseRecord[];
    concern: string;
    clarifications: ClarificationQuestion[];
    answers: Record<string, string[]>;
    supplementalAnswer: string;
    result: DecisionResult | null;
    consultStep: 'INPUT' | 'CLARIFY' | 'SUPPLEMENT' | 'SELECT_QUESTIONS' | 'RESULT';
};

export function useDataUpload({
    audioLogs,
    profile,
    glucoseRecords,
    concern,
    clarifications,
    answers,
    supplementalAnswer,
    result,
    consultStep,
}: UseDataUploadParams) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadLogs, setUploadLogs] = useState<string[]>([]);

    // 上报完整数据流程 (Refactored using DataService)
    // 核心逻辑保留：遍历录音 -> 上传 -> 获取URL -> 组装JSON -> 上传JSON
    const handleUploadData = async () => {
        setIsUploading(true);
        setUploadLogs([]);
        const addLog = (msg: string) => setUploadLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            addLog('準備開始上報...');

            // 1. 上傳錄音
            const processedAudioLogs = [];
            for (let i = 0; i < audioLogs.length; i++) {
                const log = audioLogs[i];
                const ext = log.blob.type.includes('webm') ? 'webm' :
                    log.blob.type.includes('mp4') ? 'mp4' : 'bin';
                const filename = `audio_${log.timestamp}_${i}.${ext}`;

                addLog(`正在上傳錄音 (${i + 1}/${audioLogs.length}): ${filename}...`);

                try {
                    // 调用 DataService 上传单文件
                    const downloadUrl = await DataService.uploadFile(log.blob, filename);
                    processedAudioLogs.push({
                        id: log.id,
                        timestamp: log.timestamp,
                        transcript: log.transcript,
                        url: downloadUrl
                    });
                    addLog(`錄音 ${i + 1} 上傳成功`);
                } catch (e: any) {
                    addLog(`錄音 ${i + 1} 上傳失敗: ${e.message}`);
                    // 即使失敗也保留紀錄，但沒有 URL
                    processedAudioLogs.push({
                        id: log.id,
                        timestamp: log.timestamp,
                        transcript: log.transcript,
                        url: null,
                        error: e.message
                    });
                }
            }

            // 2. 構建大 JSON
            addLog('正在生成完整數據報告...');
            const fullReport = {
                meta: {
                    generatedAt: new Date().toISOString(),
                    version: '1.0'
                },
                profile: profile,
                glucoseRecords: glucoseRecords,
                consultation: {
                    concern: concern,
                    clarifications: clarifications,
                    answers: answers,
                    supplementalAnswer: supplementalAnswer,
                    result: result
                },
                audioLogs: processedAudioLogs
            };

            const jsonString = JSON.stringify(fullReport, null, 2);
            const jsonBlob = new Blob([jsonString], {type: 'application/json'});
            const jsonFilename = `report_${new Date().getTime()}.json`;

            // 3. 上傳大 JSON
            addLog('正在上傳總覽數據文件...');
            // 调用 DataService 上传报告
            const reportUrl = await DataService.uploadFile(jsonBlob, jsonFilename);

            addLog(`數據文件上傳成功！`);
            addLog(`文件 ID: ${reportUrl.split('/').pop()}`);
            addLog('=== 上報流程完成 ===');

        } catch (e: any) {
            console.error(e);
            addLog(`[錯誤] 上報失敗: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Effect: 當問診報告生成後自動觸發上報
    // 保留未接線能力：Consult 畫面目前是對話式問診，不會把 consultStep 設成 RESULT。
    // 此自動上報仍須保留，不得刪除；將來 UI 重構若要重新接上精靈流程，行為需維持不變。
    useEffect(() => {
        if (consultStep === 'RESULT' && result && !isUploading && uploadLogs.length === 0) {
            handleUploadData();
        }
    }, [consultStep, result]);

    return {isUploading, uploadLogs, handleUploadData};
}
