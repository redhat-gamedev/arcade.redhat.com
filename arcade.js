import "@patternfly/pfe-cta";
import "@patternfly/pfe-navigation";
import "@patternfly/pfe-icon";
import "@patternfly/pfe-card";
import "@patternfly/pfe-band";
import "@patternfly/pfe-button";

const keycloak = new Keycloak();

async function main() {
    await initializeKeycloakWithRetry();
    activateLoginButtons();
    authifyPlayButtons();
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

    console.log('keycloak initialized', {authenticated});

    if (authenticated) {
        localStorage.token = keycloak.token;
        localStorage.refreshToken = keycloak.refreshToken;
    }
}

function activateLoginButtons() {
    document.addEventListener("pfe-button:click", ev => {
        console.log("logging in");
        keycloak.login();
    });
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
