const keycloak = new Keycloak();

window.kc = keycloak;

keycloak.init().success(async function(authenticated) {
    console.log(`[auth] initialized keycloak.js`);

    let name = localStorage.getItem("arcade-username");
    let storedToken;

    try {
        storedToken = JSON.parse(localStorage.getItem("arcade-token"));
    } catch (e) {
        console.error(`Couldn't decode stored token.`);
        return;
    }

    // if there's no stored token, and we aren't authenticated, log in
    if (!storedToken && !authenticated) {
        console.log(`[auth] no user token found; logging in`);
        keycloak.login();
    }

    // if we're authenticated but the token hasn't been stored yet
    if (authenticated && !storedToken) {
        console.log(`[auth] logged in, storing user token`);
        name = keycloak.tokenParsed.preferred_username || (keycloak.tokenParsed.email || "").replace(/@.*/, "")
        localStorage.setItem("arcade-username", name);
        localStorage.setItem("arcade-token", JSON.stringify(keycloak.tokenParsed));
    }

    // if the token is stored locally, retrieve it and copy the username into a
    console.log(`[auth] passing username ${name} to PAE`);
    if (name) {
        document.querySelector("#username").innerText = name;
    }

    document.body.removeAttribute("unauthenticated");

}).error(function() {
    console.log('failed to initialize');
});
