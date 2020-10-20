function goHome(redirectTo="/") {
    location.replace(`/?redirectTo=${redirectTo}`);
}
try {
    let username = localStorage.getItem("arcade-username");
    if (!username) {
        goHome(location.pathname);
    }
} catch (e) {
    console.log('not logged in, going home');
    goHome();
}
