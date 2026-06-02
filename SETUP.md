# MiHCM Start My Day — Setup Guide

Automated daily login and **Start My Day** on MiHCM. Runs Mon–Fri around **08:30–08:45 PKT** with a random delay.

---

## GitHub + Pakistan routing

You said you want to keep **GitHub**. This repo is now configured for **GitHub-hosted runners**.

Important: GitHub runners do not provide Pakistan IP by default.  
To make traffic appear from Pakistan, add a **Pakistan proxy** and set these repository secrets:

- `MIHCM_PROXY_SERVER` (example: `http://host:port` or `socks5://host:port`)
- `MIHCM_PROXY_USERNAME` (optional)
- `MIHCM_PROXY_PASSWORD` (optional)

If proxy secrets are empty, the script runs normally on GitHub IPs.

---

## Setup

1. Push this repo to a private GitHub repository.
2. In **Settings → Secrets and variables → Actions**, add:
   - `MIHCM_USERNAME`
   - `MIHCM_PASSWORD`
   - `MIHCM_PROXY_SERVER` (optional, but required for Pakistan routing on GitHub)
   - `MIHCM_PROXY_USERNAME` (optional)
   - `MIHCM_PROXY_PASSWORD` (optional)
3. Go to **Actions** and run **MiHCM Start My Day** manually once to verify.

---

## Folder structure

```
mihcm/
├── .github/workflows/mihcm-start-day.yml
├── start-my-day.js
├── package.json
└── SETUP.md
```

---

## Notes

- Keeping GitHub-hosted runners + Pakistan appearance requires a proxy/VPN endpoint in Pakistan.
- You do not need to own a fixed IP; you just need a provider that gives Pakistan egress.

---

## Troubleshooting

- **Already clocked in:** script exits if it sees “End My Day”
- **Failure:** `debug-screenshot.png` in the project folder (or Actions artifact if using Option B)
- **Button not found:** MiHCM UI may have changed — update selectors in `start-my-day.js`

---

## Random timing

A random **0–15 minute** wait runs before the click (08:30–08:45 PKT window).
