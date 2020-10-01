const keycloak = new Keycloak();

window.kc = keycloak;

keycloak.init().success(async function(authenticated) {
    console.log(`[auth] initialized keycloak.js`);

    const storedToken = await localforage.getItem("arcade-username");
    let token = storedToken;

    // if there's no stored token, and we aren't authenticated, log in
    if (!storedToken && !authenticated) {
        console.log(`[auth] no user token found; logging in`);
        keycloak.login();
    }

    // if we're authenticated but the token hasn't been stored yet
    if (authenticated && !storedToken) {
        console.log(`[auth] logged in, storing user token`);
        token = _.pick(keycloak.tokenParsed, ["email", "preferred_username"])
        await localforage.setItem("arcade-username", token);
    }

    // if the token is stored locally, retrieve it and copy the username into a
    const email = token.email || "";
    const name = token.preferred_username || email.replace(/@.*/, "");
    console.log(`[auth] passing username ${name} to PAE`);
    if (name) {
        window.ARCADE_USERNAME = name;
        document.querySelector("#username").innerText = name;
    }

    document.body.removeAttribute("unauthenticated");

}).error(function() {
    console.log('failed to initialize');
});
