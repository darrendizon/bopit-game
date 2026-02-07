# Accessible Bop It

An accessible, audio-first reaction game designed for blind and low-vision players.

## Game Description

Accessible Bop It is a fast-paced reaction game where you must listen to audio commands and respond with the correct keyboard input. The game progressively speeds up, testing your reflexes and focus.

The game is built with accessibility as a core feature, not an afterthought. It uses high-contrast visuals, screen reader support, and synthesized audio cues.

## Gameplay

The game will announce a command. You must perform the action before the time runs out.

### Commands

*   **Press It:** Press the **Spacebar** (default).
*   **Type It:** Type the letter or number announced.
*   **Wait It:** Do **NOT** press anything until the next command.

### Controls & Key Mappings

All key mappings are configurable in the **Settings** menu.

*   **Start / Restart Game:** `Enter`
*   **Pause / Resume Game:** `Escape`
*   **Repeat Last Command:** `r`
*   **Press It Action:** `Spacebar`

## Accessibility Features

This game follows WCAG 2.1 AA guidelines and prioritizes:

*   **Screen Reader Support:** Semantic HTML and ARIA live regions ensure all game events are announced.
*   **Audio-First Design:** All game information is conveyed through speech and sound effects.
*   **Keyboard Navigation:** Full keyboard support for gameplay and menus.
*   **High Contrast:** Visual design uses high-contrast colors for low-vision users.
*   **Configurable Settings:** Adjust speech rate, pitch, volume, and key mappings to suit your needs.
*   **No Visual Dependency:** You can play the entire game with your monitor turned off.

## Testing Instructions

### Screen Reader Testing

1.  Enable your screen reader (NVDA, JAWS, VoiceOver, or TalkBack).
2.  Navigate to the game URL.
3.  Use `Tab` to navigate to the "Start Game" button.
4.  Press `Enter` to start.
5.  Listen for the "Game Started" announcement.
6.  Respond to commands using the keyboard.
7.  Verify that score updates and game over messages are announced automatically.

### Supported Screen Readers

*   **NVDA** (Windows)
*   **JAWS** (Windows)
*   **VoiceOver** (macOS, iOS)
*   **TalkBack** (Android)

## Developer Guide

### Project Structure

*   `index.html`: Main game interface.
*   `styles.css`: Visual styling.
*   `src/game.js`: Core game logic and state machine.
*   `src/audio.js`: Audio controller for TTS and synthesized SFX.
*   `src/settings.js`: Settings management and localStorage.
*   `src/main.js`: Entry point and event handling.

### How to Contribute Accessibly

1.  Ensure all new UI elements are semantic (e.g., use `<button>`, `<label>`).
2.  Use ARIA attributes only when necessary (e.g., `aria-live` for dynamic content).
3.  Test with a screen reader before submitting changes.
4.  Maintain high contrast ratios for visual elements.

### Adding New Commands

1.  Open `src/game.js`.
2.  Locate the `generateCommand()` method.
3.  Add a new logic block for your command type.
4.  Update `handleInput()` to process the input for your new command.

### Licensing

*   **Code:** MIT License.
*   **Sounds:** All sound effects are synthesized in real-time using the Web Audio API. No external audio files are used.
