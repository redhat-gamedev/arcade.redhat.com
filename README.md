# arcade.redhat.com

## Updating the site

### Initial setup

You'll need nodejs and npm installed, then:

```
npm install
npm start
```

### Editing content

Page content is stored in `content.toml` and injected into `index-template.html` using the [squirrelly](https://squirrelly.js.org/) template engine.

To update content on the site, open `content.toml` with your favorite text editor.

After editing, run `npm run build` to rebuild index.html.  Commit the changes (including the rebuilt index.html), and submit a PR.

#### Hero content

The `[site]` section contains top-level arcade.redhat.com content.


#### Adding/editing the games list

The series of `[games.*]` sections contain content for each game listed on the arcade.  The ordering of the games on arcade.redhat.com will match the ordering of the entries within `content.toml`.

To add a new game, paste the following into `content.toml`, then edit the title, description, etc to reflect the information about the game being added.

```toml
[games.name]
title =  "Game Title"
play = "URL to play the game"
contribute = "URL to contribute to the game"
thumb = "URL to a thumbnail for the game"
description = """
Multi-line description of the game.  Can include HTML.
"""
```

Note, remember to replace the `name` in `[games.name]` with a shorthand or acronym for your game.  See the other games' entries for examples.

After editing, remember to run `npm run build` to rebuild index.html.

#### Changing layout and styles

The styles are in `styles.css`, which gets bundled with esbuild into `./build/styles.css`.  The styles are fairly simple, so there's no need yet for a preprocessor.  Most of the styles come from [PatternFly Elements](https://patternflyelements.com/).

The layout is stored in `index-template.html`.  During the build, the `content.toml` data gets injected into the template, and the result is written to `index.html`.  Don't edit `index.html` directly.


