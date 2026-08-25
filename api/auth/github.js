export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: "Code is required" })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "GitHub OAuth not configured" })
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error })
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    const userData = await userRes.json()

    return res.status(200).json({
      access_token: tokenData.access_token,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: "Failed to exchange code" })
  }
}
