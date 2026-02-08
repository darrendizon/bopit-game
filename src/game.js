export class Game {
    constructor(audioController, settingsManager) {
        this.audio = audioController;
        this.settings = settingsManager;

        this.state = 'idle'; // idle, playing, waitingForInput, paused, gameOver
        this.score = 0;
        this.roundCount = 0;
        this.sequenceIndex = 0;

        // Difficulty parameters
        this.baseResponseTime = 3000;
        this.minResponseTime = 1000;
        this.speedIncrease = 50; // ms decrease per round
        this.currentResponseTime = this.baseResponseTime;

        this.timer = null;
        this.currentCommand = null; // { type: 'press' | 'type' | 'wait', target: string }

        // DOM Elements
        this.liveCommand = document.getElementById('command');
        this.liveStatus = document.getElementById('status');
        this.liveScore = document.getElementById('score-announcement');

        this.visualCommand = document.getElementById('visual-command');
        this.visualScore = document.getElementById('visual-score');
        this.visualStatus = document.getElementById('visual-status');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
    }

    start() {
        if (this.state === 'playing') return;

        this.state = 'playing';
        this.score = 0;
        this.roundCount = 0;
        this.sequenceIndex = 0;
        this.currentResponseTime = this.baseResponseTime;

        this.updateScore();
        this.updateStatus('Game Started');
        this.audio.speak('Game Started. Get ready!', true);

        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        setTimeout(() => this.nextRound(), 2000);
    }

    pause() {
        if (this.state !== 'playing' && this.state !== 'waitingForInput') return;

        this.state = 'paused';
        clearTimeout(this.timer);
        this.audio.speak('Game Paused', true);
        this.updateStatus('Paused');

        this.startBtn.disabled = false;
        this.startBtn.textContent = 'Resume Game';
        this.pauseBtn.disabled = true;
    }

    resume() {
        if (this.state !== 'paused') return;

        this.state = 'playing';
        this.updateStatus('Resuming...');
        this.audio.speak('Resuming', true);

        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        setTimeout(() => this.nextRound(), 1000);
    }

    quit() {
        this.state = 'idle';
        clearTimeout(this.timer);
        this.audio.stopSpeech();

        this.startBtn.textContent = 'Start Game';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        this.updateCommand('Press Start to Play');
        this.updateStatus('');
    }

    gameOver(reason) {
        this.state = 'gameOver';
        clearTimeout(this.timer);

        const finalScore = this.score;
        this.audio.playGameOver();

        const message = `Game Over. ${reason}. Score: ${finalScore}`;
        this.updateStatus(message);
        this.audio.speak(message, true);

        this.startBtn.textContent = 'Restart Game';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    nextRound() {
        if (this.state !== 'playing') return;

        this.state = 'waitingForInput';
        this.roundCount++;
        this.sequenceIndex = 0;

        // Speed up
        this.currentResponseTime = Math.max(
            this.minResponseTime,
            this.baseResponseTime - (this.roundCount * this.speedIncrease)
        );

        this.currentCommand = this.generateCommand();
        this.announceCommand(this.currentCommand);

        this.startTimer();
    }

    getLessonChars(lesson) {
        const lessons = {
            'home-row': 'asdfghjkl',
            'top-row': 'qwertyuiop',
            'bottom-row': 'zxcvbnm',
            'numbers': '1234567890',
            'all': 'abcdefghijklmnopqrstuvwxyz0123456789'
        };
        return (lessons[lesson] || lessons['all']).split('');
    }

    generateCommand() {
        const lesson = this.settings.get('lesson') || 'home-row';
        const chars = this.getLessonChars(lesson);

        // Filter out mapped keys to avoid conflicts
        const mappings = this.settings.getKeyMappings();
        const usedKeys = Object.values(mappings).map(k => k.toLowerCase());
        const availableChars = chars.filter(c => !usedKeys.includes(c));

        // Fallback if all chars are mapped (unlikely but possible with weird settings)
        if (availableChars.length === 0) {
             const fallback = chars.length > 0 ? chars[0] : 'a';
             return { type: 'type', text: `Type ${fallback.toUpperCase()}!`, target: fallback };
        }

        // Determine sequence length based on score
        let sequenceLength = 1;
        if (this.score >= 10) sequenceLength = 2;
        if (this.score >= 20) sequenceLength = 3;

        let sequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            sequence.push(availableChars[Math.floor(Math.random() * availableChars.length)]);
        }

        const target = sequence.join('');
        // Add commas for TTS clarity
        const text = `Type ${sequence.join(', ').toUpperCase()}!`;

        // Update visuals with sequence
        // We delay this until announceCommand usually, but we set the target here.

        return { type: 'type', text: text, target: target, rawSequence: sequence };
    }

    announceCommand(command) {
        // For visual display, show characters with spacing
        const visualText = command.rawSequence ? command.rawSequence.join(' ').toUpperCase() : command.text;
        this.updateCommand(visualText, 0);
        this.audio.speak(command.text, true);
    }

    startTimer() {
        clearTimeout(this.timer);

        // Grant extra time for sequences
        // Base time + 1s per extra character
        const sequenceLength = this.currentCommand.target.length || 1;
        const timeLimit = this.currentResponseTime + (sequenceLength - 1) * 1000;

        this.timer = setTimeout(() => {
            if (this.state !== 'waitingForInput') return;
            this.handleFailure('Time out');
        }, timeLimit);
    }

    repeatCommand() {
        if (this.currentCommand) {
            this.announceCommand(this.currentCommand);
        }
    }

    handleInput(key, code) {
        if (this.state !== 'waitingForInput') return;

        // Ignore modifier keys
        if (['Control', 'Alt', 'Shift', 'Meta', 'Tab'].includes(key)) return;

        // Normalize key
        const inputKey = key.toLowerCase();
        let targetSequence = this.currentCommand ? this.currentCommand.target : '';
        let currentTargetChar = targetSequence[this.sequenceIndex];

        // Debug logging (Required for Dev Builds)
        console.log({
            expectedSequence: targetSequence,
            expectedChar: currentTargetChar,
            typed: key,
            code: code,
            index: this.sequenceIndex
        });

        // Check for repeat
        const repeatKey = this.settings.getKeyMapping('repeat').toLowerCase();
        if (inputKey === repeatKey) {
            this.repeatCommand();
            return;
        }

        // Explicit validation logic
        if (currentTargetChar.toLowerCase() === inputKey) {
            this.sequenceIndex++;
            this.audio.playClick();

            // Update Visuals
            this.updateCommand(this.currentCommand.target, this.sequenceIndex);

            if (this.sequenceIndex >= targetSequence.length) {
                this.handleSuccess();
            }
        } else {
            this.handleFailure(`Wrong key. Expected ${currentTargetChar}, got ${key} (${code})`);
        }
    }

    handleSuccess() {
        this.score++;
        this.updateScore();
        this.audio.playCorrect();

        if (this.score % 5 === 0) {
             this.audio.playLevelUp();
             this.updateStatus('Level Up!');
        }

        // Clear timer so we don't double trigger
        clearTimeout(this.timer);

        // Short pause before next command
        this.state = 'playing';
        setTimeout(() => this.nextRound(), 500); // 500ms delay between rounds
    }

    handleFailure(reason) {
        this.audio.playIncorrect();
        this.gameOver(reason);
    }

    updateCommand(text, typedIndex = 0) {
        // liveCommand is for screen readers, keep full text
        if (typedIndex === 0) {
             this.liveCommand.textContent = text;
        }

        // Logic to split by spaces if it's a sequence and we are playing
        if (this.currentCommand && this.state === 'waitingForInput') {
             const raw = this.currentCommand.rawSequence || [];
             if (raw.length > 0) {
                  const parts = raw.map(c => c.toUpperCase());
                  let html = '';
                  parts.forEach((char, i) => {
                      if (i < typedIndex) {
                          html += `<span class="highlight">${char}</span> `;
                      } else {
                          html += `<span>${char}</span> `;
                      }
                  });
                  this.visualCommand.innerHTML = html.trim();
                  return;
             }
        }

        // Fallback for non-gameplay messages
        this.visualCommand.textContent = text;
    }

    updateStatus(text) {
        this.liveStatus.textContent = text;
        this.visualStatus.textContent = text;
    }

    updateScore() {
        this.liveScore.textContent = `Score: ${this.score}`;
        this.visualScore.textContent = `Score: ${this.score}`;
    }
}
