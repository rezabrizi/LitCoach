function GithubAuth() {
    // const [authCode, setAuthCode] = useState(null);

    const handleAuth = async () => {
        await chrome.runtime.sendMessage({ action: "github_auth" });
    };

    return <button onClick={handleAuth}>Github Auth</button>;
}

export default GithubAuth;
