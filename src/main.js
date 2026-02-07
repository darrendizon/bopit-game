import { AudioController } from './audio.js';
import { SettingsManager } from './settings.js';
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const audio = new AudioController();
    const settings = new SettingsManager();
    const game = new Game(audio, settings);

    // Apply initial settings
    audio.setSettings({
        volume: settings.get('volume'),
        rate: settings.get('rate'),
        pitch: settings.get('pitch'),
        voiceName: settings.get('voiceName')
    });

    // UI Elements
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');

    const settingsModal = document.getElementById('settings-modal');
    const helpModal = document.getElementById('help-modal');

    const settingsForm = document.getElementById('settings-form');
    const saveSettingsBtn = document.getElementById('save-settings');
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    const closeHelpBtn = document.getElementById('close-help');

    // Settings Inputs
    const volumeSlider = document.getElementById('volume-slider');
    const rateSlider = document.getElementById('speech-rate');
    const pitchSlider = document.getElementById('speech-pitch');
    const voiceSelect = document.getElementById('voice-select');

    // Key Mapping Inputs
    const keyInputs = {
        press: document.getElementById('key-press'),
        repeat: document.getElementById('key-repeat'),
        pause: document.getElementById('key-pause'),
        start: document.getElementById('key-start')
    };

    // Populate Settings UI
    function populateSettingsUI() {
        volumeSlider.value = settings.get('volume');
        rateSlider.value = settings.get('rate');
        if (pitchSlider) pitchSlider.value = settings.get('pitch') || 1.0;

        for (const [action, input] of Object.entries(keyInputs)) {
            if (input) {
                input.value = settings.getKeyMapping(action);
            }
        }

        // Voice select population happens when voices are loaded
    }

    // Populate voices
    window.addEventListener('voicesLoaded', (e) => {
        voiceSelect.innerHTML = '';
        const voices = e.detail;
        const currentVoice = settings.get('voiceName');

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.name === currentVoice) {
                option.selected = true;
            }
            voiceSelect.appendChild(option);
        });
    });

    // Game Functions
    function startGame() {
        if (game.state === 'paused') {
            game.resume();
        } else if (game.state === 'gameOver' || game.state === 'idle') {
            game.start();
        }
    }

    // Game Controls
    startBtn.addEventListener('click', startGame);

    pauseBtn.addEventListener('click', () => {
        game.pause();
    });

    // Global Key Listener
    document.addEventListener('keydown', (e) => {
        // Prevent default scrolling for Space
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
        }

        // Ignore input if modal is open
        if (settingsModal.open || helpModal.open) return;

        const pauseKey = settings.getKeyMapping('pause');
        const startKey = settings.getKeyMapping('start');

        if (e.key === pauseKey) {
            if (game.state === 'playing' || game.state === 'waitingForInput') {
                game.pause();
            } else if (game.state === 'paused') {
                game.resume();
            }
            return;
        }

        if (e.key === startKey) {
             startGame();
             return;
        }

        // Pass to game if playing
        if (game.state === 'waitingForInput') {
            game.handleInput(e.key);
        }
    });

    // Modals
    settingsBtn.addEventListener('click', () => {
        populateSettingsUI();
        // Manually trigger voice population if already loaded
        if (audio.voices && audio.voices.length > 0 && voiceSelect.options.length === 0) {
            const event = new CustomEvent('voicesLoaded', { detail: audio.voices });
            window.dispatchEvent(event);
        }
        settingsModal.showModal();
    });

    helpBtn.addEventListener('click', () => {
        helpModal.showModal();
    });

    closeHelpBtn.addEventListener('click', () => {
        helpModal.close();
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModal.close();
    });

    saveSettingsBtn.addEventListener('click', () => {
        settings.set('volume', volumeSlider.value);
        settings.set('rate', rateSlider.value);
        if (pitchSlider) settings.set('pitch', pitchSlider.value);
        settings.set('voiceName', voiceSelect.value);

        audio.setSettings({
            volume: volumeSlider.value,
            rate: rateSlider.value,
            pitch: pitchSlider ? pitchSlider.value : 1.0,
            voiceName: voiceSelect.value
        });

        settingsModal.close();
        audio.speak("Settings saved.");
    });

    // Key Mapping Change Logic
    let listeningAction = null;

    document.querySelectorAll('.change-key-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            listeningAction = action;
            e.target.textContent = 'Press any key...';
            audio.speak(`Press any key for ${action}.`);
        });
    });

    settingsModal.addEventListener('keydown', (e) => {
        if (listeningAction) {
            e.preventDefault();
            e.stopPropagation();

            const key = e.key;

            // Allow remapping any key
            settings.setKeyMapping(listeningAction, key);
            if (keyInputs[listeningAction]) {
                keyInputs[listeningAction].value = key;
            }

            // Reset button text
            const btn = document.querySelector(`.change-key-btn[data-action="${listeningAction}"]`);
            if (btn) btn.textContent = 'Change';

            audio.speak(`Mapped ${listeningAction} to ${key}`);
            listeningAction = null;
        }
    });
});
