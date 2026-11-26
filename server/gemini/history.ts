import type { ChatTurn } from "../../utils/types.ts";

export const MAX_HISTORY_ROUNDS = 8;
const MAX_HISTORY_TURN_CHARS = 600;
const MAX_PREFERENCE_TURN_CHARS = 2000;

const ERROR_REPLY_PREFIXES = [
    "⚠️ 唔好意思，系統暫時未能完成回覆",
    "唔好意思，系統暫時未能完成回覆",
];

export function isPreferenceHistoryText(text: string): boolean {
    return text.includes("我已選擇我的個人偏好") || text.includes("重視：【");
}

function isValidHistoryTurn(turn: ChatTurn | null | undefined): turn is ChatTurn {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) return false;
    if (typeof turn.content !== 'string') return false;
    const text = turn.content.trim();
    if (!text) return false;
    if (turn.role === 'assistant') {
        if (ERROR_REPLY_PREFIXES.some(prefix => text.startsWith(prefix))) return false;
        if (text === "關於糖尿病管理，\n您目前最關心什麼？") return false;
    }
    return true;
}

export interface TrimmedHistoryResult {
    turns: ChatTurn[];
    keptRounds: number;
    omittedMessages: number;
    totalValidMessages: number;
}

export function trimConversationHistory(
    history: ChatTurn[] = [],
    maxRounds: number = MAX_HISTORY_ROUNDS
): TrimmedHistoryResult {
    const safeMaxRounds = Math.max(1, Math.floor(maxRounds));
    const maxMessages = safeMaxRounds * 2;

    const validTurns: ChatTurn[] = [];
    for (const rawTurn of Array.isArray(history) ? history : []) {
        if (!isValidHistoryTurn(rawTurn)) continue;
        const cleanedContent = rawTurn.content.trim();
        const prev = validTurns[validTurns.length - 1];
        if (prev && prev.role === 'user' && rawTurn.role === 'user' && prev.content === cleanedContent) {
            continue;
        }
        const limit = isPreferenceHistoryText(cleanedContent)
            ? MAX_PREFERENCE_TURN_CHARS
            : MAX_HISTORY_TURN_CHARS;
        validTurns.push({
            role: rawTurn.role,
            content: cleanedContent.length > limit
                ? `${cleanedContent.slice(0, limit)}…（早期內容已精簡）`
                : cleanedContent,
        });
    }

    if (validTurns.length === 0) {
        return { turns: [], keptRounds: 0, omittedMessages: 0, totalValidMessages: 0 };
    }

    const selectedReversed: ChatTurn[] = [];
    let userRoundCount = 0;

    for (let i = validTurns.length - 1; i >= 0; i--) {
        const turn = validTurns[i];
        if (selectedReversed.length >= maxMessages) break;

        if (turn.role === 'user') {
            if (userRoundCount >= safeMaxRounds) break;
            userRoundCount++;
            selectedReversed.push(turn);
        } else {
            selectedReversed.push(turn);
        }
    }

    const windowTurns = selectedReversed.reverse();

    const lastPreferenceTurn = [...validTurns]
        .reverse()
        .find(t => t.role === 'user' && isPreferenceHistoryText(t.content));
    if (lastPreferenceTurn && !windowTurns.some(t => t.role === 'user' && isPreferenceHistoryText(t.content))) {
        windowTurns.unshift(lastPreferenceTurn);
    }

    while (windowTurns.length > 0 && windowTurns[0].role === 'assistant') {
        windowTurns.shift();
    }

    const keptRounds = windowTurns.filter(t => t.role === 'user').length;
    const omittedMessages = Math.max(0, validTurns.length - windowTurns.length);

    return {
        turns: windowTurns,
        keptRounds,
        omittedMessages,
        totalValidMessages: validTurns.length,
    };
}

export function formatHistoryContext(trimmed: TrimmedHistoryResult): string {
    if (!trimmed.turns || trimmed.turns.length === 0) return "這是對話的開始。";

    const lines = trimmed.turns.map(
        turn => `${turn.role === 'user' ? '病人' : '助理'}: ${turn.content}`
    );

    if (trimmed.omittedMessages > 0) {
        return `（系統僅保留最近 ${trimmed.keptRounds} 輪有效對話，以及最近一次已提交偏好（如有）；更早的歷史對話已省略。請聚焦最新用戶訊息與近期脈絡，勿受早期無關話題干擾）\n${lines.join('\n')}`;
    }

    return lines.join('\n');
}

