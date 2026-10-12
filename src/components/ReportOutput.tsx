import React, { useState } from 'react';
import { auditPlayerReport, ReportAuditResult } from '../utils/baseballAuditor';
import { 
  Copy, 
  Check, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Share2, 
  FileText, 
  Printer,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { PhoneDugoutModal } from './PhoneDugoutModal';

interface ReportOutputProps {
  reportText: string;
  role: 'Pitcher' | 'Hitter';
  playerName: string;
  outing: string;
  reportSource?: string;
  failoverOccurred?: boolean;
  isLoading?: boolean;
}

export const ReportOutput: React.FC<ReportOutputProps> = ({
  reportText,
  role,
  playerName,
  outing,
  reportSource,
  failoverOccurred,
  isLoading = false,
}) => {
  const [copiedType, setCopiedType] = useState<'markdown' | 'sms' | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audit: ReportAuditResult = auditPlayerReport(reportText);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(reportText);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopySMS = () => {
    // Strip markdown formatting for clean plain-text texting
    const sms = reportText
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/^[*-]\s+/gm, '• ')
      .trim();
    navigator.clipboard.writeText(sms);
    setCopiedType('sms');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
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
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#0a1629] border border-slate-200 dark:border-[#1b355c] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center shadow-xl transition-colors">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">⚾</div>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 font-baseball tracking-wider text-lg uppercase">Synthesizing Dugout Report Card...</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
          Translating complex pitch movement, exit velo, and chase rates into actionable, feel-based player cues for the next bullpen & cage session.
        </p>
      </div>
    );
  }

  if (!reportText) {
    return (
      <div className="bg-white dark:bg-[#0a1629]/90 border border-slate-200 dark:border-[#1b355c] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center shadow-xl transition-colors">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#0d1e38] border border-slate-300 dark:border-[#1e3d6b] flex items-center justify-center text-2xl mb-3 text-orange-600 dark:text-orange-400 shadow-inner">
          ⚾
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 font-baseball tracking-wider uppercase text-lg">No Dugout Report Generated Yet</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
          Select a team and player on the left, then click <strong className="text-orange-600 dark:text-orange-400 font-semibold">"Generate"</strong> to produce their feel-based dugout report card.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a1629] border border-slate-200 dark:border-[#1b355c] rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden flex flex-col justify-between">
      {/* Top Banner / Audit Bar */}
      <div className="bg-slate-50 dark:bg-[#060e1b] border-b border-slate-200 dark:border-[#183154] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-baseball text-base">
            <span>⚾</span>
            Official Dugout Report Card
          </span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold ${
            audit.wordCountValid
              ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30'
              : 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/30'
          }`}>
            {audit.wordCount} / 250 Words {audit.wordCountValid ? '✓ (Mobile Compliant)' : '⚠️ Exceeds Limit'}
          </span>
          {reportSource && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              <span>{reportSource}</span>
            </span>
          )}
          {failoverOccurred && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 font-bold flex items-center gap-1 shadow-sm" title="Seamlessly switched to alternate Gemini model due to peak traffic on primary version">
              <span>⚡ High-Traffic Failover</span>
            </span>
          )}
        </div>

        {/* Jargon Compliance Badge */}
        <div className="flex items-center gap-2">
          {audit.jargonDetected.length === 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>0 Academic Jargon &bull; 100% Feel Cues</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Flagged Terms: {audit.jargonDetected.join(', ')}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPhoneModalOpen(true)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#0f213b] hover:bg-slate-200 dark:hover:bg-[#18345c] border border-slate-300 dark:border-[#1c3a64] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Preview on Smartphone Screen"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Dugout Phone</span>
            </button>
            <button
              onClick={handleSpeech}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-400 dark:border-orange-500/50 animate-pulse'
                  : 'bg-slate-100 dark:bg-[#0f213b] hover:bg-slate-200 dark:hover:bg-[#18345c] text-slate-800 dark:text-slate-300 border-slate-300 dark:border-[#1c3a64]'
              }`}
              title={isSpeaking ? 'Stop Coach Voice' : 'Listen with Coach Voice (Audio Readout)'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Render sections formatted strictly */}
        <div className="space-y-6">
          {reportText.split('\n\n').map((block, idx) => {
            // Header: ### ⚾ Player Report
            if (block.startsWith('###')) {
              return (
                <div key={idx} className="border-b border-slate-200 dark:border-[#183154] pb-3 flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2 font-baseball uppercase">
                    {block.replace('###', '').trim()}
                  </h2>
                </div>
              );
            }

            // Section 1: The Quick Take
            if (block.includes('**1. The Quick Take')) {
              const content = block.replace(/\*\*1\.\s*The Quick Take[^:]*:\*\*/i, '').trim();
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154]">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider font-baseball text-sm">
                    <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>1. The Quick Take</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-100 text-sm md:text-base leading-relaxed font-medium">
                    {content}
                  </p>
                </div>
              );
            }

            // Section 2: What Worked
            if (block.includes('**2. What Worked')) {
              const content = block.replace(/\*\*2\.\s*What Worked[^:]*:\*\*/i, '').trim();
              const bullets = content.split('\n').filter((l) => l.trim().length > 0);
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154]">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider font-baseball text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>2. What Worked (Sustain in Routine)</span>
                  </div>
                  <div className="space-y-2">
                    {bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed font-medium">{bullet.replace(/^[*-]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Section 3: One Specific Thing to Improve (From CSV Data)
            if (block.includes('**3. One Specific Thing to Improve') || block.includes('One Specific Thing to Improve')) {
              const content = block.replace(/\*\*3\.\s*One Specific Thing to Improve[^:]*:\*\*/i, '').trim();
              const bullets = content.split('\n').filter((l) => l.trim().length > 0);
              return (
                <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-orange-100/70 via-white to-orange-50/50 dark:from-orange-950/40 dark:via-[#0a1629] dark:to-[#060e1b] border-2 border-orange-500/80 shadow-md dark:shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-xs uppercase tracking-wider font-baseball text-sm">
                      <Target className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-pulse" />
                      <span>3. One Specific Thing to Improve (From CSV Data)</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 px-2.5 py-0.5 rounded-full uppercase">
                      Priority Focus
                    </span>
                  </div>
                  <div className="space-y-2">
                    {bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-sm text-slate-900 dark:text-slate-100">
                        <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0 mt-0.5">🎯</span>
                        <span className="leading-relaxed font-semibold">
                          {bullet.replace(/^[*-]\s*/, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Section 3 or 4: Actionable Cues & Adjustments / Routine Cues
            if (block.includes('Actionable Cues') || block.includes('Actionable Routine Cues')) {
              const content = block.replace(/\*\*(?:3|4)\.\s*Actionable[^:]*:\*\*/i, '').trim();
              const bullets = content.split('\n').filter((l) => l.trim().length > 0);
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154]">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider font-baseball text-sm">
                    <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Actionable Routine Cues (Bullpen / Cage Session)</span>
                  </div>
                  <div className="space-y-2.5">
                    {bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-sm text-slate-900 dark:text-slate-100">
                        <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0 mt-0.5">&bull;</span>
                        <span className="leading-relaxed font-medium">{bullet.replace(/^[*-]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Section 4 or 5: Next Game Focus
            if (block.includes('Next Game Focus')) {
              const content = block.replace(/\*\*(?:4|5)\.\s*Next Game Focus[^:]*:\*\*/i, '').trim();
              return (
                <div key={idx} className="p-4 rounded-xl bg-orange-50 dark:bg-[#060e1b] border border-orange-400/80 dark:border-orange-500/40">
                  <div className="flex items-center gap-2 mb-1.5 text-orange-700 dark:text-orange-400 font-bold text-xs uppercase tracking-wider font-baseball text-sm">
                    <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Next Game Focus</span>
                  </div>
                  <p className="text-orange-950 dark:text-orange-100 text-sm md:text-base font-bold leading-relaxed">
                    {content}
                  </p>
                </div>
              );
            }

            return (
              <p key={idx} className="text-slate-800 dark:text-slate-300 text-sm whitespace-pre-wrap">
                {block}
              </p>
            );
          })}
        </div>

        {/* Feel cues tags detected */}
        {audit.feelCuesDetected.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-[#183154]">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Feel Cues Integrated into Athlete Plan:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {audit.feelCuesDetected.map((cue, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-orange-50 dark:bg-[#060e1b] text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30 px-2 py-0.5 rounded-md font-mono font-semibold"
                >
                  "{cue}"
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-slate-50 dark:bg-[#060e1b] border-t border-slate-200 dark:border-[#183154] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Ready for player delivery via iMessage, TeamSnap, or printed dugout card.
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySMS}
            className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f213b] hover:bg-slate-200 dark:hover:bg-[#18345c] border border-slate-300 dark:border-[#1c3a64] text-slate-800 dark:text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {copiedType === 'sms' ? <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'sms' ? 'Copied Clean Text!' : 'Copy for Player Text / iMessage'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f213b] hover:bg-slate-200 dark:hover:bg-[#18345c] border border-slate-300 dark:border-[#1c3a64] text-slate-800 dark:text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copiedType === 'markdown' ? 'Copied Markdown!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f213b] hover:bg-slate-200 dark:hover:bg-[#18345c] border border-slate-300 dark:border-[#1c3a64] text-slate-800 dark:text-slate-300 hover:text-black dark:hover:text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Dugout Outing Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => setIsPhoneModalOpen(true)}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-950/60 font-baseball tracking-wide text-sm cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open Dugout Phone View</span>
          </button>
        </div>
      </div>

      {/* Phone Modal */}
      <PhoneDugoutModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        reportText={reportText}
        playerName={playerName || 'Collegiate Athlete'}
        role={role}
        wordCount={audit.wordCount}
        reportSource={reportSource}
      />
    </div>
  );
};
