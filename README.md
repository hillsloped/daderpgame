# DaDerpGame

**AI Slop but funni 😂🎉**

A cursed browser block game. Floating islands sit above an endless world with six biomes (plains, forest, mountains, caves, ocean and the Hellscape). There are castles full of loot, tanks, mechs, demons, zombies, a jet swarm called the Clankers that rises every 5 days, a white horse named Count who yells MUD!, and a backrooms dimension with a 50-block-tall boss.

It is a static site: plain HTML, CSS and JavaScript with no build step.

## Put it on GitHub Pages

1. Create a new repository on GitHub, for example `daderpgame`. Public repos get Pages for free.
2. Upload everything inside this folder to the root of the repository: `index.html`, `css/`, `js/`, `.nojekyll` and this README. On the repo page, use **Add file → Upload files** and drag the files in, then commit.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then click **Save**.
5. After a minute or two, the game is live at `https://<your-username>.github.io/<repo-name>/`.

## Run it on your own computer

Opening `index.html` directly works in most browsers. If something does not load, run a tiny local server from this folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Good to know

- **Saves** live in your browser's local storage, per browser and per device. Clearing site data deletes them.
- **Internet is needed** on first load. three.js (r128) comes from cdnjs and the fonts come from Google Fonts.
- **Files**
  - `js/game.js` holds the whole game, including the guy model and the sneakers texture.
  - `css/style.css` holds every style.
  - `index.html` holds the menus and the HUD markup.

## Controls

| Key | Does |
| --- | --- |
| WASD / Space | walk, jump, swim up, climb vines |
| Tab / Shift | sprint / crouch (crouching won't walk off edges) |
| Left click | mine, hit, shoot, fire vehicle weapons |
| Right click | place, eat, open chests, trade, ride, fire the Chicken Cannon |
| E | inventory and 5×5 crafting |
| P | skateboard |
| F5 or V | change camera view |
| R | reload |
| Esc | pause |
