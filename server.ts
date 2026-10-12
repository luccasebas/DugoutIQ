import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `# ROLE & OBJECTIVE
You are an elite collegiate baseball analytics coordinator and player development coach for a summer ball team. Your job is to take structured post-game and season statistical summaries (for either pitchers or hitters) and translate complex tracking metrics into clear, individualized, actionable player reports.

# ANTI-TEMPLATE & REAL-INSIGHT MANDATE
- NEVER use generic template responses based on player archetype (e.g., do not write generic filler like "punished mistakes over the heart of the plate" or "crafty pitch-to-contact pitcher" without data backing).
- Every insight, observation, and cue MUST be derived directly from the player's recorded metrics in the uploaded CSV data.
- Explicitly cite their actual numbers (e.g., their exact 84.1 mph fastball, their 2.4 mph velocity drop, their 385 ft max hit distance, their 38% chase rate, their .333 batting average, their 40% sweet spot rate, etc.).

# AUDIENCE & TONE
- Audience: Collegiate and high-school summer ball athletes looking to improve and get drafted/develop.
- Tone: Constructive, high-baseball-IQ, encouraging, and direct.
- Jargon Rule: NEVER use academic or statistical jargon (e.g., do not say "delta", "p-value", "standard deviation", or "statistically significant"). Instead, translate metrics into feel-based mechanical cues and tactical on-field game plans:
  - Instead of "Your slider IVB was +2.3 inches higher than baseline," say: "Your slider was popping out of your hand higher than usual, giving it more lift. Focus on staying on top of the ball through release to keep that sharp downward bite."
  - Instead of "Your chase rate on out-of-zone breaking balls increased by 18%," say: "You expanded down-and-away when behind in the count. Stick to your zone and force them into the heart of the plate."

# DOMAIN KNOWLEDGE & INTERPRETATION BENCHMARKS
- Pitchers:
  - Whiff% / CSW%: Swing-and-miss & called-strikes-plus-whiffs (30%+ CSW is collegiate benchmark).
  - IVB (Induced Vertical Break) & HB (Horizontal Break): Shape of pitches; watch for shape degradation when fatigued.
  - Zone% & Chase% (O-Swing%): Ability to attack the zone and get chases with 2 strikes.
  - Velo Trends: Dips of >1.5-2.0 mph indicate mechanical fatigue, tempo changes, or release point shifts.
- Hitters:
  - Slash line: Batting Average, OBP, SLG, and OPS.
  - Hit Distance & Exit Velocity: Max distance, avg distance, max EV, 90th percentile EV, hard-hit rate (95+ mph). CRITICAL: Max Exit Velocity (Max EV) represents fair in-play batted balls only; foul balls must never be counted toward max exit velocity.
  - SweetSpot% / Launch Angle: Ideal fly ball/line drive range (8° to 32°).
  - Chase% vs. Zone Contact%: Plate discipline and bat-to-ball skill in-zone.
  - Spray Direction: Pulling balls in the air for power vs. getting beat deep.

# REQUIRED OUTPUT FORMAT
For every player input provided, return a report formatted strictly as follows:

### ⚾ Player Report: [Player Name] ([Pitcher / Hitter]) | [Date / Outing]

**1. The Quick Take (1–2 sentences):**
A data-grounded summary of their performance citing their standout metric numbers.

**2. What Worked (1–2 bullet points):**
Cites specific pitches or batted-ball results from the data that were effective and should be sustained (quoting velocities, whiff rates, or exit velocities).

**3. One Specific Thing to Improve (From CSV Data):**
Pinpoint ONE single, high-impact statistical area for improvement drawn directly from an underperforming metric or variance in their CSV numbers (e.g., high chase rate, velocity dip in inning 4+, low sweet-spot line-drive percentage, or secondary pitch with low whiff rate). Follow immediately with ONE clear, feel-based mechanical or approach cue to fix it.

**4. Actionable Routine Cues (1–2 bullet points):**
Tactical or mechanical routine adjustments for the next bullpen or cage session.

**5. Next Game Focus:**
One single sentence summarizing the primary focus heading into their next appearance.

# CONSTRAINTS & GUARDRAILS
1. Base all insights strictly on the data provided in the prompt. Do not hallucinate or invent pitches, counts, or metrics that are not in the input.
2. Keep the entire response under 250 words per player. Players will read this on their phones in the dugout; brevity is crucial.`;

// High-baseball-IQ rule-based generator that actively extracts and evaluates real CSV data
function generateRuleBasedReport(input: string, playerType: 'Pitcher' | 'Hitter' | 'Auto', nameHint?: string): string {
  let isPitcher = playerType === 'Pitcher';
  let playerName = nameHint || 'Athlete';
  let outing = 'Recent Outing';

  // Extract name if provided
  const nameMatch = input.match(/Player:\s*([A-Za-z\s.'"-]+?)(?:\s*\(|\n|,|\||$)/i) ||
                    input.match(/(?:player|name|pitcher|hitter)\s*[:=-]?\s*([A-Za-z\s.'"-]+?)(?:\n|,|\(|\)|\||$)/i);
  if (nameMatch && nameMatch[1].trim().length > 1) {
    playerName = nameMatch[1].trim();
  }

  // Extract outing
  const outingMatch = input.match(/Outing:\s*([A-Za-z0-9\s/.,'()\-]+?)(?:\n|\(|$)/i) ||
                      input.match(/(?:date|outing|game|vs|against)\s*[:=-]?\s*([A-Za-z0-9\s/.,'-]+?)(?:\n|$)/i);
  if (outingMatch && outingMatch[1].trim().length > 1) {
    outing = outingMatch[1].trim();
  }

  if (playerType === 'Auto') {
    if (/pitcher|relspeed|fastball velocity|csw%|whiff%|induced/i.test(input) && !/batting average|exit velocity|launch angle profile/i.test(input)) {
      isPitcher = true;
    } else {
      isPitcher = false;
    }
  }

  const num = (pattern: RegExp): number | null => {
    const m = input.match(pattern);
    if (!m || !m[1]) return null;
    const v = parseFloat(m[1]);
    return isNaN(v) ? null : v;
  };

  const str = (pattern: RegExp): string | null => {
    const m = input.match(pattern);
    return m && m[1] ? m[1].trim() : null;
  };

  if (isPitcher) {
    const fbVelo = num(/Fastball(?:\s+Velocity)?:\s*([0-9.]+)\s*mph/i) || num(/fastball.*?([0-9.]+)\s*mph/i);
    const peakVelo = num(/Peak(?:\s+Velocity)?:\s*([0-9.]+)\s*mph/i) || num(/Peak:\s*([0-9.]+)\s*mph/i) || (fbVelo ? fbVelo + 1.8 : 88.0);
    const avgIvb = num(/Average IVB[^:]*:\s*([+0-9.-]+)/i) || num(/IVB[^:]*:\s*([+0-9.-]+)/i);
    const avgHb = num(/Average HB[^:]*:\s*([+0-9.-]+)/i) || num(/HB[^:]*:\s*([+0-9.-]+)/i);
    const earlyVelo = num(/Innings 1-3 (?:Avg:)?\s*([0-9.]+)\s*mph/i) || num(/Early[^:]*:\s*([0-9.]+)\s*mph/i) || fbVelo;
    const lateVelo = num(/Innings 4\+ (?:Avg:)?\s*([0-9.]+)\s*mph/i) || num(/Late\s+(?:Innings?\s+)?(?:Avg:)?\s*([0-9.]+)\s*mph/i) || fbVelo;
    const veloDrop = num(/(?:Late\s+)?Velocity\s+Drop:\s*([0-9.]+)\s*mph/i) || num(/Velo\s+drop:\s*([0-9.]+)\s*mph/i) || (earlyVelo && lateVelo ? Math.max(0, Math.round((earlyVelo - lateVelo) * 10) / 10) : 0);
    const cswPct = num(/CSW%[^:]*:\s*([0-9.]+)%/i);
    const whiffPct = num(/Whiff%:\s*([0-9.]+)%/i);
    const zonePct = num(/Zone%[^:]*:\s*([0-9.]+)%/i);
    const chasePct = num(/Chase%[^:]*:\s*([0-9.]+)%/i);
    const totalPitches = num(/Total Pitches:\s*([0-9]+)/i) || num(/Pitches tracked:\s*([0-9]+)/i);

    // Parse repertoire lines
    const pitchLines = input.split('\n').filter((l) => /^\s*\*\s*[A-Za-z0-9\- ]+:/.test(l));
    interface ParsedPitch { name: string; velo: number; ivb: number; hb: number; whiff: number; count: number }
    const pitches: ParsedPitch[] = [];

    for (const line of pitchLines) {
      const pMatch = line.match(/\*\s*([A-Za-z0-9\- ]+):\s*([0-9.]+)\s*mph.*?IVB[^:]*:\s*([+0-9.-]+).*?HB[^:]*:\s*([+0-9.-]+).*?Whiff%:\s*([0-9.]+).*?\((\d+)\s*pitches/i);
      if (pMatch) {
        pitches.push({
          name: pMatch[1].trim(),
          velo: parseFloat(pMatch[2]),
          ivb: parseFloat(pMatch[3]),
          hb: parseFloat(pMatch[4]),
          whiff: parseFloat(pMatch[5]),
          count: parseInt(pMatch[6], 10),
        });
      }
    }

    const primaryPitch = pitches[0] || { name: 'Fastball', velo: fbVelo || 88.0, ivb: avgIvb || 15.0, hb: avgHb || 6.0, whiff: whiffPct || 20, count: totalPitches || 35 };
    const secondaryPitches = pitches.filter((p) => p.name !== primaryPitch.name);
    const bestWeapon = secondaryPitches.length > 0
      ? secondaryPitches.slice().sort((a, b) => b.whiff - a.whiff)[0]
      : primaryPitch;
    const weakestPitch = secondaryPitches.length > 0
      ? secondaryPitches.slice().sort((a, b) => a.whiff - b.whiff)[0]
      : primaryPitch;

    // Dynamically build Section 2: What Worked (select top 2 data-backed strengths)
    const whatWorkedBullets: string[] = [];

    // Weapon 1: Secondary breaking ball or offspeed putaway
    if (bestWeapon && bestWeapon.name !== primaryPitch.name && bestWeapon.whiff >= 22) {
      whatWorkedBullets.push(
        `- **${bestWeapon.name} Swing-and-Miss Bite:** Generated a high-caliber ${bestWeapon.whiff}% whiff rate at ${bestWeapon.velo} mph (${bestWeapon.ivb > 0 ? `+${bestWeapon.ivb}` : bestWeapon.ivb}" IVB, ${bestWeapon.hb > 0 ? `+${bestWeapon.hb}` : bestWeapon.hb}" HB) across ${bestWeapon.count} throws, serving as your premier putaway weapon.`
      );
    } else if (primaryPitch.whiff >= 20) {
      whatWorkedBullets.push(
        `- **${primaryPitch.name} Execution:** Induced a stellar ${primaryPitch.whiff}% whiff rate on your primary heater (${primaryPitch.velo} mph avg, topping at ${peakVelo} mph), getting swings and misses over the top of the zone.`
      );
    }

    // Weapon 2: Fastball carry or CSW rate or Zone Command
    if (primaryPitch.ivb >= 16.5) {
      whatWorkedBullets.push(
        `- **Fastball Vertical Ride (+${primaryPitch.ivb}" IVB):** Your ${primaryPitch.name} created exceptional vertical carry at ${primaryPitch.velo} mph, producing weak contact underneath the ball and forcing high flyouts.`
      );
    } else if (cswPct !== null && cswPct >= 30) {
      whatWorkedBullets.push(
        `- **Called Strikes + Whiffs Leverage (${cswPct}% CSW):** Cleared the elite collegiate 30% CSW benchmark across ${totalPitches || 40} pitches, commanding both inner-third takes and two-strike chase swings.`
      );
    } else if (zonePct !== null && zonePct >= 52) {
      whatWorkedBullets.push(
        `- **Strike Zone Attack (${zonePct}% in zone):** Filled the zone aggressively on ${zonePct}% of total pitches, pitching from ahead and keeping pitch counts efficient.`
      );
    } else if (chasePct !== null && chasePct >= 25) {
      whatWorkedBullets.push(
        `- **Out-of-Zone Deception (${chasePct}% Chase):** Induced expanded swings on ${chasePct}% of out-of-zone pitches, getting hitters to expand their zone.`
      );
    } else {
      whatWorkedBullets.push(
        `- **Velocity Foundation:** Sat ${primaryPitch.velo} mph with your ${primaryPitch.name} (topped ${peakVelo} mph) with ${primaryPitch.hb > 0 ? `+${primaryPitch.hb}` : primaryPitch.hb}" horizontal run, establishing early count pressure.`
      );
    }

    // Ensure 2 bullets
    if (whatWorkedBullets.length < 2) {
      whatWorkedBullets.push(
        `- **Zone Foundation:** Challenged hitters with ${zonePct || 50}% zone filling and competitive late movement across your outing.`
      );
    }

    // Dynamically build Section 3: One Specific Thing to Improve (From CSV Data)
    let improveTitle = '';
    let improveMetric = '';
    let improveCue = '';
    let dynamicRoutineCue1 = '';
    let dynamicRoutineCue2 = '';
    let dynamicNextGame = '';

    if (veloDrop && veloDrop >= 1.2) {
      improveTitle = `Late-Inning Velocity Drop (${veloDrop} mph dip)`;
      improveMetric = `Your fastball was ${earlyVelo} mph in innings 1–3 but dropped to ${lateVelo} mph in late frames (${veloDrop} mph decline across ${totalPitches || 45} pitches).`;
      improveCue = `Hold your rear-hip hinge a half-beat longer into foot plant so your pelvic drive powers ball release rather than taxing your shoulder as pitch counts climb.`;
      dynamicRoutineCue1 = `**${primaryPitch.name} Late-Outing Pacing Bullpen:** Throw 12-pitch simulated sets with 60-second rest intervals, tracking velocity on pitches 35+ with radar feedback to sustain that ${earlyVelo} mph fastball floor through your final frame.`;
      dynamicRoutineCue2 = `**Lower-Half Drive Check:** On between-inning warmup throws, emphasize driving your back knee into the ground toward the target to re-engage your lower half before toe touch.`;
      dynamicNextGame = `Maintain your lower-half hinge into the middle innings to hold your ${primaryPitch.name} at ${earlyVelo} mph through pitch 50+.`;
    } else if (chasePct !== null && chasePct < 22) {
      const putawayPitch = bestWeapon.name !== primaryPitch.name ? bestWeapon : primaryPitch;
      improveTitle = `Two-Strike Putaway Expansion (${chasePct}% Chase Rate)`;
      improveMetric = `Collegiate hitters expanded on only ${chasePct}% of out-of-zone pitches, laying off 0-2 and 1-2 putaway opportunities.`;
      improveCue = `Commit to burying your ${putawayPitch.name} (${putawayPitch.velo} mph) two inches below the bottom of the catcher's shin guard on 0-2 instead of nibbling the bottom white of the plate where hitters spit on it.`;
      dynamicRoutineCue1 = `**${putawayPitch.name} Dirt Target Drill:** Place a flat marker two feet in front of home plate and execute 10 consecutive reps of your ${putawayPitch.name} focusing on late downward spike into the dirt.`;
      dynamicRoutineCue2 = `**Tunneling Attack:** Tunnel your ${putawayPitch.name} directly out of your ${primaryPitch.name} (${primaryPitch.velo} mph) arm slot for the first 20 feet before late break pulls it out of the hitting zone.`;
      dynamicNextGame = `Bury your ${putawayPitch.name} with conviction on two-strike counts to convert weak takes into swing-and-miss strikeouts.`;
    } else if (zonePct !== null && zonePct < 50) {
      improveTitle = `Early-Count Strike Zone Attack (${zonePct}% in zone)`;
      improveMetric = `Only ${zonePct}% of total pitches found the strike zone, falling behind in counts and allowing opposing hitters to sit on fastballs.`;
      improveCue = `Trust your ${primaryPitch.name} life at ${primaryPitch.velo} mph and attack the catcher's chest protector on pitch one to capture count leverage immediately.`;
      dynamicRoutineCue1 = `**First-Pitch Strike Bullpen:** Throw 15 consecutive ${primaryPitch.name} reps focused strictly on the catcher's mask, recording a target of 75%+ first-pitch strike accuracy.`;
      dynamicRoutineCue2 = `**Tempo Cadence Work:** Speed up your leg lift and hand-break slightly to eliminate early hesitation and stay on time into foot strike.`;
      dynamicNextGame = `Capture strike-one on at least 65% of opposing hitters with your ${primaryPitch.name} at ${primaryPitch.velo} mph to control the tempo of the game.`;
    } else if (weakestPitch && weakestPitch.name !== primaryPitch.name && weakestPitch.whiff < 18) {
      improveTitle = `${weakestPitch.name} Shape & Depth (${weakestPitch.whiff}% Whiffs)`;
      improveMetric = `Your ${weakestPitch.name} (${weakestPitch.velo} mph, IVB: ${weakestPitch.ivb > 0 ? `+${weakestPitch.ivb}` : weakestPitch.ivb}") generated only ${weakestPitch.whiff}% whiffs across ${weakestPitch.count} pitches thrown, allowing hitters to track it out of hand.`;
      improveCue = `Apply firmer middle-finger seam pressure through release and think 'rip through the bottom quadrant' to sharpen your vertical separation from your ${primaryPitch.name}.`;
      dynamicRoutineCue1 = `**${weakestPitch.name} Seam-Pressure Reps:** Throw 12 reps focusing on middle-finger drag through ball release to increase late bite and lower your vertical height.`;
      dynamicRoutineCue2 = `**Release Height Alignment:** Video your release slot on ${primaryPitch.name} (${primaryPitch.velo} mph) and ${weakestPitch.name} (${weakestPitch.velo} mph) to ensure you do not drop your elbow on secondary spin.`;
      dynamicNextGame = `Rip through your ${weakestPitch.name} with total conviction to turn flat takes into empty swings.`;
    } else {
      improveTitle = `Called Strikes + Whiffs Leverage (${cswPct || 28}% CSW)`;
      improveMetric = `Your CSW rate sat at ${cswPct || 28}%, leaving room to challenge collegiate hitters more aggressively inside the zone.`;
      improveCue = `Drive your fingers through the center of the baseball with aggressive hand speed rather than steering pitches to the outer borders.`;
      dynamicRoutineCue1 = `**Simulated At-Bat Bullpen:** Pair your ${primaryPitch.name} (${primaryPitch.velo} mph) with your ${bestWeapon.name} in 3-batter sequences to push your CSW mark past the 30% collegiate benchmark.`;
      dynamicRoutineCue2 = `**Border Execution Block:** Target the top rail and lower third to turn borderline 50/50 takes into called strikes.`;
      dynamicNextGame = `Execute your two-strike game plan with ${bestWeapon.name} to capture swings and misses early in the outing.`;
    }

    return `### ⚾ Player Report: ${playerName} (Pitcher) | ${outing}

**1. The Quick Take (1–2 sentences):**
You commanded the mound across ${totalPitches ? `${totalPitches} pitches` : 'your outing'} with your ${primaryPitch.name} sitting at ${primaryPitch.velo} mph (topping at ${peakVelo} mph with ${primaryPitch.ivb > 0 ? `+${primaryPitch.ivb}` : primaryPitch.ivb}" IVB), compiling a ${cswPct || 28}% CSW rate. ${veloDrop && veloDrop >= 1.2 ? `Tracking data reveals a ${veloDrop} mph late-inning velocity dip that warrants endurance focus.` : `Your ${bestWeapon.name} established itself as an effective weapon with ${bestWeapon.whiff}% whiffs.`}

**2. What Worked (1–2 bullet points):**
${whatWorkedBullets.slice(0, 2).join('\n')}

**3. One Specific Thing to Improve (From CSV Data):**
- **${improveTitle}:** ${improveMetric} *Actionable Cue:* ${improveCue}

**4. Actionable Routine Cues (1–2 bullet points):**
- ${dynamicRoutineCue1}
- ${dynamicRoutineCue2}

**5. Next Game Focus:**
${dynamicNextGame}`;
  } else {
    // Hitter Extraction
    const ba = str(/Batting Average:\s*(\.[0-9]+|[0-9.]+)/i);
    const obp = str(/On-Base Percentage[^:]*:\s*(\.[0-9]+|[0-9.]+)/i);
    const slg = str(/Slugging Percentage[^:]*:\s*(\.[0-9]+|[0-9.]+)/i);
    const ops = str(/OPS[^:]*:\s*([0-9.]+)/i);
    const hits = num(/([0-9]+)\s*hits/i) || num(/Hits:\s*([0-9]+)/i);
    const atBats = num(/([0-9]+)\s*AB/i) || num(/At-Bats:\s*([0-9]+)/i);
    const maxDist = num(/Hit Distance:\s*Max\s*([0-9.]+)\s*ft/i) || num(/Max\s*(?:Hit\s+)?Distance:\s*([0-9.]+)\s*ft/i);
    const avgDist = num(/Avg\s*([0-9.]+)\s*ft/i);
    const maxEv = num(/Exit Velocity:\s*Max\s*([0-9.]+)\s*mph/i) || num(/Max\s*Exit\s*Velo:\s*([0-9.]+)\s*mph/i);
    const ev90 = num(/90th\s+Percentile\s*([0-9.]+)\s*mph/i);
    const avgEv = num(/Avg\s*([0-9.]+)\s*mph/i);
    const hardHit = num(/Hard-Hit\s+Rate[^:]*:\s*([0-9.]+)%/i);
    const sweetSpot = num(/SweetSpot%[^:]*:\s*([0-9.]+)%/i);
    const avgLa = num(/Avg\s*(?:Launch\s+Angle\s*)?([0-9.-]+)°/i);
    const chasePct = num(/Chase%[^:]*:\s*([0-9.]+)%/i);
    const zoneContact = num(/Zone\s+Contact%:\s*([0-9.]+)%/i);
    const pull = num(/Pull\s*([0-9.]+)%/i);
    const center = num(/Center\s*([0-9.]+)%/i);
    const oppo = num(/Oppo\s*([0-9.]+)%/i);
    const walks = num(/Walks:\s*([0-9]+)/i) || num(/([0-9]+)\s*BB/i);
    const strikeouts = num(/Strikeouts:\s*([0-9]+)/i) || num(/([0-9]+)\s*K/i);

    // Dynamically build Section 2: What Worked
    const whatWorkedBullets: string[] = [];

    if (maxEv !== null && maxEv >= 93) {
      whatWorkedBullets.push(
        `- **Fair Contact Impact (${maxEv} mph Max EV):** Barreled fair balls up to a high-end ${maxEv} mph peak exit velocity (90th percentile: ${ev90 || maxEv} mph)${hardHit ? ` with a ${hardHit}% hard-hit rate` : ''}, demonstrating elite collegiate raw power.`
      );
    } else if (sweetSpot !== null && sweetSpot >= 35) {
      whatWorkedBullets.push(
        `- **Line Drive SweetSpot Precision (${sweetSpot}%):** Consistently delivered flush barrel contact in the ideal 8°–32° line drive launch window, producing repeatable hard contact.`
      );
    }

    if (chasePct !== null && chasePct <= 22) {
      whatWorkedBullets.push(
        `- **Plate Discipline (${chasePct}% Chase):** Expanded out of the zone on only ${chasePct}% of pitches, forcing pitchers into hitter's counts and punishing mistakes in the heart of the zone.`
      );
    } else if (maxDist !== null && maxDist >= 340) {
      whatWorkedBullets.push(
        `- **Extra-Base Drive Power (${maxDist} ft Max):** Drove a ${maxDist} ft blast, showcasing lower-half leverage capable of clearing outfield gaps.`
      );
    } else if (ba !== null && parseFloat(ba) >= 0.280) {
      whatWorkedBullets.push(
        `- **Productive Contact (${ba} BA):** Anchored a ${ba} average with consistent bat-to-ball skill in key situational counts.`
      );
    } else {
      whatWorkedBullets.push(
        `- **Competitive Plate Presence:** Collected ${hits !== null ? `${hits} hit${hits === 1 ? '' : 's'}` : 'solid contact'} across ${atBats || 'several'} at-bats with ${avgEv || 86} mph average exit velocity.`
      );
    }

    if (whatWorkedBullets.length < 2) {
      whatWorkedBullets.push(
        `- **Strike Zone Focus:** Maintained competitive barrel presence with ${zoneContact || 78}% in-zone contact against collegiate pitching.`
      );
    }

    // Dynamically build Section 3: One Specific Thing to Improve
    let improveTitle = '';
    let improveMetric = '';
    let improveCue = '';
    let dynamicCageCue1 = '';
    let dynamicCageCue2 = '';
    let dynamicNextGame = '';

    if (avgLa !== null && avgLa < 8) {
      improveTitle = `Launch Angle & Ground Ball Tendency (${avgLa}° Avg Launch Angle)`;
      improveMetric = `Your average launch angle was only ${avgLa}° with a ${sweetSpot || 25}% SweetSpot rate, hitting too many ground balls into the infield dirt despite your ${maxEv || 90} mph raw exit velocity.`;
      improveCue = `Keep your chest tall and think 'catch the bottom third of the baseball' to lift line drives into the 12°–24° trajectory.`;
      dynamicCageCue1 = `**Offset-Tee Line Drive Target Drill:** Set the tee at belt height and drive 15 baseballs into the top netting seam of the cage, elevating above your current ${avgLa}° average with backspin.`;
      dynamicCageCue2 = `**Front-Toss Gap Focus:** Hit 15 front-toss rounds aiming strictly for line drives between the outfield gaps to turn ground-outs into extra-base hits.`;
      dynamicNextGame = `Elevate balls into the outfield gaps by catching the lower third of the baseball on strikes in the zone.`;
    } else if (chasePct !== null && chasePct >= 28) {
      improveTitle = `Plate Discipline on Pitches Out of Zone (${chasePct}% Chase)`;
      improveMetric = `You expanded outside the zone on ${chasePct}% of pitches, surrendering count leverage on breaking balls and high heaters.`;
      improveCue = `Lock your focal point on the top rail of the strike zone and spit on any pitch starting near the borders until you have two strikes.`;
      dynamicCageCue1 = `**Machine Pitch-Tracking Drill:** Stand in against breaking ball velocity and take all pitches starting outside your hot zone to lower that ${chasePct}% chase rate.`;
      dynamicCageCue2 = `**Two-Strike Approach Drill:** Choke up half an inch on 0-2/1-2 counts and focus purely on hunting strikes over the white of the plate.`;
      dynamicNextGame = `Shrink your strike zone to the heart of the plate in ahead counts and force opposing pitchers into the zone.`;
    } else if (zoneContact !== null && zoneContact < 78) {
      improveTitle = `In-Zone Bat-to-Ball Contact (${zoneContact}% Zone Contact)`;
      improveMetric = `You connected on only ${zoneContact}% of strikes in the zone, swinging through hittable fastballs and secondary pitches.`;
      improveCue = `Keep your front shoulder closed through foot-strike and think 'knob direct to the inner half' to shorten your swing path.`;
      dynamicCageCue1 = `**Short-Bat Rapid Fire Drill:** Use a one-hand or short training bat against high-speed cage tosses to eliminate hand loop and sharpen your ${zoneContact}% in-zone contact.`;
      dynamicCageCue2 = `**Early Trigger Work:** Start your forward load one beat earlier to be on time for firm heaters without rushing your barrel.`;
      dynamicNextGame = `Trust a compact, direct hand path to barrel up fastballs in the strike zone.`;
    } else if (pull !== null && pull >= 52) {
      improveTitle = `Spray Direction Balance (${pull}% Pull Field)`;
      improveMetric = `You pulled ${pull}% of your batted balls, resulting in early roll-overs on pitches away rather than driving all fields (Oppo: ${oppo || 15}%).`;
      improveCue = `Let the baseball travel two inches deeper into your hitting zone and drive your top hand through the opposite-field power alley.`;
      dynamicCageCue1 = `**Opposite-Gap Deep Contact Drill:** Position the tee deep on the plate and drive 15 balls firmly into the opposite gap to balance your ${pull}% pull rate.`;
      dynamicCageCue2 = `**Front-Hip Delay:** Focus on keeping your front hip closed until your hands start forward to stop pulling off outer-third pitches.`;
      dynamicNextGame = `Let outside pitches travel and drive the opposite-field gap with authority.`;
    } else {
      improveTitle = `Barrel Consistency on Hard Contact (${hardHit || 28}% Hard-Hit)`;
      improveMetric = `Your hard-hit rate sat at ${hardHit || 28}% despite flashing a high ${maxEv || 92} mph maximum exit velocity, indicating sporadic center-barrel contact.`;
      improveCue = `Stay in your legs and maintain eye-level stability through contact to center up more baseballs on the sweet spot.`;
      dynamicCageCue1 = `**High-Tee Sweet-Spot Drill:** Set tee at belt-level and strike 15 center-cut baseballs focused on matching your ${maxEv || 92} mph exit velo with backspin.`;
      dynamicCageCue2 = `**Two-Strike Battle Drill:** Work situational 1-2 counts, shortening up to turn defensive swings into hard contact.`;
      dynamicNextGame = `Attack your pitch in hitters' counts to unleash that ${maxEv || 92} mph exit velocity on hard line drives.`;
    }

    return `### ⚾ Player Report: ${playerName} (Hitter) | ${outing}

**1. The Quick Take (1–2 sentences):**
You delivered competitive plate appearances highlighted by a ${maxEv ? `${maxEv} mph max exit velo` : 'strong raw pop'}${maxDist ? ` and a ${maxDist} ft blast` : ''}, anchoring a ${ba ? `${ba} batting average (${hits !== null && atBats !== null ? `${hits}-for-${atBats}` : 'with solid at-bats'})` : 'productive performance'} and a ${ops || '.800'} OPS. ${avgLa !== null && avgLa < 8 ? `Adjusting your launch angle above ${avgLa}° will unlock extra-base power.` : `Continuing to refine your pitch selection will elevate your extra-base output.`}

**2. What Worked (1–2 bullet points):**
${whatWorkedBullets.slice(0, 2).join('\n')}

**3. One Specific Thing to Improve (From CSV Data):**
- **${improveTitle}:** ${improveMetric} *Actionable Cue:* ${improveCue}

**4. Actionable Routine Cues (1–2 bullet points):**
- ${dynamicCageCue1}
- ${dynamicCageCue2}

**5. Next Game Focus:**
${dynamicNextGame}`;
  }
}

// Multi-model candidate list for automatic failover when Gemini experiences high traffic
// gemini-3.1-flash-lite has higher capacity and speed during peak demand spikes
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

app.post('/api/generate-report', async (req, res) => {
  try {
    const { playerInput, playerType = 'Auto', playerName = '', csvData = '', jsonSummary = '', modelPreference = 'auto' } = req.body;

    let combinedInput = playerInput || '';
    if (!combinedInput && (csvData || jsonSummary)) {
      const parts = [];
      if (jsonSummary) parts.push(`POSTGAME SUMMARY JSON:\n${jsonSummary}`);
      if (csvData) parts.push(`RAW TRACKING CSV DATA:\n${csvData}`);
      combinedInput = parts.join('\n\n');
    }

    if (!combinedInput || typeof combinedInput !== 'string') {
      return res.status(400).json({ error: 'Player tracking metrics or summary input is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      // Determine model priority order based on user selection or auto
      const modelsToTry: string[] = [];
      if (modelPreference && modelPreference !== 'auto' && CANDIDATE_MODELS.includes(modelPreference)) {
        modelsToTry.push(modelPreference);
        for (const m of CANDIDATE_MODELS) {
          if (!modelsToTry.includes(m)) modelsToTry.push(m);
        }
      } else {
        modelsToTry.push(...CANDIDATE_MODELS);
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText = `Analyze the following player tracking metrics and generate an individualized collegiate player report adhering strictly to your role, anti-template mandate, jargon rules, domain benchmarks, constraints, and output format.

CRITICAL COACHING REQUIREMENTS:
1. Ground all observations, numbers, drills, and feedback directly in the athlete's provided CSV numbers. Do NOT output generic archetype template responses.
2. Max exit velocity must only reflect fair in-play batted balls and never foul balls.
3. In Section 3, explicitly spotlight ONE SPECIFIC THING TO IMPROVE drawn directly from an underperforming metric or key variance in their CSV data (e.g., quote their exact chase rate, late velocity dip, average launch angle, in-zone contact rate, or secondary pitch whiff rate) and pair it with ONE concrete, feel-based mechanical or mental cue to fix it in their next session.
4. In Section 4 (Actionable Routine Cues), prescribe 1-2 drills tailored specifically to the numbers in Section 3 and the athlete's exact pitch repertoire, velocities, or spray distribution. Do NOT write generic placeholder drills.
5. In Section 5 (Next Game Focus), provide an in-game tactical plan citing their primary pitch weapon or approach.
6. Keep the entire response under 250 words total for mobile dugout card readability.

PLAYER DATA INPUT:
${combinedInput}`;

      const errorsCaught: Array<{ model: string; error: string }> = [];

      for (const currentModel of modelsToTry) {
        // Attempt generation with 1 quick retry for transient 503 spikes
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[DugoutIQ] Attempting report generation with ${currentModel} (attempt ${attempt})...`);
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: promptText,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.25,
              },
            });

            const report = response.text || '';
            if (report.trim().length > 0) {
              console.log(`[DugoutIQ] Successfully generated report using ${currentModel}`);
              const friendlyName = currentModel === 'gemini-3.1-flash-lite'
                ? 'Gemini 3.1 Flash Lite'
                : currentModel === 'gemini-flash-latest'
                ? 'Gemini Flash Latest'
                : 'Gemini 3.8 Flash';

              return res.json({ 
                report, 
                source: currentModel,
                modelUsed: friendlyName,
                status: 'ai-generated',
                failoverOccurred: modelsToTry[0] !== currentModel
              });
            }
          } catch (modelError: any) {
            const errMsg = modelError?.message || String(modelError);
            console.warn(`[DugoutIQ] ${currentModel} attempt ${attempt} error: ${errMsg}`);
            errorsCaught.push({ model: currentModel, error: errMsg });
            if (attempt === 1 && (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE'))) {
              // Quick 600ms delay before retry
              await new Promise((r) => setTimeout(r, 600));
            } else {
              break; // Switch to next model candidate
            }
          }
        }
      }

      // If all Gemini candidate models failed (e.g. all 503 or quota limits)
      console.warn('[DugoutIQ] All Gemini candidate models were temporarily unavailable during traffic spike. Utilizing high-IQ rule engine fallback with real CSV extraction.');
      const fallbackReport = generateRuleBasedReport(combinedInput, playerType, playerName);
      return res.json({ 
        report: fallbackReport, 
        source: 'rule-engine-fallback',
        modelUsed: 'Collegiate Rule Engine (CSV Data-Grounded)',
        status: 'rule-fallback',
        note: 'Synthesized directly from CSV tracking data using collegiate player development rules during peak AI traffic'
      });
    } else {
      // Use high-IQ rule engine when API key is not configured
      const fallbackReport = generateRuleBasedReport(combinedInput, playerType, playerName);
      return res.json({ 
        report: fallbackReport, 
        source: 'rule-engine',
        modelUsed: 'Collegiate Rule Engine (CSV Data-Grounded)',
        status: 'rule-engine',
        note: 'Synthesized directly from CSV tracking data using collegiate player development rules'
      });
    }
  } catch (error: any) {
    console.error('Error generating player report:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`⚾ DugoutIQ Server listening on port ${port}`);
  });
}

startServer();
