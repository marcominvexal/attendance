# Morning trigger setup (08:30–08:45 PKT)

GitHub's built-in schedule **can run hours late** (e.g. 19:19 instead of 08:30).  
Use **cron-job.org** (free) as the **primary** trigger so attendance marks in the **morning**.

---

## Step 1 — Create a GitHub token

1. Go to https://github.com/settings/tokens?type=beta
2. **Generate new token** (fine-grained)
3. Repository access: **Only marcominvexal/attendance**
4. Permissions: **Actions → Read and write**
5. Copy the token (save it — shown once)

---

## Step 2 — Create cron-job.org account

1. Go to https://cron-job.org/en/signup/
2. Sign up (free)

---

## Step 3 — Create the cron job

1. **Create cronjob**
2. **Title:** `MiHCM Morning Attendance`
3. **URL:** `https://api.github.com/repos/marcominvexal/attendance/dispatches`
4. **Schedule:** Mon–Fri at **08:30** — timezone **Asia/Karachi**
5. **Request method:** `POST`
6. **Headers:**
   - `Accept`: `application/vnd.github+json`
   - `Authorization`: `Bearer YOUR_GITHUB_TOKEN`
   - `Content-Type`: `application/json`
7. **Request body:**
   ```json
   {"event_type":"morning-run","client_payload":{}}
   ```
8. Save and enable

The workflow adds a random **0–15 minute** delay → actual click between **08:30–08:45 PKT**.

---

## How it works

| Trigger | When it runs | Morning safe? |
|---------|--------------|---------------|
| **cron-job.org** | 08:30 PKT Mon–Fri | ✅ Yes (primary) |
| GitHub schedule | Backup (may be late) | ✅ Blocked if after 08:50 PKT |
| Manual (Actions) | Anytime you click | For testing only |

---

## Test cron-job

After saving, click **Run now** on cron-job.org, then check:  
https://github.com/marcominvexal/attendance/actions

You should see a run triggered by `repository_dispatch`.
