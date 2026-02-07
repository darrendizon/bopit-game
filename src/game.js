export class Game {
    constructor(audioController, settingsManager) {
        this.audio = audioController;
        this.settings = settingsManager;

        this.state = 'idle'; // idle, playing, waitingForInput, paused, gameOver
        this.score = 0;
        this.roundCount = 0;

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

        // Speed up
        this.currentResponseTime = Math.max(
            this.minResponseTime,
            this.baseResponseTime - (this.roundCount * this.speedIncrease)
        );

        this.currentCommand = this.generateCommand();
        this.announceCommand(this.currentCommand);

        this.startTimer();
    }

    generateCommand() {
        const types = ['press', 'type', 'wait'];
        // Weights can be adjusted. Initially simple.
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === 'press') {
            return { type: 'press', text: 'Press It!', target: this.settings.getKeyMapping('press') };
        } else if (type === 'type') {
            let chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
            const mappings = this.settings.getKeyMappings();
            const usedKeys = Object.values(mappings).map(k => k.toLowerCase());

            chars = chars.filter(c => !usedKeys.includes(c));

            if (chars.length === 0) {
                 // Fallback if all chars are mapped (unlikely)
                 chars = ['a'];
            }

            const char = chars[Math.floor(Math.random() * chars.length)];
            return { type: 'type', text: `Type ${char.toUpperCase()}!`, target: char };
        } else {
            return { type: 'wait', text: 'Wait It!', target: null };
        }
    }

    announceCommand(command) {
        this.updateCommand(command.text);
        this.audio.speak(command.text, true);
    }

    startTimer() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state !== 'waitingForInput') return;

            if (this.currentCommand.type === 'wait') {
                this.handleSuccess();
            } else {
                this.handleFailure('Time out');
            }
        }, this.currentResponseTime);
    }

    repeatCommand() {
        if (this.currentCommand) {
            this.announceCommand(this.currentCommand);
        }
    }

    handleInput(key) {
        if (this.state !== 'waitingForInput') return;

        // Ignore modifier keys
        if (['Control', 'Alt', 'Shift', 'Meta', 'Tab'].includes(key)) return;

        // Normalize key
        const inputKey = key.toLowerCase();

        // Check for repeat
        const repeatKey = this.settings.getKeyMapping('repeat').toLowerCase();
        if (inputKey === repeatKey) {
            this.repeatCommand();
            return;
        }

        if (this.currentCommand.type === 'wait') {
            this.handleFailure('You pressed something');
            return;
        }

        let targetKey = this.currentCommand.target;
        // Check if target is space
        if (targetKey === ' ' && inputKey === ' ') {
             this.handleSuccess();
             return;
        }

        if (targetKey.toLowerCase() === inputKey) {
            this.handleSuccess();
        } else {
            this.handleFailure(`Wrong key. Expected ${targetKey}, got ${key}`);
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

    updateCommand(text) {
        this.liveCommand.textContent = text;
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
