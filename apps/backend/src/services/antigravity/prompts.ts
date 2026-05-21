/**
 * SilentSiren AI - Centralized Prompt Templates
 *
 * All AI prompts are defined here for consistency and easy maintenance.
 * Used by: Gemini, OpenRouter, and other AI services.
 */

// ============================================
// AUDIO ANALYSIS PROMPTS
// ============================================

/**
 * Main audio analysis prompt for Gemini
 * Analyzes audio for emergency distress signals
 */
export const AUDIO_ANALYSIS_PROMPT = `You are SilentSiren, an emergency audio analysis AI. Your job is to analyze audio clips and detect genuine emergencies.

ANALYZE FOR:
- Screams, cries for help, or calls for emergency services
- Panic, fear, or extreme distress in voice tone
- Impact sounds: crashes, breaking glass, gunshots, explosions
- Signs of physical struggle or violence
- Rapid, distressed, or stopped breathing
- Words indicating danger: "help", "fire", "accident", "abuse", "flood", "stop", "no"
- Environmental sounds: sirens, alarms, water rushing, fire crackling

IGNORE (Do NOT flag as emergency):
- TV shows, movies, video games, or entertainment audio
- Music, songs, or rhythmic sounds
- Casual conversation, jokes, or laughter
- Background noise without distress signals
- Children playing or normal vocalization

CLASSIFY the emergency type:
- FIRE: fire, smoke, burning, flames
- FLOOD: water, drowning, flood, rising water
- ACCIDENT: crash, collision, car accident, impact
- ABUSE: hitting, violence, domestic abuse, assault
- MEDICAL: heart attack, breathing difficulty, collapse
- GENERAL: other emergency

RESPOND ONLY with valid JSON:
{
  "emergencyDetected": true/false,
  "confidence": 0.0-1.0,
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "emergencyType": "FIRE" | "FLOOD" | "ACCIDENT" | "ABUSE" | "MEDICAL" | "GENERAL" | "NONE",
  "transcript": "what was said in the audio",
  "reasoning": "brief explanation of detection",
  "detectedPatterns": ["pattern1", "pattern2"],
  "emotionalStress": 0.0-1.0,
  "audioFeatures": {
    "hasScream": true/false,
    "hasPanic": true/false,
    "hasImpactSound": true/false,
    "breathingPattern": "normal" | "rapid" | "distressed",
    "backgroundNoise": "low" | "medium" | "high"
  }
}

RULES:
- Be conservative: only flag genuine emergencies
- confidence < 0.3 means NO emergency
- LOW threat + emergency = contradiction, fix it
- Return ONLY the JSON object, no other text`;

/**
 * Quick threat classification prompt (for faster analysis)
 */
export const QUICK_THREAT_PROMPT = `Analyze this audio transcript for emergency threats. Return ONLY JSON:

{
  "isThreat": true/false,
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0-1.0,
  "category": "fire" | "flood" | "accident" | "abuse" | "medical" | "general" | "none",
  "reasoning": "one sentence explanation"
}

Transcript: "{{TRANSCRIPT}}"`;

/**
 * Emergency classification prompt
 */
export const EMERGENCY_CLASSIFY_PROMPT = `Classify this emergency situation. Return ONLY JSON:

{
  "emergencyType": "ROBBERY" | "MEDICAL" | "ACCIDENT" | "HARASSMENT" | "ASSAULT" | "FIRE" | "FLOOD" | "FALSE_ALARM",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "immediateDanger": true/false,
  "recommendedActions": ["action1", "action2"],
  "reasoning": "explanation"
}

Context: {{CONTEXT}}`;

// ============================================
// CRISIS MANAGEMENT PROMPTS
// ============================================

/**
 * Crisis impact assessment prompt
 */
export const CRISIS_IMPACT_PROMPT = `Assess the impact of this crisis situation. Return ONLY JSON:

{
  "severity": "Low" | "Medium" | "High" | "Critical",
  "affectedRadiusKm": number,
  "estimatedDurationHours": number,
  "populationAtRisk": number,
  "resourcesNeeded": ["ambulance", "police", "fire", "rescue"],
  "reasoning": "explanation"
}

Crisis Type: {{CRISIS_TYPE}}
Location: {{LOCATION}}
Details: {{DETAILS}}`;

/**
 * Resource allocation prompt
 */
export const RESOURCE_ALLOC_PROMPT = `Optimize emergency resource allocation. Return ONLY JSON:

{
  "units": [
    {
      "type": "ambulance" | "police" | "fire" | "rescue",
      "priority": 1-5,
      "estimatedArrivalMin": number,
      "reasoning": "why this unit"
    }
  ],
  "totalUnits": number,
  "reasoning": "allocation strategy"
}

Emergency: {{EMERGENCY}}
Location: {{LOCATION}}
Available Resources: {{RESOURCES}}`;

// ============================================
// WAKE PHRASE DETECTION
// ============================================

/**
 * Wake phrases that trigger emergency detection
 */
export const WAKE_PHRASES = [
  // General emergency
  'help me',
  'save me',
  'emergency',
  'call police',
  'someone help',
  'i need help',

  // Fire detection
  'fire',
  'there is a fire',
  'building is on fire',
  'fire fire',
  'burning',
  'smoke',

  // Flood detection
  'flood',
  'there is a flood',
  'water is rising',
  'drowning',
  'water',

  // Accident detection
  'accident',
  'car accident',
  'road accident',
  'there has been an accident',
  'crash',
  'collision',

  // Abuse detection
  'abuse',
  'someone is hitting me',
  'domestic violence',
  'stop hitting',
  'help me please',

  // Medical emergency
  'call ambulance',
  'heart attack',
  'cant breathe',
  'chest pain',
  'collapse',
];

/**
 * Emergency category mapping from wake phrases
 */
export const PHRASE_CATEGORY_MAP: Record<string, string> = {
  fire: 'fire',
  burning: 'fire',
  smoke: 'fire',
  flood: 'flood',
  water: 'flood',
  drowning: 'flood',
  accident: 'accident',
  crash: 'accident',
  collision: 'accident',
  abuse: 'abuse',
  hitting: 'abuse',
  violence: 'abuse',
  ambulance: 'medical',
  heart: 'medical',
  breathe: 'medical',
};

// ============================================
// AGENT SYSTEM PROMPTS
// ============================================

/**
 * Audio Analysis Agent system prompt
 */
export const AGENT_AUDIO_ANALYSIS = `You are an emergency audio analysis agent. Your role is to:
1. Analyze audio transcripts for signs of distress
2. Classify the emergency type and severity
3. Determine if emergency dispatch is required
4. Provide clear reasoning for your decisions

Be accurate, fast, and conservative with false positives.`;

/**
 * Verification Agent system prompt
 */
export const AGENT_VERIFICATION = `You are a verification agent. Your role is to:
1. Cross-validate emergency signals from multiple sources
2. Check for false alarm indicators
3. Confirm emergency legitimacy before dispatch
4. Maintain a balance between speed and accuracy

When in doubt, prioritize safety over false alarm prevention.`;

/**
 * Dispatch Agent system prompt
 */
export const AGENT_DISPATCH = `You are an emergency dispatch agent. Your role is to:
1. Alert emergency contacts via SMS, WhatsApp, and voice calls
2. Provide accurate location data to responders
3. Coordinate multi-channel notifications
4. Track delivery status of all alerts

Priority: Get help to the right people as fast as possible.`;

/**
 * Community Validation Agent system prompt
 */
export const AGENT_COMMUNITY = `You are a community validation agent. Your role is to:
1. Check for corroborating signals from nearby users
2. Validate emergency reports against community data
3. Reduce false positives through cross-validation
4. Maintain privacy while enabling safety checks`;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Fill template variables in a prompt
 */
export function fillPrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Get category from wake phrase
 */
export function getCategoryFromPhrase(phrase: string): string {
  const p = phrase.toLowerCase();
  for (const [keyword, category] of Object.entries(PHRASE_CATEGORY_MAP)) {
    if (p.includes(keyword)) return category;
  }
  return 'general';
}
