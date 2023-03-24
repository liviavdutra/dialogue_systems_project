/// <reference types="react-scripts" />

declare module "react-speech-kit";
declare module "web-speech-cognitive-services/lib/SpeechServices/TextToSpeech";
declare module "web-speech-cognitive-services/lib/SpeechServices/SpeechToText";

interface Hypothesis {
  utterance: string;
  confidence: number;
}

interface MySpeechSynthesisUtterance extends SpeechSynthesisUtterance {
  new (s: string);
}

interface MySpeechRecognition extends SpeechRecognition {
  new (s: string);
}

interface Parameters {
  ttsVoice: string;
  ttsLexicon: string;
  asrLanguage: string;
  azureKey: string;
  azureNLUKey: string;
  azureNLUUrl: string;
  azureNLUprojectName: string;
  azureNLUdeploymentName: string;
}

interface ChatInput {
  past_user_inputs: string[];
  generated_responses: string[];
  text: string;
}

interface SDSContext {
  count: number;
  parameters: Parameters;
  asr: SpeechRecognition;
  tts: SpeechSynthesis;
  voice: SpeechSynthesisVoice;
  ttsUtterance: MySpeechSynthesisUtterance;
  recResult: Hypothesis[];
  nluResult: any;
  ttsAgenda: string;
  azureAuthorizationToken: string;
  audioCtx: any;

  title: any;
  day: any;
  affirm: any;
  reject: any;
  time: any;
  famous: any;
  username:any;
  question: any;
  request: any;
  name: any;
  information:any;
  prediction: any;
  topintent: any;
  celebname:any;
  topic: string;
  text:any;
  entities:any;
  words:any;
  userword:any;
  word:any;
  unusedWords:any;
  score:any;
  newUnusedWords:any;
  repeat:any;
}

type SDSEvent =
  | { type: "TTS_READY" }
  | { type: "TTS_ERROR" }
  | { type: "CLICK" }
  | { type: "SELECT"; value: any }
  | { type: "STARTSPEECH" }
  | { type: "RECOGNISED" }
  | { type: "ASRRESULT"; value: Hypothesis[] }
  | { type: "ENDSPEECH" }
  | { type: "LISTEN" }
  | { type: "TIMEOUT" }
  | { type: "SPEAK"; value: string };
