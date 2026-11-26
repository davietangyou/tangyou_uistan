import type {AudioLog, ClarificationQuestion, DecisionResult, UserProfile} from '../../utils/types';

export interface DetailViewProps {
    // 基礎數據
    profile: UserProfile;
    concern: string;
    clarifications: ClarificationQuestion[];

    // 變更：answers 類型更新為 string[] 以支持多選
    answers: Record<string, string[]>;
    // 新增：補充回答字段
    supplementalAnswer: string;

    result: DecisionResult | null;

    // 語音記錄 (當前會話)
    audioLogs: AudioLog[];
    playingAudioId: string | null;
    toggleAudio: (log: AudioLog) => void;

    // 數據上報狀態
    isUploading: boolean;
    handleUploadData: () => Promise<void>;
    uploadLogs: string[];
}
