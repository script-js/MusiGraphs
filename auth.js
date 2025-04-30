const clientId = '75cbbb83721048b18a5cf0eb9e912ff7';
const redirectUri = 'https://musiccompatibility.pages.dev/auth';

async function spotifyAuth() {
    const generateRandomString = (length) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    const codeVerifier = generateRandomString(64);

    const sha256 = async (plain) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }

    const base64encode = (input) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    const authUrl = new URL("https://accounts.spotify.com/authorize")

    // generated in the previous step
    sessionStorage.setItem('code_verifier', codeVerifier);

    const params = {
        response_type: 'code',
        client_id: clientId,
        code_challenge_method: 'S256',
        scope: "playlist-read-private",
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    }

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();

}

async function getToken() {
    var code = new URLSearchParams(location.search).get("code")
    if (code) {
        var codeVerifier = sessionStorage.getItem('code_verifier');

        var url = "https://accounts.spotify.com/api/token";
        var payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        }

        var body = await fetch(url, payload);
        var response = await body.json();

        localStorage.setItem('accessToken', response.access_token)
        location.replace("/")
    } else {
        document.body.innerHTML = "<h1 style='text-align:center'>No authorization code</h1>"
    }
}