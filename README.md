# arcade.redhat.com

## Updating the site

### Initial setup

You'll need nodejs and npm installed.

```
npm install
```

### Editing content.toml

To edit the content on the site, edit `content.toml` with your favorite text editor.

After editing, run `npm run build` to rebuild index.html.  Commit the changes (including the rebuilt index.html), and submit a PR.

#### Top-level content

The `[site]` section contains top-level arcade.redhat.com content.


#### Games content, editing and adding

The series of `[games.name]` sections contain content for each game listed on the arcade.  The ordering of the games on arcade.redhat.com will match the ordering of the entries within `content.toml`.

Paste the following into `content.toml`, then edit the title, description, etc to reflect the information about the game being added.

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
