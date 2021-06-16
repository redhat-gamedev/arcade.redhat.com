import sqrl from "squirrelly";
import fs from "fs";
import toml from "toml";

// don't auto-escpae HTML tags coming from content.toml
sqrl.defaultConfig.autoEscape = false;

const html = fs.readFileSync("index-template.html");

const content = toml.parse(fs.readFileSync("content.toml", "utf8"));

const output = sqrl.render(html.toString(), content, {useWith: true});

fs.writeFileSync("index.html", output);
