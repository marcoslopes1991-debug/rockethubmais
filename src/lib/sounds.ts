/**
 * Synthesized sound effects using Web Audio API.
 * No external files needed — all sounds are generated programmatically.
 */

let audioContext: AudioContext | null = null;
let isPlaying = false;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getSoundEnabled(): boolean {
  return localStorage.getItem("sound_enabled") !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem("sound_enabled", enabled ? "true" : "false");
}

export function isSoundEnabled(): boolean {
  return getSoundEnabled();
}

async function playTone(
  frequencies: { freq: number; duration: number; delay: number; type?: OscillatorType; gain?: number }[]
) {
  if (!getSoundEnabled() || isPlaying) return;
  isPlaying = true;

  try {
    const ctx = getContext();
    if (ctx.state === "suspended") await ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);

    for (const tone of frequencies) {
      const osc = ctx.createOscillator();
      const envGain = ctx.createGain();

      osc.type = tone.type ?? "sine";
      osc.frequency.value = tone.freq;

      envGain.gain.setValueAtTime(0, ctx.currentTime + tone.delay);
      envGain.gain.linearRampToValueAtTime(tone.gain ?? 1, ctx.currentTime + tone.delay + 0.02);
      envGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.delay + tone.duration);

      osc.connect(envGain);
      envGain.connect(masterGain);

      osc.start(ctx.currentTime + tone.delay);
      osc.stop(ctx.currentTime + tone.delay + tone.duration);
    }

    const totalDuration = Math.max(...frequencies.map((t) => t.delay + t.duration));
    setTimeout(() => {
      isPlaying = false;
    }, totalDuration * 1000 + 50);
  } catch {
    isPlaying = false;
  }
}

/** Bright ascending chime — correct answer */
export function playCorrectSound() {
  playTone([
    { freq: 523, duration: 0.12, delay: 0, type: "sine" },
    { freq: 659, duration: 0.12, delay: 0.08, type: "sine" },
    { freq: 784, duration: 0.2, delay: 0.16, type: "sine" },
  ]);
}

/** Short descending tone — wrong answer */
export function playWrongSound() {
  playTone([
    { freq: 330, duration: 0.15, delay: 0, type: "triangle" },
    { freq: 262, duration: 0.25, delay: 0.1, type: "triangle", gain: 0.7 },
  ]);
}

/** Triumphant fanfare — level up */
export function playLevelUpSound() {
  playTone([
    { freq: 523, duration: 0.15, delay: 0, type: "sine" },
    { freq: 659, duration: 0.15, delay: 0.12, type: "sine" },
    { freq: 784, duration: 0.15, delay: 0.24, type: "sine" },
    { freq: 1047, duration: 0.4, delay: 0.36, type: "sine", gain: 1.2 },
  ]);
}

/** Sparkle reward sound — achievement unlocked */
export function playAchievementSound() {
  playTone([
    { freq: 880, duration: 0.1, delay: 0, type: "sine", gain: 0.6 },
    { freq: 1109, duration: 0.1, delay: 0.08, type: "sine", gain: 0.8 },
    { freq: 1319, duration: 0.1, delay: 0.16, type: "sine", gain: 0.9 },
    { freq: 1760, duration: 0.3, delay: 0.24, type: "sine", gain: 1 },
  ]);
}

/** Soft pop — new notification */
export function playNotificationSound() {
  playTone([
    { freq: 740, duration: 0.08, delay: 0, type: "sine", gain: 0.5 },
    { freq: 988, duration: 0.15, delay: 0.06, type: "sine", gain: 0.7 },
  ]);
}

/** Bright pop — follow someone */
export function playFollowSound() {
  playTone([
    { freq: 660, duration: 0.08, delay: 0, type: "sine", gain: 0.5 },
    { freq: 880, duration: 0.12, delay: 0.06, type: "sine", gain: 0.7 },
    { freq: 1100, duration: 0.1, delay: 0.14, type: "sine", gain: 0.5 },
  ]);
}

/** Soft neutral tone — unfollow */
export function playUnfollowSound() {
  playTone([
    { freq: 440, duration: 0.12, delay: 0, type: "triangle", gain: 0.4 },
    { freq: 380, duration: 0.15, delay: 0.08, type: "triangle", gain: 0.3 },
  ]);
}
