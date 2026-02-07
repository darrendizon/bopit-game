export class SettingsManager {
    constructor() {
        this.defaults = {
            volume: 1.0,
            rate: 1.0,
            pitch: 1.0,
            voiceName: '',
            keyMappings: {
                press: ' ',
                repeat: 'r',
                pause: 'Escape',
                start: 'Enter'
            }
        };
        this.settings = this.load();
    }

    load() {
        try {
            const storedString = localStorage.getItem('bopit_settings');
            if (storedString) {
                const stored = JSON.parse(storedString);
                const settings = { ...this.defaults, ...stored };
                // Deep merge keyMappings
                settings.keyMappings = { ...this.defaults.keyMappings, ...(stored.keyMappings || {}) };
                return settings;
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
        return JSON.parse(JSON.stringify(this.defaults));
    }

    save() {
        try {
            localStorage.setItem('bopit_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    getKeyMappings() {
        return this.settings.keyMappings;
    }

    getKeyMapping(action) {
        return this.settings.keyMappings[action];
    }

    setKeyMapping(action, key) {
        this.settings.keyMappings[action] = key;
        this.save();
    }

    reset() {
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        this.save();
        return this.settings;
    }
}
