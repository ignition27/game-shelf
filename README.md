# Game Shelf

A colourful collection of 12 browser games, ready for GitHub Pages. Play directly in your browser with no build step or package installation.

## Play

Open [index.html](index.html) in a modern browser to play locally.

The published site is at [Game Shelf](https://ignition27.github.io/game-shelf/). Local changes appear there after deployment.

Keep `index.html`, `app.js`, `style.css`, `word-list.js`, `rewards.js`, `rewards.css`, `golf.js`, `golf.css`, `competitions.js`, and `competitions.css` together when copying or publishing the site. Include [the dictionary licence](licenses/SCOWL.txt) when distributing the word list.

## Games

| Game | Description |
| --- | --- |
| Mini Golf | Play six Pocket Greens holes with banks, bunkers, water hazards, and round medals. |
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

## Trophy room and cosmetics

Open **Trophy room** from the main navigation to track gameplay achievements and equip rewards. The home page also shows your collection progress.

- **22 achievements** span all 12 games, from trying the shelf to completing games and reaching score targets.
- Each achievement shows its exact requirement and progress. Unlocks are awarded once; there is no currency or purchase step.
- Choose from **18 cosmetics**: shelf themes, Garden Snake colours, Space Dodger ship colours, Sky Flyer plane colours, and Mini Golf balls.
- Default cosmetics are always available. Locked rewards explain how to earn them. Cosmetics change appearance only.
- Achievements and equipped choices save automatically on this browser. Existing game high scores are preserved; old scores do not retroactively award trophies.

## Daily Challenges

Open **Challenges** for three shared daily goals: a quick win, a skill test, and a completion challenge. The set is generated from the date and changes at **midnight Australia/Brisbane (UTC+10)**, regardless of the player's local timezone. The page shows the reset countdown.

- Normal play counts automatically. Each card shows the exact rules and a **Play challenge** button.
- Progress is the best qualifying result from an individual attempt, never a sum of separate rounds. Existing high scores and already solved puzzles do not award new progress.
- An attempt belongs to the day it starts, even when it finishes after midnight. Unfinished Word Vault puzzles retain their original challenge day across reloads.
- Complete all three goals for a dated badge. Complete **3, 7, and 14 daily sets** to unlock the **Daybreak theme**, **Mint ribbon snake**, and **Twilight golf ball**. Days do not need to be consecutive.
- Cup attempts count when their rules match a daily goal. Cup golf can satisfy a single-hole goal, but cannot complete a six-hole goal.
- This is a local browser feature: dates use the device clock, and progress is saved to this browser.

## Arcade Cup

Open **Arcade Cup**, select solo or 2–4 players, enter names, and draw a three-game tournament. Review the selected games and scoring before starting. In pass-and-play, all players take a turn at the current game before advancing to the next game. Players receive the same layouts and rules; other players should look away during Memory Match attempts.

| Game | Cup rules | Points (maximum 100 per game) |
| --- | --- | --- |
| Garden Snake | Wrap, Normal speed, one apple; 90 seconds | 5 per apple; 20 apples earns 100. |
| Space Dodger | Standard Mars survival; 90 seconds | 1 per 25 score; 2,500 score earns 100. |
| Sky Flyer | Standard flight from level 1; 90 seconds | 5 per gate; 20 gates earns 100. |
| Memory Match | Eight pairs; 90 seconds | 5 per pair, 20 for finishing, and up to 40 for efficiency (minus 2 per move beyond eight). |
| Mini Golf | First three holes, par 8; 180 seconds | 20 per sunk hole; sinking all three adds up to 40 (minus 4 per stroke over par). Pickups earn no hole points. |

- Timers begin when play begins. Pauses and player handoffs do not use time; running out of time saves the result reached so far.
- Each scored attempt is recorded once. The result button leads to standings and the next player's handoff.
- The three games total up to **300 points**: gold at 240+, silver at 165+, bronze at 90+, and a finisher medal below 90. Equal totals share the placing.
- Completed rounds and the solo best save automatically. Leaving or refreshing an active round lets you retry that unscored slot with the same layout. An early-ended Cup awards no medal.
- Cup golf keeps the full six-hole personal best and completion achievements separate.

## Mini Golf: Pocket Greens

Six holes introduce straight putting, a garden wall, sand, a pond, alternating gates, and a final dogleg. Total course par is **19**.

- **Mouse or touch:** drag backwards from the ball, then release to putt. The dotted arrow shows the initial direction.
- **Keyboard:** left/right arrows aim; up/down arrows adjust power; Space or Enter putts. Hold Shift for finer adjustments. Aim and power sliders plus a Putt button are also available.
- Walls bounce the ball, sand slows it, and water returns it to its previous lie with one penalty stroke. Fast shots can roll across the cup.
- **P / Escape** or the Pause button pauses the round. Leaving the window automatically pauses play.
- At 10 strokes a hole is picked up and scored as 10. A pickup earns no hole achievement.
- Finish all six holes without a pickup for a medal: gold at par or better, silver up to six over par, and bronze above that. Only fully holed rounds qualify for a saved personal best.
- The scorecard tracks each hole. Restart round begins again; leaving Mini Golf discards the current round, while achievements and the best completed round remain saved.

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

## Clicker Adventure and Mini Platformer

- Clicker Adventure now has a growing expedition camp, tap upgrades, helpers, four journal quests and travelling merchant gifts. Discover the forest, crystal caverns and floating ruins; expeditions cost coins and return with treasure after 30, 60 or 90 seconds.
- Helpers earn 1–3 coins per second each, depending on the destination unlocked. Camp progress saves automatically. Away earnings are capped at four hours and shown when you return; completed expeditions are credited once. A confirmed reset clears only the camp.
- Mini Platformer has twelve courses in three worlds, with optional stars, springs, moving and crumbling platforms, enemies and pits. Use arrows or A/D to move and Space/W/Up to jump; holding jump gives extra height. Touch buttons are also available.
- Checkpoints and collected stars survive retries within the current attempt. Completed levels, collected stars and best times persist between visits. Replays can improve stars and times. Pause with P/Escape or the button; changing tabs or losing focus pauses automatically.
- The existing tap-power and flag achievements remain connected. From 10 September 2026, the daily rotation can also include 50 camp taps or completing a platformer level. Earlier dated daily sets retain their original goals.

## Saved progress

The reworked games and Trophy room use browser local storage for scores, puzzle progress, achievements, and equipped cosmetics. Saves belong to the browser and site where you play; clearing site data removes them. When storage is unavailable, the games remain playable, but progress cannot be saved between visits.

## Browser tests

Tests require Node.js, Playwright, and its Chromium browser in your development environment. These are development tools only; playing the games requires no installation.

```sh
node tests/run.cjs
```

| Test | Coverage |
| --- | --- |
| `tests/rewards.cjs` | All 22 achievement thresholds, duplicate prevention, invalid data, all 18 equipment choices, persistence, blocked/quota-limited storage, notifications, keyboard focus, and responsive trophy room. |
| `tests/golf.cjs` | Keyboard, mouse and real touch input; pause/restart/cleanup; physics, walls, sand and water; all six reachable holes; medals, stroke cap, saved best, rewards, blocked storage, stress simulation, and mobile overlays. |
| `tests/integration.cjs` | Actual existing-game actions award the expected trophies; no premature, duplicate, bot, or abandoned-round awards; equipped arcade artwork and reload persistence. |
| `tests/cosmetics.cjs` | All cosmetic palettes appear in canvas pixels; themes differ; navigation, equipment persistence, and home/trophy/golf layouts at 320, 375, 768, and 1100 px. |
| `tests/daily.cjs` | Every daily goal, year-long deterministic rotation, Brisbane midnight, cross-midnight and restored attempts, exact thresholds, 3/7/14-day rewards, duplicate prevention, storage fallback, and mobile layouts. |
| `tests/adventures.cjs` | Camp purchases, quests, three expeditions, capped offline earnings, saves; all twelve level playthroughs, stars, checkpoints, jump physics, springs, moving/crumbling platforms, enemies, controls, daily goals, mobile layouts and storage failure. |
| `tests/cup.cjs` | Solo and 2–4 player setup, scoring/medal boundaries, five actual game adapters, identical layouts, complete tournaments and ties, timers, pauses, reloads, duplicate protection, cross-tab saves, storage fallback, and mobile layouts. |
| `tests/arcade.cjs` | Snake modes, growth, repeated turns, collision edge cases, full-board completion; Sky Flyer gravity, controls, scoring, level transitions, gap sizes; pause/restart, navigation, mobile layout, and basic Checkers/City Trader checks. |
| `tests/shooter.cjs` | Movement, auto-fire, pickups, damage protection, game over, waves and bosses, pointer controls, pause/restart, cleanup, a 100-second simulation, and mobile layout. |
| `tests/vault.cjs` | Repeated-letter scoring, dictionary validation, duplicate guesses, typing and on-screen input, all word lengths, win/loss, saved streaks and puzzles, animation input locking, unavailable storage, and responsive layouts. |

The tests check for browser errors and write screenshots to temporary directories printed in their output. The runner executes all ten suites. Deterministic clock controls and test-only instrumentation exercise rare game states without exposing test controls in the shipped games.

## Credits and licences

- Project licence: [LICENSE](LICENSE).
- Word Vault's accepted-guess dictionary is adapted from SCOWL. Attribution and licence terms are included in [licenses/SCOWL.txt](licenses/SCOWL.txt).
- City Trader is original and is not affiliated with or branded as Monopoly.
