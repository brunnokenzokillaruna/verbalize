import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envFile.match(/ELEVENLABS_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';
const client = new ElevenLabsClient({ apiKey });

async function findWorkingVoices() {
  const response = await client.voices.getAll();
  const premade = response.voices.filter(v => v.category === 'premade');
  
  console.log(`Testing ${premade.length} premade voices...`);
  const working = [];
  
  for (const v of premade) {
    try {
      await client.textToSpeech.convert(v.voiceId, {
        text: "test",
        model_id: "eleven_multilingual_v2"
      });
      console.log(`[SUCCESS] ${v.name} (${v.voiceId}) works!`);
      working.push({ name: v.name, id: v.voiceId, labels: v.labels });
      await new Promise(r => setTimeout(r, 2000)); // prevent 429
    } catch (err) {
      if (err.body && err.body.detail && err.body.detail.code === 'paid_plan_required') {
        // failed as library voice
      } else if (err.body && err.body.detail && err.body.detail.code === 'concurrent_limit_exceeded') {
         console.log(`[RATE LIMIT] testing ${v.name} too fast, wait a sec...`);
         await new Promise(r => setTimeout(r, 2000));
      } else {
        console.error(`[ERROR] ${v.name}:`, err.message);
      }
    }
  }
  
  console.log("WORKING VOICES ON FREE TIER:");
  console.log(JSON.stringify(working, null, 2));
}

findWorkingVoices();
