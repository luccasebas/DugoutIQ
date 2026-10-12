import React, { useState } from 'react';
import { X, Copy, Check, Volume2, VolumeX, Smartphone, Share2, Sparkles, ShieldCheck } from 'lucide-react';

interface PhoneDugoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  playerName: string;
  role: 'Pitcher' | 'Hitter';
  wordCount: number;
  reportSource?: string;
}

export const PhoneDugoutModal: React.FC<PhoneDugoutModalProps> = ({
  isOpen,
  onClose,
  reportText,
  playerName,
  role,
  wordCount,
  reportSource,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [largeText, setLargeText] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown hashes/asterisks for natural speech
    const spokenText = reportText
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/⚾/g, 'Baseball')
      .replace(/1\.\s*The Quick Take:/i, 'First, The Quick Take:')
      .replace(/2\.\s*What Worked:/i, 'Second, What Worked:')
      .replace(/3\.\s*Actionable Cues & Adjustments:/i, 'Third, Actionable Cues and Adjustments:')
      .replace(/4\.\s*Next Game Focus:/i, 'Fourth, Next Game Focus:');

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.0;
    utterance.pitch = 0.95; // Confident baseball coach cadence
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative flex flex-col items-center max-w-sm w-full my-6">
        {/* Top Controls Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-baseball text-sm">
              <Smartphone className="w-4 h-4 text-orange-400" />
              Dugout Phone View
            </span>
            <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full font-mono">
              {wordCount} Words
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLargeText(!largeText)}
              className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                largeText ? 'bg-orange-600 text-white font-bold' : 'bg-[#0f213b] text-slate-300 hover:text-white'
              }`}
              title="Toggle Large Dugout Sun Font"
            >
              {largeText ? 'A+' : 'A'} Sun Mode
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#0f213b] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smartphone Hardware Frame */}
        <div className="w-full bg-slate-100 dark:bg-[#060e1b] border-4 border-slate-300 dark:border-[#1b355c] rounded-[38px] p-3 shadow-2xl ring-1 ring-slate-200 dark:ring-[#183154] transition-colors">
          {/* Speaker Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-4 bg-slate-200 dark:bg-[#0a1629] rounded-full flex items-center justify-center gap-2 border border-slate-300 dark:border-[#183154]">
              <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-[#183154]" />
              <div className="w-8 h-1 bg-slate-400 dark:bg-[#183154] rounded-full" />
            </div>
          </div>

          {/* Phone Screen Screen Area */}
          <div className="bg-white dark:bg-[#0a1629] rounded-[28px] p-4 text-slate-900 dark:text-slate-100 min-h-[520px] max-h-[620px] overflow-y-auto border border-slate-200 dark:border-[#183154] flex flex-col justify-between transition-colors shadow-inner">
            {/* Screen Header / Team iMessage or Dev App bar */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183154] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs text-white shadow shadow-orange-950/60">
                    ⚾
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-none text-slate-900 dark:text-white font-baseball text-sm">{playerName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-semibold">Stompers Dugout Card</span>
                      {reportSource && (
                        <>
                          <span className="text-slate-400 text-[10px]">&bull;</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold truncate max-w-[130px]">{reportSource}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSpeech}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isSpeaking
                        ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-400 dark:border-orange-500/50 animate-pulse'
                        : 'bg-slate-100 dark:bg-[#060e1b] text-slate-700 dark:text-slate-400 border-slate-300 dark:border-[#183154] hover:text-black dark:hover:text-white'
                    }`}
                    title={isSpeaking ? 'Stop Coach Voice' : 'Play Coach Voice'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#060e1b] text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-[#183154] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Copy for Text Message"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Formatted Report Card */}
              <div className={`space-y-3 leading-relaxed ${largeText ? 'text-[14px]' : 'text-[12px]'}`}>
                {reportText ? (
                  <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 divide-y divide-slate-200 dark:divide-[#183154]/80">
                    {reportText.split('\n\n').map((paragraph, index) => {
                      if (paragraph.startsWith('###')) {
                        return (
                          <div key={index} className="pb-2">
                            <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide font-baseball text-sm">
                              {paragraph.replace('###', '').trim()}
                            </h3>
                          </div>
                        );
                      }

                      if (paragraph.includes('**1. The Quick Take')) {
                        return (
                          <div key={index} className="py-2">
                            <div className="text-[11px] font-bold text-orange-600 dark:text-orange-300 uppercase tracking-wider mb-1 font-baseball text-xs">
                              1. The Quick Take
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {paragraph.replace(/\*\*1\.\s*The Quick Take[^:]*:\*\*/i, '').trim()}
                            </p>
                          </div>
                        );
                      }

                      if (paragraph.includes('**2. What Worked')) {
                        return (
                          <div key={index} className="py-2">
                            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1 font-baseball text-xs">
                              2. What Worked
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 space-y-1 font-medium">
                              {paragraph
                                .replace(/\*\*2\.\s*What Worked[^:]*:\*\*/i, '')
                                .trim()
                                .split('\n')
                                .map((line, lIdx) => (
                                   <div key={lIdx} className="flex items-start gap-1.5">
                                     <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">✓</span>
                                     <span>{line.replace(/^[*-]\s*/, '')}</span>
                                   </div>
                                 ))}
                             </div>
                           </div>
                         );
                       }

                      if (paragraph.includes('One Specific Thing to Improve')) {
                        return (
                          <div key={index} className="py-2.5 bg-orange-100/70 dark:bg-orange-950/30 -mx-2 px-2.5 rounded-lg border border-orange-400/80 dark:border-orange-500/40 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider font-baseball text-xs">
                                3. One Specific Thing to Improve
                              </span>
                              <span className="text-[9px] font-mono text-orange-800 dark:text-orange-400 bg-orange-200/80 dark:bg-orange-500/20 px-1.5 py-0.2 rounded font-bold">
                                Priority Focus
                              </span>
                            </div>
                            <div className="text-slate-900 dark:text-slate-100 space-y-1.5 font-medium">
                              {paragraph
                                .replace(/\*\*3\.\s*One Specific Thing to Improve[^:]*:\*\*/i, '')
                                .trim()
                                .split('\n')
                                .map((line, lIdx) => (
                                  <div key={lIdx} className="flex items-start gap-1.5 text-slate-900 dark:text-slate-200">
                                    <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0">🎯</span>
                                    <span>{line.replace(/^[*-]\s*/, '')}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }

                      if (paragraph.includes('Actionable Cues') || paragraph.includes('Actionable Routine Cues')) {
                        return (
                          <div key={index} className="py-2 bg-slate-100 dark:bg-[#060e1b] -mx-2 px-2.5 rounded-lg border border-slate-200 dark:border-[#183154]">
                            <div className="text-[11px] font-bold text-orange-600 dark:text-orange-300 uppercase tracking-wider mb-1 font-baseball text-xs">
                              Actionable Routine Cues
                            </div>
                            <div className="text-slate-900 dark:text-slate-100 space-y-1.5 font-medium">
                              {paragraph
                                .replace(/\*\*(?:3|4)\.\s*Actionable[^:]*:\*\*/i, '')
                                .trim()
                                .split('\n')
                                .map((line, lIdx) => (
                                  <div key={lIdx} className="flex items-start gap-1.5 text-slate-800 dark:text-slate-200">
                                    <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0">&bull;</span>
                                    <span>{line.replace(/^[*-]\s*/, '')}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }

                      if (paragraph.includes('Next Game Focus')) {
                        return (
                          <div key={index} className="pt-2">
                            <div className="text-[11px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1 font-baseball text-xs">
                              Next Game Focus
                            </div>
                            <div className="p-2 bg-orange-100/80 dark:bg-[#060e1b] border border-orange-400/80 dark:border-orange-500/30 rounded-lg text-orange-950 dark:text-orange-200 font-bold">
                              {paragraph.replace(/\*\*(?:4|5)\.\s*Next Game Focus[^:]*:\*\*/i, '').trim()}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={index} className="py-1 text-slate-700 dark:text-slate-300 font-medium">
                          {paragraph}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-500 text-center italic py-12">No report generated yet.</p>
                )}
              </div>
            </div>

            {/* Quick Action Button for Dugout Phone */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#183154]">
              <button
                onClick={handleCopy}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/60 transition-colors font-baseball text-sm tracking-wide cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy for Athlete iMessage / SMS'}
              </button>
            </div>
          </div>

          {/* Home Bar indicator */}
          <div className="flex justify-center mt-2">
            <div className="w-28 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
