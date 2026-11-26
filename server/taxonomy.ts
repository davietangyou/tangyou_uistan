/**
 * Safety gate, scenario classification, and routing taxonomy.
 * Stable entry imported by server/gemini/*. Implementations live in server/taxonomy/.
 */
export { Scenario } from './taxonomy/types.ts';
export type { ScenarioValue, SafetyCategory, SafetySeverity, SafetyContact, SafetyAssessment } from './taxonomy/types.ts';
export { FULL_ROUTING_CONFIG } from './taxonomy/routingConfig.ts';
export { checkSafetyGate } from './taxonomy/safetyGate.ts';
export { classifyScenario, needsValueClarification } from './taxonomy/classify.ts';
