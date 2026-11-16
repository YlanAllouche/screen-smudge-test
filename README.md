# Screen Smudge Test

A moving wall of your own text to compare font rendering across screens, terminals, and browsers.

On macOS, text can look blurry, fuzzy, jagged, misaligned, or smudged when switching between a MacBook display and an external monitor, or between Ghostty, kitty, and Chrome. Still images don't always capture it—refresh and movement seem to matter too.
Alternate between light and dark mode font rendering.

Point this at a folder of notes for familiar words, then compare apps and displays side by side. **Pages** replaces the whole screen; **Stream** updates characters from top left to bottom right. Both fill the screen and loop. Binary files are skipped.

Requires Node.js 18+. Run in a browser:

```sh
npx --allow-git=all --ignore-scripts --yes --package=github:YlanAllouche/screen-smudge-test screen-smudge-test .
```

Or in a PTY:

```sh
npx --allow-git=all --ignore-scripts --yes --package=github:YlanAllouche/screen-smudge-test screen-smudge-test --terminal .
```

Replace `.` with any folder, or leave it out to use the current one. In browser mode, open the printed address and choose the font, speed, and light or dark background. In the terminal: **Space** plays/pauses, **S** switches modes, **B** changes background, **+ / −** changes speed, and **Q** quits.

`--allow-git=all` permits downloading the package from GitHub. `--ignore-scripts` uses the included build.
