import {
  ChatTurn,
  ClarificationQuestion,
  DecisionResult,
  GlucoseRecord,
  UserProfile,
} from '../utils/types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { error?: string })?.error || `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export async function getClarificationQuestions(
  profile: UserProfile,
  glucoseRecords: GlucoseRecord[],
  concern: string,
  history: ChatTurn[] = []
): Promise<ClarificationQuestion[]> {
  return postJson<ClarificationQuestion[]>('/api/gemini/clarification-questions', {
    profile,
    glucoseRecords,
    concern,
    history,
  });
}

export async function getSuggestedQuestions(
  profile: UserProfile,
  concern: string,
  answers: { question: string; answer: string }[],
  supplement: string,
  history: ChatTurn[] = []
): Promise<string[]> {
  return postJson<string[]>('/api/gemini/suggested-questions', {
    profile,
    concern,
    answers,
    supplement,
    history,
  });
}

export async function getFinalDecisionResult(
  profile: UserProfile,
  glucoseRecords: GlucoseRecord[],
  concern: string,
  answers: { question: string; answer: string }[],
  selectedQuestions: string[],
  supplement: string,
  history: ChatTurn[] = []
): Promise<DecisionResult> {
  return postJson<DecisionResult>('/api/gemini/final-decision', {
    profile,
    glucoseRecords,
    concern,
    answers,
    selectedQuestions,
    supplement,
    history,
  });
}

export async function getDeeperEducationResult(
  profile: UserProfile,
  parentResult: DecisionResult,
  history: ChatTurn[] = []
): Promise<{ topic: string; content: string; options: string[] }> {
  return postJson<{ topic: string; content: string; options: string[] }>(
    '/api/gemini/deeper-education',
    {
      profile,
      parentResult,
      history,
    }
  );
}

export async function getDeeperChoiceResult(
  profile: UserProfile,
  parentResult: DecisionResult,
  history: ChatTurn[] = []
): Promise<{ topic: string; content: string; options: string[] }> {
  return postJson<{ topic: string; content: string; options: string[] }>(
    '/api/gemini/deeper-choice',
    {
      profile,
      parentResult,
      history,
    }
  );
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const result = await postJson<{ text: string }>('/api/gemini/transcribe-audio', {
    base64Audio,
    mimeType,
  });
  return result.text || '';
}

export async function getConversationalChatResponse(
  profile: UserProfile,
  glucoseRecords: GlucoseRecord[],
  message: string,
  history: ChatTurn[] = [],
  imageAttachment?: { data: string; mimeType: string }
): Promise<any> {
  return postJson<any>('/api/gemini/chat', {
    profile,
    glucoseRecords,
    message,
    history,
    imageAttachment,
  });
}

export async function analyzeSavedQuestions(questions: string[]): Promise<{
  summary: string;
  categories?: {
    categoryName: string;
    description: string;
    frequency: string;
  }[];
  recommendedQuestions: {
    question: string;
    categoryTag?: string;
  }[];
  suggestedDoctorPrep?: string[];
}> {
  return postJson('/api/gemini/analyze-saved-questions', { questions });
}

export async function generateDailyTipFromHKWebsites(): Promise<{
  icon: string;
  title: string;
  desc: string;
  tag: string;
  source: string;
  url?: string;
}> {
  return postJson('/api/gemini/daily-tip', {});
}

export async function recognizeMedicationsFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  medications: { name: string; dosage?: string; usage?: string }[];
  rawNotes?: string;
}> {
  return postJson('/api/gemini/recognize-medications', { imageBase64, mimeType });
}
