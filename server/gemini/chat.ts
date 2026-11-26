import { Type } from "@google/genai";
import type { ChatTurn, GlucoseRecord, HbA1cRecord, UserProfile } from "../../utils/types.ts";
import { CLINICAL_KNOWLEDGE } from "../../services/knowledgeBase.ts";
import {
    FULL_ROUTING_CONFIG,
    Scenario,
    checkSafetyGate,
    classifyScenario,
    type SafetyAssessment,
} from "../taxonomy.ts";
import { generateContentWithRetry } from "./errors.ts";
import { MAX_HISTORY_ROUNDS, isPreferenceHistoryText, trimConversationHistory } from "./history.ts";
import { buildChatPrompts } from "./prompts.ts";
import { MAJOR_DECISION_PATTERNS, PREFERENCE_CONTINUATION_PATTERNS, isExplicitComparisonQuery, selectChatModelRoute } from "./routing.ts";

export async function getConversationalChatResponseServer(
    profile: UserProfile,
    glucoseRecords: GlucoseRecord[],
    message: string,
    history: ChatTurn[] = [],
    imageAttachment?: { data: string; mimeType: string },
    hba1cRecords: HbA1cRecord[] = [],
    preferenceAlreadySubmitted: boolean = false
): Promise<any> {
    const safety = checkSafetyGate(message, profile);
    if (safety.triggered && safety.blockLLM) {
        return {
            activeNode: 1,
            decisionType: 'Safety Escalation',
            confidence: 1,
            isLowConfidenceDefaulted: false,
            reply: safety.replyMessage || safety.message || "偵測到可能危及安全的情況，請立即優先尋求醫護或家人協助。",
            safety,
            briefVersion: { takeHomeMessages: [] },
            detailedVersion: {
                optionComparison: [],
                suggestedDiscussionPoints: [],
                generalExplanation: ""
            },
            optionsComparison: [],
            patientValuesSummary: "",
            doctorQuestions: [],
            suggestedFollowUps: [],
            traceability: {
                safetyModeTriggered: true,
                triggeredNodes: ['Node 1 🛡️ 安全監控（確定性規則攔截）'],
                currentStep: 'Node 1',
                sources: []
            }
        };
    }

    const scenarios = classifyScenario(message);
    const activeNodes = FULL_ROUTING_CONFIG.nodes.filter(n => scenarios.includes(n.scenario_group));
    const allSourceOrder = Array.from(new Set(activeNodes.flatMap(n => n.preferred_source_order || [])));
    const knowledgeText = allSourceOrder.slice(0, 3).map(sourceId => {
        const entry = CLINICAL_KNOWLEDGE[sourceId as keyof typeof CLINICAL_KNOWLEDGE];
        return entry ? `【${entry.title}】: ${entry.content}` : "";
    }).filter(t => t !== "").join('\n\n');

    const fullHistory = Array.isArray(history) ? history : [];
    const hasPreferenceInHistory =
        Boolean(preferenceAlreadySubmitted) ||
        fullHistory.some(h => h.role === 'user' && isPreferenceHistoryText(h.content || ''));
    const trimmedHistory = trimConversationHistory(fullHistory, MAX_HISTORY_ROUNDS);
    const isPreferenceResponse = message.includes("我已選擇我的個人偏好") || message.includes("重視：【");
    const hasImage = Boolean(imageAttachment && imageAttachment.data);
    const messageText = (message || '').toLowerCase();
    const hasDecisionContext =
        scenarios.includes(Scenario.DECISION_SUPPORT_PREFERENCE) ||
        MAJOR_DECISION_PATTERNS.some(kw => messageText.includes(kw)) ||
        (hasPreferenceInHistory && PREFERENCE_CONTINUATION_PATTERNS.some(kw => messageText.includes(kw)));
    const isPreferenceContinuation = hasPreferenceInHistory && hasDecisionContext && !isPreferenceResponse;

    const modelRoute = selectChatModelRoute({
        message,
        scenarios,
        isPreferenceResponse,
        preferenceContinuation: isPreferenceContinuation,
        hasImage,
        trimmedHistory: trimmedHistory.turns,
    });
    const isDecisionSensitive =
        isPreferenceContinuation ||
        modelRoute.reason === 'major_decision_support' ||
        modelRoute.reason === 'preference_decision_synthesis' ||
        modelRoute.reason === 'major_decision_followup' ||
        (hasImage && (
            scenarios.includes(Scenario.DECISION_SUPPORT_PREFERENCE) ||
            isPreferenceResponse ||
            MAJOR_DECISION_PATTERNS.some(kw => messageText.includes(kw))
        ));

    const isComparisonRequest = !isDecisionSensitive && isExplicitComparisonQuery(message);

    const { systemInstruction: chatInstruction, userPrompt: prompt } = buildChatPrompts({
        profile,
        knowledgeText,
        hba1cRecords,
        glucoseRecords,
        message,
        trimmedHistory,
        safety,
        hasImage,
        isDecisionSensitive,
        isComparisonRequest,
        isPreferenceResponse,
        hasPreferenceInHistory,
        scenarios,
    });

    const contentParts: any[] = [];
    if (imageAttachment && imageAttachment.data) {
        const cleanBase64 = imageAttachment.data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
        contentParts.push({
            inlineData: {
                mimeType: imageAttachment.mimeType || 'image/jpeg',
                data: cleanBase64
            }
        });
    }
    contentParts.push({ text: prompt });

    const response = await generateContentWithRetry({
        model: modelRoute.model,
        contents: [
            {
                role: "user",
                parts: contentParts
            }
        ],
        config: {
            systemInstruction: chatInstruction,
            thinkingConfig: {
                thinkingLevel: modelRoute.thinkingLevel,
            },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    activeNode: { type: Type.INTEGER },
                    decisionType: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    isLowConfidenceDefaulted: { type: Type.BOOLEAN },
                    explorationQuestion: { type: Type.STRING },
                    preferenceQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                questionText: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            valueCategory: { type: Type.STRING },
                                            label: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ["valueCategory", "label", "description"]
                                    }
                                }
                            },
                            required: ["id", "questionText", "options"]
                        }
                    },
                    reply: { type: Type.STRING },
                    briefVersion: {
                        type: Type.OBJECT,
                        properties: {
                            takeHomeMessages: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["takeHomeMessages"]
                    },
                    detailedVersion: {
                        type: Type.OBJECT,
                        properties: {
                            optionComparison: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        option: { type: Type.STRING },
                                        pros: { type: Type.STRING },
                                        cons: { type: Type.STRING }
                                    },
                                    required: ["option", "pros", "cons"]
                                }
                            },
                            suggestedDiscussionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                            generalExplanation: { type: Type.STRING }
                        }
                    },
                    suggestedFollowUps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    traceability: {
                        type: Type.OBJECT,
                        properties: {
                            safetyModeTriggered: { type: Type.BOOLEAN },
                            triggeredNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            currentStep: { type: Type.STRING }
                        },
                        required: ["safetyModeTriggered", "triggeredNodes", "currentStep"]
                    }
                },
                required: ["activeNode", "decisionType", "confidence", "isLowConfidenceDefaulted", "reply", "suggestedFollowUps", "traceability"]
            }
        }
    });

    const parsed = JSON.parse(response.text || '{}');
    const isDeterministicCaution = Boolean(safety.triggered && !safety.blockLLM);
    const llmTriggeredSafety = !isDeterministicCaution && Boolean(parsed.activeNode === 1 || parsed.traceability?.safetyModeTriggered);
    const resolvedActiveNode = isDeterministicCaution && parsed.activeNode === 1 ? 5 : parsed.activeNode;
    const isStoppedAtSafetyOrPref = llmTriggeredSafety || resolvedActiveNode === 3;
    const matchedSources = isStoppedAtSafetyOrPref ? [] : allSourceOrder.slice(0, 3);
    const existingTraceability = parsed.traceability || {};

    let finalSafety: SafetyAssessment = safety;
    if (llmTriggeredSafety) {
        finalSafety = {
            isEmergency: true,
            triggered: true,
            blockLLM: true,
            severity: 'URGENT',
            category: 'high_risk_unwell',
            title: '安全提醒：請優先尋求醫護協助',
            message: '系統留意到您的情況可能需要即時醫護評估，請勿單靠 AI 回覆，安全第一。',
            replyMessage: '⚠️ 系統留意到您的情況可能需要即時醫護評估，請先停下對話，通知身邊家人或照顧者，並儘快求醫；如情況危急請致電 999。',
            actionSteps: [
                '先停下活動並通知身邊家人或照顧者留意您的身體狀況。',
                '如感到明顯不適或徵狀加重，請儘快前往門診／急症室求醫，或自行致電 999。'
            ],
            contacts: [
                { label: '香港緊急救護服務', number: '999', note: '如情況危急請立即請家人協助或自行致電' }
            ]
        };
    }

    const hardSafetyActive = Boolean(finalSafety.blockLLM || llmTriggeredSafety);
    const resolvedReply = hardSafetyActive && finalSafety.replyMessage
        ? finalSafety.replyMessage
        : parsed.reply;

    return {
        ...parsed,
        reply: resolvedReply,
        activeNode: hardSafetyActive ? 1 : resolvedActiveNode,
        safety: finalSafety,
        traceability: {
            ...existingTraceability,
            safetyModeTriggered: hardSafetyActive,
            sources: Array.isArray(existingTraceability.sources) && existingTraceability.sources.length > 0
                ? existingTraceability.sources
                : matchedSources
        },
        briefVersion: hardSafetyActive ? { takeHomeMessages: [] } : parsed.briefVersion,
        detailedVersion: hardSafetyActive
            ? { optionComparison: [], suggestedDiscussionPoints: [], generalExplanation: "" }
            : parsed.detailedVersion,
        optionsComparison: hardSafetyActive ? [] : (parsed.detailedVersion?.optionComparison || parsed.optionsComparison || []),
        comparisonKind: isDecisionSensitive ? 'decision' : 'knowledge',
        patientValuesSummary: hardSafetyActive ? "" : (parsed.patientValuesSummary || ""),
        doctorQuestions: hardSafetyActive ? [] : (parsed.detailedVersion?.suggestedDiscussionPoints || parsed.doctorQuestions || []),
        suggestedFollowUps: hardSafetyActive ? [] : (parsed.suggestedFollowUps || [])
    };
}

