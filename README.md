# Kinsley's Meow Doku

A web version of the Meowdoku cat logic puzzle, personalized for Kinsley.

## Play it

Open `index.html` in a browser, or serve the folder so it works like an app on a phone:

```
cd ~/meowdoku
python3 -m http.server 8080
```

Then visit `http://<your-computer-ip>:8080` on the phone and choose "Add to Home Screen".

## Rules

- One kitty in every colored area.
- One kitty in every row and every column.
- Kitties can't touch, not even diagonally.
- Tap once for an X, tap again to place a kitty, tap a kitty to remove it. Long-press an X to erase it.
- 3 hearts per level. A wrong kitty costs a heart. Hints: 3 per level.
- Early levels start with sleeping kitties already placed (2 on levels 1-10, 1 on 11-40, none after), like the real game.

## Personal touches

- Tap the profile picture to pick an animal avatar.
- Level chapters are named after Kinsley and her friends (Emily, Rainey, Lee Ander, Abby, Ellie Kate, Flora, Elijah).
- Every kitty you place gets a friend's name tag.
- Win messages use the player's name. The name can be changed in Settings.

## Files

- `index.html`, `style.css`, `app.js` – the app
- `puzzle.js` – seeded puzzle generator and solver (every level is the same puzzle every time, with exactly one solution)
- `assets/` – app icons
