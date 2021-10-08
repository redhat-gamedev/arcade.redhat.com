#!/usr/bin/env node

import browserSync from "browser-sync";

browserSync({
    host: "arcade.redhat.com",
    port: 443,
    open: false,
    server: "./",
    https: {
        cert: "./ssl/arcade.redhat.com.pem",
        key: "./ssl/arcade.redhat.com-key.pem",
    }
});
