# Doom

This browser port runs locally with the open-source Doom WebAssembly engine and
Freedoom Phase 1 game data. It does not include proprietary Doom game data and
does not contact third-party services.

## Controls

- Arrow keys: move and turn
- Control: fire
- Space: use/open doors
- Shift: run
- Comma and period: strafe
- Escape: menu

Click inside the game to focus it. The first load downloads about 32 MB of game
files; the files are served by Playyyy and are not cached for offline play.

## Third-party notices

- `doom.wasm` is built from [jacobenget/doom.wasm](https://github.com/jacobenget/doom.wasm/tree/31cc1af9656a8184830090c4e9f268383f5d7e15),
  licensed under GNU GPL version 2. Its license is in `LICENSE-doom-wasm.txt`.
  The corresponding source is available at the linked commit.
- `freedoom1.wad` is Freedoom Phase 1 v0.13.0, copyright the Freedoom
  contributors. It is distributed under the terms in `COPYING-FREEDOOM.txt`;
  the contributor credits are in `CREDITS-FREEDOOM.txt`.
