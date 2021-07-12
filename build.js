import sqrl from "squirrelly";
import fs from "fs";
import toml from "toml";
import marked from "marked";

// don't auto-escpae HTML tags coming from content.toml
sqrl.defaultConfig.autoEscape = false;

// load html template

const html = fs.readFileSync("index-template.html");

// load and parse content.toml file

const content = toml.parse(fs.readFileSync("content.toml", "utf8"));

// apply markdown transformation to `description` fields in the content

content.site.description = marked(content.site.description);
for (let game of Object.values(content.games)) {
    game.description = marked(game.description);
}

// inject content into template

const output = sqrl.render(html.toString(), content, {useWith: true});

fs.writeFileSync("index.html", output);
