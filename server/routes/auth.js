const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

function cookieOptions(extra = {}) {
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', ...extra };
}

// Send the user to GitHub
router.get('/auth/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, cookieOptions({ maxAge: 10 * 60 * 1000 }));

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/api/auth/github/callback`,
    scope: 'read:user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;
  res.clearCookie('oauth_state', cookieOptions());

  if (!code || !state || state !== savedState) {
    return res.redirect('/login?error=state');
  }

  try {
    // Exchange the code for a GitHub access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BASE_URL}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token from GitHub');

    // Use it once to identify the user
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-capsule',
        Accept: 'application/vnd.github+json',
      },
    });
    if (!userRes.ok) throw new Error('GitHub user lookup failed');
    const ghUser = await userRes.json();

    // Express issues ITS OWN application JWT (GitHub token is discarded)
    const appJwt = jwt.sign(
      { sub: String(ghUser.id), login: ghUser.login, avatar: ghUser.avatar_url },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.cookie('token', appJwt, cookieOptions({ maxAge: 7 * 24 * 60 * 60 * 1000 }));
    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth error:', err.message);
    res.redirect('/login?error=oauth');
  }
});

// Who am I? (React uses this to decide if /dashboard is allowed)
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ ok: true });
});

module.exports = router;