const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

// Replace with your Brightspace domain + app credentials
const BRIGHTSPACE_DOMAIN = "https://<your-brightspace-domain>";
const CLIENT_ID = "<your-client-id>";
const CLIENT_SECRET = "<your-client-secret>";
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// 1. Start OAuth login
app.get("/login", (req, res) => {
  const authUrl = `${BRIGHTSPACE_DOMAIN}/d2l/auth/api/oauth2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// 2. Handle Brightspace redirect with ?code=
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code received!");

  // Exchange code for tokens
  const tokenRes = await fetch(`${BRIGHTSPACE_DOMAIN}/d2l/auth/api/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const tokens = await tokenRes.json();
  console.log("Tokens:", tokens);

  if (tokens.access_token) {
    // Example: call Brightspace "WhoAmI" API
    const apiRes = await fetch(`${BRIGHTSPACE_DOMAIN}/d2l/api/lp/1.32/users/whoami`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await apiRes.json();
    res.json({ tokens, userInfo });
  } else {
    res.json(tokens);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/login to start OAuth flow`);
});
