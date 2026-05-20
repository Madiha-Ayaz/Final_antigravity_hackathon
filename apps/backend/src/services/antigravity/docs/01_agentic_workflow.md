# Prompt 1: Multi-Agent AI Workflow (SilentSiren Core)
**Source**: Conversation 9917461c
**Date**: 2026-05-14

## Request:
Build an Agentic AI workflow for my existing project "SilentSiren AI" using Google Antigravity.

My existing web application already:
- captures ambient audio from browser
- detects distress keywords/sounds
- fetches live GPS location
- sends emergency alerts to trusted contacts

I want Antigravity to act as the orchestration and reasoning layer.

Create a multi-agent workflow with the following agents:

1. Audio Analysis Agent
- analyze incoming audio transcript/audio context
- detect panic, screams, distress, robbery, accident indicators
- filter jokes, TV noise, casual conversations
- generate confidence score (Low/Medium/High)

2. Verification Agent
- trigger a 10-second “I am Safe” countdown
- cancel alert if user authenticates successfully
- continue escalation if no response

3. Community Validation Agent
- check if nearby users/devices triggered similar emergency patterns
- validate incident if multiple distress signals occur in same GPS radius

4. Dispatch Agent
- trigger automated emergency SMS alerts via Twilio
- include GPS location link in the message

5. Logging & Reasoning Agent (The "Antigravity Trace")
- log the "thought process" of each agent
- explain why a certain decision was made (e.g., "Filtered as joke because transcript contained laughter emojis")
- output a JSON trace of the entire reasoning chain
