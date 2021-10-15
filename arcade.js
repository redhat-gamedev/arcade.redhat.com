import "@patternfly/pfe-cta";
import "@patternfly/pfe-navigation";
import "@patternfly/pfe-icon";
import "@patternfly/pfe-card";
import "@patternfly/pfe-band";
import "@patternfly/pfe-button";

const keycloak = new Keycloak();
let keycloakInitialized = false;

async function main() {
    await initializeKeycloakWithRetry();

    // if it worked, handle it in the UI
    if (keycloakInitialized) {
        activateLoginButtons();
        authifyPlayButtons();
    }
    // if keycloak init didn't work, don't touch the UI, it's default state is
    // to display nothing authentication-related.
}

function clearTokens() {
    localStorage.clear();
}

async function initializeKeycloakWithRetry() {
    try {
        await initializeKeycloak();
    } catch (e) {
        // if an error occurs during keycloak init, it's probably because of
        // corrupt saved tokens.  clear them and try once again
        clearTokens();
        await initializeKeycloak();
    }
}

async function initializeKeycloak() {
    const keycloakInitOptions = {
        promiseType: "native",
        checkLoginIframe: false,
        onLoad: location.search.includes("warhw") ? "login-required" : undefined,
        token: localStorage.token || undefined,
        refreshToken: localStorage.refreshToken || undefined,
    };

    const authenticated = await keycloak.init(keycloakInitOptions);

    console.log('keycloak initialized', { authenticated });

    keycloakInitialized = true;

    if (authenticated) {
        localStorage.token = keycloak.token;
        localStorage.refreshToken = keycloak.refreshToken;
    }
}

function activateLoginButtons() {
    document.addEventListener("pfe-button:click", ev => {
        if (ev.target.getAttribute("arcade-action") === "login") {
            console.log("logging in");
            keycloak.login();
        }
        else if (ev.target.getAttribute("arcade-action") === "logout") {
            console.log("logging out");

            // remove warhw querystring from the post-logout landing page to
            // prevent automatic re-login.  if this ever needs to be more
            // robust, use `new URL(location)` and remove the querystring from
            // there.
            const redirectUri = new URL(location);
            redirectUri.search = "";
            keycloak.logout({ redirectUri: redirectUri.href });
        }
    });

    document.querySelector("#warhw-login").classList.remove("inactive");

    if (keycloak.authenticated) {
        let displayName;
        try {
            // try to get preferreed_username
            displayName = keycloak.tokenParsed.preferred_username;
        } catch (e) {
            // if that fails, try to extract username from email
            try {
                displayName = keycloak.tokenParsed.email.split("@")[0];
            } catch (e) {
                // if that fails, assign a default
                displayName = "Red Hat Associate";
            }
        }

        document.querySelector("#warhw-logged-in").classList.remove("inactive");
        document.querySelector("#warhw-login-id").textContent = displayName;

        [...document.querySelectorAll(".warhw.eligible.inactive")].forEach(e => e .classList.remove("inactive"));
    }
    else {
        document.querySelector("#warhw-login-prompt").classList.remove("inactive");
    }
}

function authifyPlayButtons() {
    if (keycloak.authenticated) {
        const playButtons = document.querySelectorAll("[arcade-play-link]");

        [...playButtons].forEach(btn => {
            const url = new URL(btn.href);
            url.hash = keycloak.token;
            console.log(`adding auth hash to ${btn.href}`);
            btn.href = url.href;
        });
    }
    else {
        console.log('skipping autify play buttons');
    }
}

main();
