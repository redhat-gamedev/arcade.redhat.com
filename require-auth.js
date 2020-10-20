function goHome(redirectTo="/") {
    location.replace(`/?redirectTo=${redirectTo}`);
}
try {
    let username = localStorage.getItem("arcade-username");
    if (!username) {
        console.log('not logged in, going home');
        goHome(location.pathname);
    }
} catch (e) {
    console.log('error determining login state, going home');
    goHome();
}
