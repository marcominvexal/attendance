# MiHCM Start My Day — Setup Guide

Automated daily login and "Start My Day" click via GitHub Actions. Runs Mon–Fri at a random time between 08:30–08:45 PKT (03:30–03:45 UTC). Works even when your PC is off.

---

## Folder Structure

Set up your GitHub repo like this:

```
your-repo/
├── .github/
│   └── workflows/
│       └── mihcm-start-day.yml   ← copy mihcm-start-day.yml here
├── start-my-day.js
├── package.json
└── SETUP.md
```

---

## Step 1 — Create a GitHub Repository

1. Go to https://github.com/new
2. Create a **private** repository (important — keeps your code private)
3. Clone it to your PC:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

---

## Step 2 — Add the Files

Copy these files into your cloned repo:
- `start-my-day.js`
- `package.json`
- Create folder `.github/workflows/` and put `mihcm-start-day.yml` inside it

---

## Step 3 — Add GitHub Secrets (credentials go here, NOT in code)

1. Go to your repo on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name       | Value                        |
|-------------------|------------------------------|
| `MIHCM_USERNAME`  | `waqi.anwer@invexal.com`     |
| `MIHCM_PASSWORD`  | *(your MiHCM password)*      |

---

## Step 4 — Push to GitHub

```bash
cd your-repo
git add .
git commit -m "Add MiHCM automation"
git push origin main
```

---

## Step 5 — Enable GitHub Actions

1. Go to your repo → **Actions** tab
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. The workflow will now run automatically Mon–Fri

---

## Step 6 — Test Manually

To run it right now without waiting for the schedule:
1. Go to **Actions** tab in your repo
2. Click **"MiHCM Start My Day"** in the left panel
3. Click **"Run workflow"** → **"Run workflow"**

---

## Troubleshooting

**If the automation fails**, GitHub will:
- Show the error in the Actions tab
- Upload a `debug-screenshot.png` as an artifact (visible under the failed run)

The screenshot shows exactly what the browser saw, making it easy to fix selector issues.

**Common issues:**
- MiHCM changed the button label → update the selector in `start-my-day.js`
- Login redirects through SSO → may need additional steps in the script
- GitHub Actions cron can occasionally be delayed by 5–15 min under heavy load

---

## How the Random Timing Works

The workflow starts at exactly 03:30 UTC. Before running the script, it sleeps for a random number of seconds between 0–900 (0–15 minutes). This means the actual click happens anywhere between 08:30–08:45 PKT, appearing more human-like.
