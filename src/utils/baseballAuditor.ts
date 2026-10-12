export interface ReportAuditResult {
  wordCount: number;
  wordCountValid: boolean;
  jargonDetected: string[];
  feelCuesDetected: string[];
  sectionsFound: {
    quickTake: boolean;
    whatWorked: boolean;
    actionableCues: boolean;
    nextGameFocus: boolean;
  };
  isValidFormat: boolean;
}

const BANNED_JARGON = [
  'delta',
  'p-value',
  'p value',
  'standard deviation',
  'statistically significant',
  'statistical significance',
  'regression',
  'coefficient of variation',
  'variance calculation',
  'standard error',
  't-test',
  'sample size constraint',
];

const FEEL_CUES = [
  'stay on top',
  'popping out of hand',
  'downward bite',
  'sharp bite',
  'drive leg',
  'chest posture',
  'finish through',
  'expand',
  'expanding',
  'hunt',
  'heart of the plate',
  'shorten',
  'load earlier',
  'line drive window',
  'stay through the ball',
  'roll over',
  'bury',
  'arm slot',
  'extension',
  'ride',
  'carry',
  'fade',
  'cut',
  'barrel',
  'hot spot',
];

export function auditPlayerReport(text: string): ReportAuditResult {
  const cleanText = text.trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const lower = cleanText.toLowerCase();

  const jargonDetected: string[] = [];
  for (const term of BANNED_JARGON) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(lower)) {
      jargonDetected.push(term);
    }
  }

  const feelCuesDetected: string[] = [];
  for (const cue of FEEL_CUES) {
    if (lower.includes(cue)) {
      feelCuesDetected.push(cue);
    }
  }

  const sectionsFound = {
    quickTake: /1\.\s*The Quick Take/i.test(cleanText) || /The Quick Take/i.test(cleanText),
    whatWorked: /2\.\s*What Worked/i.test(cleanText) || /What Worked/i.test(cleanText),
    actionableCues: /Actionable Cues/i.test(cleanText) || /One Specific Thing to Improve/i.test(cleanText),
    nextGameFocus: /(?:4|5)\.\s*Next Game Focus/i.test(cleanText) || /Next Game Focus/i.test(cleanText),
  };

  const isValidFormat =
    sectionsFound.quickTake &&
    sectionsFound.whatWorked &&
    sectionsFound.actionableCues &&
    sectionsFound.nextGameFocus;

  return {
    wordCount,
    wordCountValid: wordCount > 0 && wordCount <= 250,
    jargonDetected,
    feelCuesDetected,
    sectionsFound,
    isValidFormat,
  };
}
