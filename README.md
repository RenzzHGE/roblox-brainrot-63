# BRAINROT MEGA UNIVERSE v1.5

[![roblox-brainrot-01](https://make.fun/badge/roblox-brainrot-01.svg)](https://make.fun/bounty/roblox-brainrot-01)
[![rank](https://make.fun/badge/roblox-brainrot-01/RenzzHGE/roblox-brainrot-63/rank.svg)](https://make.fun/bounty/roblox-brainrot-01)
[![reward](https://make.fun/badge/roblox-brainrot-01/RenzzHGE/roblox-brainrot-63/reward.svg)](https://make.fun/bounty/roblox-brainrot-01)

A social hangout in a forest by a lake — built for the
[roblox-brainrot-01](https://make.fun/bounty/roblox-brainrot-01) competition on
[make.fun](https://make.fun/bounty/roblox-brainrot-01).

## The game

NGOBROL-style, not a tycoon. You spawn on a stone pad by the fountain plaza,
walk winding dirt paths through dense grass, and hang out:

- **Karaoke deck by the lake** — join the queue, submit a song, sing while the
  lyrics board shows your name. The queue advances every 30 seconds.
- **Waterfall + rainbow** — a grey cliff pours into a blue pool, mist at its
  base, a rainbow caught in the sun shafts.
- **Fountain plaza** — the round stone fountain in the middle of it all.
- **Rumah Kayu (log cabin)** — warm glowing windows, a porch, a roof you can
  see from the plaza.
- **Benches, signposts, market stalls** — sit down (E), read the signpost
  (Air Terjun / Air Mancur / Rumah Kayu), browse the warung stalls.
- **Rope bridge** over the lake inlet, a **treehouse** in the tallest pine,
  **fireflies** by the water and **sky lanterns** rising into the sunset.

No combat, no pedestal grid, no money-ticking HUD — just the forest at golden
hour (17:30), god rays through the canopy, and a place to ngobrol.

## Textures

The look is built from the two reference images in `ref-materials/`: dense
grass blades in three greens (never a flat green field), dirt paths with stone
edges, layered volumetric trees (never flat cones), textured wood, and water
with mist and foam. See `v1.5-design/texture-design.md` for the full spec.

## Tech

- Rojo project (`default.project.json` → `game.rbxl`), Luau in `src/`
  (shared config/types, server karaoke + spawn safety, client HUD + karaoke
  UI + proximity prompts, workspace ambient script for particles, signs and
  the tree-forest grove).
- `CharacterAutoLoads` is true, with a real `SpawnLocation` and a
  `LoadCharacter` safety net, so the character always spawns.
- The world is generated from one layout (`tools/build-world.mjs`) into both
  the Roblox place and the Three.js screenshots, so the pictures show the
  same world that is in `game.rbxl`.
- Nine Creator Store models are embedded under `ReplicatedStorage.AssetModels`
  (including the tree-forest); the grove is cloned from it at runtime.
- No `SurfaceAppearance`, `EditableImage`, `EditableMesh`, `PartOperation`
  or `BaseWrap` instances anywhere, so the place can also be published via
  the Roblox Open Cloud Assets API.

## Play

Publish `game.rbxl` as a Public Roblox experience, put the play code in its
description, upload `icon-512.png` as the icon and `screenshots/1-hub.jpg`
as the first thumbnail.
