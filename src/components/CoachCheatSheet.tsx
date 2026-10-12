import React from 'react';
import { BookOpen, X, CheckCircle2, AlertTriangle, ArrowRight, Zap, Target, Activity } from 'lucide-react';

interface CoachCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachCheatSheet: React.FC<CoachCheatSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0a1629] border border-[#1b355c] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#060e1b] border-b border-[#183154]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-baseball uppercase text-xl">Coach's Metric-to-Feel Translation Matrix</h2>
              <p className="text-xs text-slate-400">Jargon-Free collegiate translation guide: never talk stats to athletes, talk mechanics & feel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f213b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-sm text-slate-300">
          {/* Rule banner */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-300 mb-1 font-baseball text-base tracking-wide uppercase">Strict Jargon Rule: No Lab Speak in the Dugout</h4>
              <p className="text-xs text-orange-200/90 leading-relaxed">
                Never use academic or statistical jargon (<span className="line-through text-red-300">delta</span>, <span className="line-through text-red-300">p-value</span>, <span className="line-through text-red-300">standard deviation</span>, <span className="line-through text-red-300">statistically significant</span>). Players freeze when given equations. Give them physical sensations and count-specific game plans.
              </p>
            </div>
          </div>

          {/* Pitcher Translations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-base border-b border-[#183154] pb-1 font-baseball uppercase tracking-wide">
              <Activity className="w-4 h-4" />
              <span>Pitching Metrics &rarr; Feel Cues</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">Induced Vertical Break (IVB) Spiking</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"Slider IVB was +2.3 inches higher"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Slider was popping out of your hand higher than usual, giving it lift. Focus on staying on top of the ball through release for sharp downward bite."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">Velocity Dip In Later Innings (&gt;1.5 mph)</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"Fastball velo declined 2.4 mph in Inning 5"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Keep your drive leg loaded and maintain chest posture through release so you don't leak power as the pitch count climbs."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">High Whiff% / Low Zone% (Nibbling)</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"38% Whiff% but Zone% dropped to 38%"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Your stuff is too nasty to pick corners early in counts. Trust your heater down the chute in 0-0 and 1-0 counts, then bury your breaking ball."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">CSW% (Called Strikes + Whiffs &ge; 30%)</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"CSW was 32% (elite benchmark)"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"You had hitters completely on their heels today, freezing them for backward K's and getting swings through your fastball carry."</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hitter Translations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-base border-b border-[#183154] pb-1 font-baseball uppercase tracking-wide">
              <Target className="w-4 h-4" />
              <span>Hitting Metrics &rarr; Feel Cues</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">High Chase Rate Down & Away</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"Chase rate on breaking balls was 41%"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"You expanded down-and-away when behind in the count. Stick to your zone, spit on that pitch, and force them into the heart of the plate."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">Low Launch Angle / High Groundballs</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"Average launch angle was 3.8 degrees with 60% GB"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Stay through the bottom half of the ball and catch it out in front so you're driving missiles into the gap instead of rolling over to the 6-hole."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">High Max EV / Low In-Zone Contact</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"Max EV was 109 mph but whiffed on 34% of zone heaters"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Your raw juice is elite. Shorten your path to the ball on inner-third fastballs and let the barrel whip do the work."</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060e1b] border border-[#183154]">
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 font-baseball tracking-wide">SweetSpot% (8° to 32° Line Drive Window)</div>
                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                  <span className="font-mono">"SweetSpot% was 66.7%"</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1e38] border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>"Your plane matched the pitch trajectory perfectly, backspinning true line drives that keep carrying toward the warning track."</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dugout constraints check */}
          <div className="p-4 rounded-xl bg-[#060e1b] border border-[#183154]">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2 font-baseball text-base tracking-wide uppercase">
              <Zap className="w-4 h-4 text-orange-400" />
              <span>Collegiate Player Development Report Constraints</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0a1629] border border-[#183154]">
                <div className="text-slate-400 font-medium">Brevity Constraint</div>
                <div className="text-orange-400 font-bold mt-0.5 font-mono">Strictly &lt; 250 Words</div>
                <p className="text-slate-400 mt-1">Athletes read on their phones between innings; zero fluff.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a1629] border border-[#183154]">
                <div className="text-slate-400 font-medium">Format Requirement</div>
                <div className="text-orange-400 font-bold mt-0.5 font-mono">Exact 4 Sections</div>
                <p className="text-slate-400 mt-1">Quick Take, What Worked, Actionable Cues, Next Game Focus.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a1629] border border-[#183154]">
                <div className="text-slate-400 font-medium">Fact-Based Guardrail</div>
                <div className="text-orange-400 font-bold mt-0.5 font-mono">Input Data Only</div>
                <p className="text-slate-400 mt-1">Never invent pitches, counts, or metrics not in the tracking log.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#060e1b] border-t border-[#183154] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-orange-950/60 font-baseball tracking-wide text-sm cursor-pointer"
          >
            Got It, Back to Dugout Lab
          </button>
        </div>
      </div>
    </div>
  );
};
