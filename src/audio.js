export class AudioController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 1.0;

        // TTS Settings
        this.voice = null;
        this.rate = 1.0;
        this.pitch = 1.0;

        // Load voices when available
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
        this.loadVoices();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        // Trigger event to update UI if needed, or just let settings pull it
        const event = new CustomEvent('voicesLoaded', { detail: this.voices });
        window.dispatchEvent(event);
    }

    setSettings({ volume, rate, pitch, voiceName }) {
        if (volume !== undefined) this.masterVolume = parseFloat(volume);
        if (rate !== undefined) this.rate = parseFloat(rate);
        if (pitch !== undefined) this.pitch = parseFloat(pitch);
        if (voiceName) {
            this.voice = this.voices.find(v => v.name === voiceName) || null;
        }
    }

    speak(text, priority = false) {
        if (this.masterVolume === 0) return;

        if (priority) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.volume = this.masterVolume;

        this.synth.speak(utterance);
    }

    stopSpeech() {
        this.synth.cancel();
    }

    // Sound Effects using Web Audio API
    playTone(frequency, type, duration, startTime = 0) {
        if (this.masterVolume === 0) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start(this.audioCtx.currentTime + startTime);
        oscillator.stop(this.audioCtx.currentTime + startTime + duration);
    }

    playCorrect() {
        // High pitched ding
        this.playTone(880, 'sine', 0.1); // A5
        this.playTone(1760, 'sine', 0.2, 0.1); // A6
    }

    playIncorrect() {
        // Low pitched buzz
        this.playTone(150, 'sawtooth', 0.3);
        this.playTone(100, 'sawtooth', 0.4, 0.1);
    }

    playLevelUp() {
        // Ascending arpeggio
        this.playTone(440, 'triangle', 0.1, 0);
        this.playTone(554, 'triangle', 0.1, 0.1);
        this.playTone(659, 'triangle', 0.2, 0.2);
    }

    playGameOver() {
        // Descending slide
        this.playTone(400, 'sawtooth', 0.3, 0);
        this.playTone(300, 'sawtooth', 0.3, 0.2);
        this.playTone(200, 'sawtooth', 0.6, 0.4);
    }

    playClick() {
         this.playTone(800, 'sine', 0.05);
    }
}
