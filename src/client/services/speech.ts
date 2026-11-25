// Robust Speech API, Voice Synthesis and Audio Management Engine

export type SpeakingStateListener = (isSpeaking: boolean) => void;

export class SpeechService {
  private static recognition: any = null;
  private static audioCtx: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static micStream: MediaStream | null = null;

  // Prevent Chromium garbage collection bug killing speech synthesis mid-sentence
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static isMutedState: boolean = false;
  private static speakingListeners: Set<SpeakingStateListener> = new Set();
  private static preferredVoiceURI: string = '';

  static init() {
    if (typeof window === 'undefined') return;

    // Load saved preferences
    try {
      const savedMute = localStorage.getItem('reality_voice_muted');
      if (savedMute !== null) {
        this.isMutedState = savedMute === 'true';
      }
      const savedVoice = localStorage.getItem('reality_voice_uri');
      if (savedVoice) {
        this.preferredVoiceURI = savedVoice;
      }
    } catch (e) {
      // ignore
    }

    // Populate voices when loaded by browser
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) {
            this.cachedVoices = v;
          }
        } catch (e) {
          // ignore
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Setup global interaction listener to unlock audio on first touch/click
    const unlockAudioOnce = () => {
      this.unlockAudio();
      window.removeEventListener('click', unlockAudioOnce);
      window.removeEventListener('keydown', unlockAudioOnce);
    };
    window.addEventListener('click', unlockAudioOnce, { once: true });
    window.addEventListener('keydown', unlockAudioOnce, { once: true });
  }

  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  static isMuted(): boolean {
    return this.isMutedState;
  }

  static toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    try {
      localStorage.setItem('reality_voice_muted', String(this.isMutedState));
    } catch (e) {}
    if (this.isMutedState) {
      this.stopSpeaking();
    }
    return this.isMutedState;
  }

  static setMute(muted: boolean) {
    this.isMutedState = muted;
    try {
      localStorage.setItem('reality_voice_muted', String(muted));
    } catch (e) {}
    if (muted) {
      this.stopSpeaking();
    }
  }

  static onSpeakingStateChange(listener: SpeakingStateListener): () => void {
    this.speakingListeners.add(listener);
    return () => {
      this.speakingListeners.delete(listener);
    };
  }

  private static notifySpeaking(isSpeaking: boolean) {
    this.speakingListeners.forEach(fn => {
      try {
        fn(isSpeaking);
      } catch (e) {
        console.error('Error in speaking state listener:', e);
      }
    });
  }

  static async getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isSpeechSynthesisSupported()) return [];
    if (this.cachedVoices.length > 0) return this.cachedVoices;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.cachedVoices = voices;
      return voices;
    }

    return new Promise((resolve) => {
      let timeoutId: any;
      const handler = () => {
        clearTimeout(timeoutId);
        this.cachedVoices = window.speechSynthesis.getVoices();
        resolve(this.cachedVoices);
      };

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = handler;
      }

      timeoutId = setTimeout(() => {
        this.cachedVoices = window.speechSynthesis.getVoices();
        resolve(this.cachedVoices);
      }, 500);
    });
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    const list = this.cachedVoices.length > 0 ? this.cachedVoices : (this.isSpeechSynthesisSupported() ? window.speechSynthesis.getVoices() : []);
    return list.filter(v => v.lang.startsWith('en'));
  }

  static setPreferredVoiceURI(uri: string) {
    this.preferredVoiceURI = uri;
    try {
      localStorage.setItem('reality_voice_uri', uri);
    } catch (e) {}
  }

  static getPreferredVoiceURI(): string {
    return this.preferredVoiceURI;
  }

  static unlockAudio() {
    try {
      if (this.isSpeechSynthesisSupported()) {
        window.speechSynthesis.resume();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Speak text with modern Web Speech synthesis, resilient voice picking, and GC protection.
   */
  static async speakText(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      accent?: 'british' | 'american' | 'natural' | 'any';
    } = {}
  ): Promise<void> {
    if (this.isMutedState || !text || !text.trim()) {
      return;
    }

    if (!this.isSpeechSynthesisSupported()) {
      // Fallback: subtle audio chime so user knows AI response arrived
      this.playAcousticCue('response');
      return;
    }

    // Ensure audio subsystem is active
    this.unlockAudio();

    // Clean text of markdown artifacts
    const sanitizedText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitizedText) return;

    // Wait for voices if needed
    const voices = await this.getVoicesAsync();

    return new Promise((resolve) => {
      try {
        // Cancel any pending speech safely
        window.speechSynthesis.cancel();

        // Brief delay before starting to prevent Chromium speech cancellation bug
        setTimeout(() => {
          try {
            window.speechSynthesis.resume();

            const utterance = new SpeechSynthesisUtterance(sanitizedText);
            this.activeUtterance = utterance; // Prevent GC!

            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.lang = options.accent === 'british' ? 'en-GB' : 'en-US';

            // Select matching voice
            if (voices && voices.length > 0) {
              let selected: SpeechSynthesisVoice | undefined;

              if (this.preferredVoiceURI) {
                selected = voices.find(v => v.voiceURI === this.preferredVoiceURI);
              }

              if (!selected && options.voiceName) {
                selected = voices.find(v => v.name.toLowerCase().includes(options.voiceName!.toLowerCase()));
              }

              if (!selected && options.accent === 'british') {
                selected = voices.find(v => (v.lang === 'en-GB' || v.name.includes('British') || v.name.includes('UK') || v.name.includes('Oliver') || v.name.includes('George') || v.name.includes('Daniel')));
              }

              if (!selected) {
                // Natural / Google / Samantha priority
                selected = voices.find(v =>
                  (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Jenny') || v.name.includes('Guy')) &&
                  v.lang.startsWith('en')
                ) || voices.find(v => v.lang.startsWith('en'));
              }

              if (selected) {
                utterance.voice = selected;
              }
            }

            let hasFinished = false;
            const finish = () => {
              if (hasFinished) return;
              hasFinished = true;
              this.activeUtterance = null;
              this.notifySpeaking(false);
              resolve();
            };

            utterance.onstart = () => {
              this.notifySpeaking(true);
            };

            utterance.onend = finish;
            utterance.onerror = (e) => {
              console.warn('SpeechSynthesis error:', e);
              finish();
            };

            // Speak
            window.speechSynthesis.speak(utterance);

            // Safety timeout in case browser never fires onend (e.g. background tab)
            const estimatedDurationMs = Math.max(2500, (sanitizedText.split(' ').length / 2.5) * 1000 + 1500);
            setTimeout(() => {
              if (!hasFinished) {
                finish();
              }
            }, estimatedDurationMs);

          } catch (speakErr) {
            console.warn('Failed to speak utterance:', speakErr);
            this.activeUtterance = null;
            this.notifySpeaking(false);
            resolve();
          }
        }, 60);

      } catch (err) {
        console.warn('Speech synthesis initiation error:', err);
        this.activeUtterance = null;
        this.notifySpeaking(false);
        resolve();
      }
    });
  }

  static stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.activeUtterance = null;
    this.notifySpeaking(false);
  }

  /**
   * Generates a sleek, organic audio tone cue using HTML5 Web Audio API
   * Guaranteed audio feedback even when SpeechSynthesis is unavailable or silent
   */
  static playAcousticCue(type: 'turn' | 'response' | 'alert' | 'complete' = 'response') {
    if (this.isMutedState || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'response') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(420, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'complete') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 500);
    } catch (e) {
      // Audio cue silent fallback
    }
  }

  // ─── Speech Recognition (Speech to Text) ────────────────────────────────────

  static startListening(callbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (err: any) => void;
    onEnd: () => void;
  }): { stop: () => void } {
    if (!this.isSpeechRecognitionSupported()) {
      callbacks.onError(new Error('Speech recognition is not supported in this browser. Please use text input.'));
      return { stop: () => {} };
    }

    this.stopSpeaking(); // Stop speaking while user is recording

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    this.recognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      callbacks.onResult(final || interim, Boolean(final));
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition warning:', event.error);
      callbacks.onError(event.error);
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }

  static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
  }

  // ─── Microphone Stream & Visualizer Analyser ──────────────────────────────

  static async setupMicAnalyser(): Promise<AnalyserNode | null> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return null;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micStream = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      this.audioCtx = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      this.analyser = analyser;

      return analyser;
    } catch (err) {
      console.warn('Microphone stream access not granted or unavailable:', err);
      return null;
    }
  }

  static stopMicAnalyser() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }
}

// Auto-initialize voice system
if (typeof window !== 'undefined') {
  SpeechService.init();
}
