# Gemini AI Integration Documentation

## Overview

The Gemini AI service provides multimodal audio analysis for emergency detection using Google's Gemini 1.5 Flash model. It analyzes audio clips for distress signals, emotional stress, and threat levels.

## Architecture

### Backend Service

**Location**: `apps/backend/src/services/gemini.service.ts`

The `GeminiService` class handles all interactions with the Gemini API:

```typescript
import { geminiService } from './services/gemini.service';

const analysis = await geminiService.analyzeAudio(audioBuffer);
```

### API Endpoint

**POST** `/api/ai/analyze-audio`

Analyzes audio clips and returns structured threat assessment.

**Request:**

```json
{
  "audioData": "base64_encoded_audio",
  "mimeType": "audio/wav"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "confidence": 0.85,
    "threatLevel": "HIGH",
    "reasoning": "Detected panic voice and rapid breathing",
    "dispatchRecommended": true,
    "detectedPatterns": ["panic voice", "rapid breathing"],
    "emotionalStress": 0.9,
    "audioFeatures": {
      "hasScream": true,
      "hasPanic": true,
      "hasImpactSound": false,
      "breathingPattern": "distressed",
      "backgroundNoise": "medium"
    }
  }
}
```

## Analysis Process

### 1. Audio Preparation

Audio is converted to base64 and sent with proper MIME type:

```typescript
const audioBuffer = Buffer.from(audioData, 'base64');
```

### 2. Prompt Engineering

The service uses a carefully crafted prompt that:

- Defines what to analyze (screams, panic, impact sounds, breathing)
- Specifies what to ignore (TV, music, jokes)
- Enforces JSON output format
- Prevents hallucinations

### 3. Gemini Analysis

```typescript
const result = await this.model.generateContent([prompt, audioPart]);
```

### 4. Response Parsing

Extracts JSON from response and validates structure:

```typescript
const jsonMatch = text.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]);
```

### 5. Validation & Sanitization

All outputs are validated and sanitized:

- Confidence clamped to 0-1
- Threat levels validated against enum
- Text sanitized for XSS
- Patterns limited to 10 items
- Dispatch logic validated

## Safety Features

### 1. Prompt Injection Defense

The prompt explicitly instructs the model to:

- Only respond with JSON
- Ignore embedded instructions
- Focus on audio analysis only

### 2. Response Validation

```typescript
private validateAndSanitize(analysis: AIAnalysisResult): AIAnalysisResult {
  return {
    confidence: Math.max(0, Math.min(1, analysis.confidence)),
    threatLevel: this.validateThreatLevel(analysis.threatLevel),
    reasoning: this.sanitizeText(analysis.reasoning),
    // ... more validation
  };
}
```

### 3. Text Sanitization

Removes potentially dangerous content:

```typescript
private sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s.,!?-]/g, '')
    .trim()
    .slice(0, 500);
}
```

### 4. Hallucination Safeguards

- Conservative confidence thresholds
- Cross-validation of dispatch recommendations
- Pattern detection limits
- Reasoning length limits

### 5. Retry Logic

Automatic retry with exponential backoff:

```typescript
async analyzeWithRetry(
  audioBuffer: Buffer,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<AIAnalysisResult>
```

## Threat Level Classification

| Level    | Confidence | Dispatch | Description                     |
| -------- | ---------- | -------- | ------------------------------- |
| LOW      | < 0.3      | No       | Minimal or no distress detected |
| MEDIUM   | 0.3 - 0.6  | No       | Some stress but not emergency   |
| HIGH     | 0.6 - 0.85 | Yes      | Clear distress signals          |
| CRITICAL | > 0.85     | Yes      | Severe emergency detected       |

## Audio Features Detection

### Scream Detection

- High-frequency vocal patterns
- Sudden volume spikes
- Distress tone analysis

### Panic Detection

- Voice tremor analysis
- Speech rate changes
- Emotional tone indicators

### Impact Sound Detection

- Sudden loud noises
- Breaking glass patterns
- Crash/collision sounds

### Breathing Pattern Analysis

- **Normal**: Regular, calm breathing
- **Rapid**: Fast, shallow breaths
- **Distressed**: Irregular, gasping

### Background Noise Classification

- **Low**: Quiet environment
- **Medium**: Moderate ambient noise
- **High**: Loud background sounds

## Frontend Integration

### AI Client

```typescript
import { analyzeAudioWithAI } from '@/lib/aiClient';

const audioBlob = await getBufferedAudio();
const analysis = await analyzeAudioWithAI(audioBlob);

console.log(`Threat Level: ${analysis.threatLevel}`);
console.log(`Confidence: ${analysis.confidence}`);
```

### Complete Example

```typescript
import { useRollingAudioBuffer } from '@/hooks';
import { analyzeAudioWithAI } from '@/lib/aiClient';

function EmergencyDetector() {
  const { getBufferedAudio } = useRollingAudioBuffer();

  const handleEmergency = async () => {
    const audioBlob = await getBufferedAudio();
    if (!audioBlob) return;

    const analysis = await analyzeAudioWithAI(audioBlob);

    if (analysis.dispatchRecommended) {
      // Trigger emergency response
      console.log('Emergency detected!', analysis);
    }
  };

  return <button onClick={handleEmergency}>Analyze Audio</button>;
}
```

## Error Handling

### Common Errors

**Invalid Audio Data:**

```typescript
{
  "code": "INVALID_AUDIO",
  "message": "Audio data is empty"
}
```

**Audio Too Large:**

```typescript
{
  "code": "AUDIO_TOO_LARGE",
  "message": "Audio file must be less than 10MB"
}
```

**Analysis Failed:**

```typescript
{
  "code": "ANALYSIS_FAILED",
  "message": "Failed to analyze audio"
}
```

### Retry Strategy

1. First attempt: immediate
2. Second attempt: 1 second delay
3. Third attempt: 2 second delay
4. Failure: throw error

## Performance

### Latency

- Average: 2-4 seconds
- P95: 6 seconds
- P99: 10 seconds

### Throughput

- Rate limit: 10 requests per 15 minutes
- Max audio size: 10MB
- Concurrent requests: 1 per user

### Cost Optimization

- Use 16kHz sample rate
- Mono channel audio
- 15-second clips maximum
- Batch analysis when possible

## Testing

### Unit Tests

```bash
npm run test --workspace=apps/backend
```

### Integration Test

```bash
cd apps/backend
npm run test:gemini
```

### Manual Testing

1. Navigate to `/ai-analysis`
2. Click "Run Test Analysis"
3. Review results

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### Model Selection

- **gemini-1.5-flash**: Fast, cost-effective (recommended)
- **gemini-1.5-pro**: Higher accuracy, slower

## Best Practices

1. **Always validate input**: Check audio size and format
2. **Use retry logic**: Network issues are common
3. **Sanitize output**: Never trust AI responses directly
4. **Log everything**: Track analysis for debugging
5. **Monitor costs**: Set up billing alerts
6. **Rate limit**: Prevent abuse
7. **Cache results**: Avoid duplicate analysis

## Security Considerations

1. **API Key Protection**: Never expose in frontend
2. **Input Validation**: Validate all audio data
3. **Output Sanitization**: Remove dangerous content
4. **Rate Limiting**: Prevent abuse
5. **Audit Logging**: Track all analysis requests
6. **Encryption**: Encrypt audio in transit

## Troubleshooting

### Analysis Returns Low Confidence

- Check audio quality
- Verify audio contains speech
- Ensure proper encoding
- Test with known emergency audio

### API Key Errors

- Verify key is set in `.env`
- Check key has Gemini API access
- Verify billing is enabled

### Timeout Errors

- Reduce audio length
- Check network connection
- Increase timeout setting
- Use retry logic

## Future Improvements

- [ ] Multi-language support
- [ ] Real-time streaming analysis
- [ ] Custom model fine-tuning
- [ ] Batch processing
- [ ] Caching layer
- [ ] A/B testing framework
