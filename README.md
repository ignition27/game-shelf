# Game Shelf

A colourful collection of 11 browser games, ready for GitHub Pages. Play directly in your browser with no build step or package installation.

## Play

Open [index.html](index.html) in a modern browser to play locally.

The published site is at [Game Shelf](https://ignition27.github.io/game-shelf/). Local changes appear there after deployment.

Keep `index.html`, `app.js`, `style.css`, and `word-list.js` together when copying or publishing the site. Include [the dictionary licence](licenses/SCOWL.txt) when distributing the word list.

## Games

| Game | Description |
| --- | --- |
| Garden Snake | Collect apples across four custom modes on a garden-themed board. |
| Space Dodger | A retro survival shooter defending the edge of Mars. |
| Memory Match | Find matching pairs of cards. |
| Reaction Test | Test how quickly you react to the signal. |
| Word Vault | Crack a hidden word in six attempts. |
| Clicker Adventure | Collect coins and upgrade your earning power. |
| Sky Flyer | Tap to stay airborne through increasingly difficult gates. |
| Mini Platformer | Jump your way to the flag. |
| Tic-Tac-Toe | Take on a computer opponent. |
| Checkers | Play against easy, medium, or hard computer opponents. |
| City Trader | An original property-trading board game against computer opponents. |

## Arcade revamps

### Garden Snake

Previously Neon Snake, now redesigned with a garden board, apples, and a new snake design.

- **Controls:** WASD, arrow keys, or on-screen direction buttons.
- **Classic:** avoid the borders and your own body.
- **Wrap:** leave one edge and emerge on the opposite side.
- **Maze:** navigate around garden hedges.
- **Feast:** keep eight apples on the board at once.
- Choose Chill, Normal, or Fast speed, plus 1, 3, or 5 apples outside Feast.
- Best scores are saved separately for each ruleset.

Collision handling allows movement into a tail cell that is being vacated, and filling the board completes the game cleanly.

### Sky Flyer

A pixel-art prop plane with a retro space-and-sunset palette, scrolling scenery, and scanlines.

- **Controls:** tap W repeatedly to climb; gravity pulls the plane down between presses. Holding W does not provide continuous lift. Hold S to dive faster.
- **Touch:** tap the climb button or hold the dive button.
- Score only after the whole plane clears a gate.
- Advance a level every **10 gates**, with progressively narrower openings and faster flight.
- Levels cycle through **Sunset Run**, **Midnight Drift**, **Neon Storm**, **Polar Flight**, and **Ember Valley**, featuring clouds, stars, rain, snow, and embers. Later cycles introduce fresh palettes.
- Gates already on screen retain their openings during level transitions.

### Space Dodger: Starfighter Survival

Completely rebuilt as a retro survival shooter above Mars, with a curved planetary horizon, scrolling stars, a distant orbital station, pixel-art ships, and explosions.

- **Controls:** move with WASD or arrow keys; weapons fire automatically.
- **Touch:** drag the ship or hold on-screen direction buttons.
- Dodge asteroids, enemy fighters, and aimed projectiles.
- Collect **U** pickups to unlock twin and triple fire, and **+** pickups to repair your three-point hull.
- Taking damage grants brief protection against further hits.
- Survive increasingly difficult waves, with a dreadnought boss every **five waves**.
- Best scores are saved locally.

Garden Snake, Sky Flyer, and Space Dodger all include start/restart controls, **P** to pause or resume, and automatic pause when the window loses focus.

### Word Vault

Previously Word Guess, now a retro terminal puzzle with animated clue tiles and an on-screen keyboard that tracks each letter's strongest clue.

- Choose **four-, five-, or six-letter** words, with six attempts per puzzle.
- **Controls:** type or tap letters, press Enter to submit, and Backspace to delete.
- **Green / ✓:** correct position. **Amber / ↔:** belongs elsewhere. **Grey / ×:** no remaining match in the answer.
- Repeated letters are scored individually, with exact matches reserved first.
- Invalid words and duplicate guesses do not consume an attempt.
- Each word length has its own saved puzzle, wins, streak, and best streak. Switching lengths or returning later resumes submitted guesses.
- Starting a new vault after submitting a guess counts an unfinished puzzle as a loss and ends that length's streak.
- Curated answers are checked against an offline British/American English guess dictionary. Colour clues also have symbols, and tile animations respect reduced-motion preferences.

## Saved progress

The reworked games use browser local storage for scores or puzzle progress. Saves belong to the browser and site where you play; clearing site data removes them. When storage is unavailable, the games remain playable, but progress cannot be saved between visits.

## Browser tests

Tests require Node.js, Playwright, and its Chromium browser in your development environment. These are development tools only; playing the games requires no installation.

```sh
node tests/arcade.cjs
node tests/shooter.cjs
node tests/vault.cjs
```

| Test | Coverage |
| --- | --- |
| `tests/arcade.cjs` | Snake modes, growth, repeated turns, collision edge cases, full-board completion; Sky Flyer gravity, controls, scoring, level transitions, gap sizes; pause/restart, navigation, mobile layout, and basic Checkers/City Trader checks. |
| `tests/shooter.cjs` | Movement, auto-fire, pickups, damage protection, game over, waves and bosses, pointer controls, pause/restart, cleanup, a 100-second simulation, and mobile layout. |
| `tests/vault.cjs` | Repeated-letter scoring, dictionary validation, duplicate guesses, typing and on-screen input, all word lengths, win/loss, saved streaks and puzzles, animation input locking, unavailable storage, and responsive layouts. |

The tests check for browser errors and write screenshots to temporary directories printed in their output. All three suites passed after the arcade revamps.

## Credits and licences

- Project licence: [LICENSE](LICENSE).
- Word Vault's accepted-guess dictionary is adapted from SCOWL. Attribution and licence terms are included in [licenses/SCOWL.txt](licenses/SCOWL.txt).
- City Trader is original and is not affiliated with or branded as Monopoly.
