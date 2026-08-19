# Deploying the FetchMart backend

Target: the API on `https://api.fetchmart.com.ng`, on the same Hetzner VPS that
already runs Hirra CV. The mobile app talks to this host; the admin panel can
stay on Vercel.

This assumes the server work you already did for Hirra CV — `deploy` user,
ufw, swap, Docker — is in place. It is not repeated here.

The one structural difference from a fresh box: **Caddy is already running and
owns ports 80 and 443.** You are adding a site to it, not starting a second
one. Two Caddy containers cannot both bind those ports.

---

## 0. Which user runs what — read this first

Almost everything below runs as **`deploy`**, not root. Only one step needs
root: creating the folder under `/opt`, because `/opt` is root-owned.

**Why `deploy` can run Docker without `sudo`:** you added it to the `docker`
group during the Hirra setup (`usermod -aG docker deploy`). Membership of that
group *is* the permission — `sudo` is neither needed nor available.

> **Note:** `deploy` was created with `--disabled-password` and was never added
> to the `sudo` group, so **`sudo` will not work as `deploy`.** Any step that
> genuinely needs root has to be done from a root shell. That is why the
> commands below never use `sudo`.

**The two commands for moving between users:**

```bash
su - deploy     # root  → deploy   (no password needed; root may become anyone)
exit            # deploy → root    (returns to the shell you came from)
```

`exit` typed again at the root shell closes the SSH session entirely.

**When you are unsure who you are:**

```bash
whoami
```

Every section below is labelled with the user it must run as. If a command
fails with `Permission denied`, you are almost certainly the wrong one.

---

## 1. DNS first — on your laptop

| Type | Name | Value         | TTL |
| ---- | ---- | ------------- | --- |
| A    | `api`| your VPS IPv4 | 300 |

On the `fetchmart.com.ng` zone. Leave the apex pointing wherever the marketing
site lives.

On Cloudflare, set it to **DNS only** (grey cloud). Proxying terminates TLS
itself, so Caddy never sees the ACME challenge and the certificate never
issues.

```bash
dig +short api.fetchmart.com.ng
```

Wait for your VPS IP before continuing. Let's Encrypt rate-limits failed
attempts, so starting early costs you time rather than saving it.

---

## 2. Connect, and create the folder — **as `root`**

```bash
ssh root@<VPS_IP>
```

`/opt` is root-owned, so the directory must be made by root and handed to
`deploy`:

```bash
mkdir -p /opt/fetchmart
chown deploy:deploy /opt/fetchmart
```

Now drop to `deploy` and stay there for the rest of this guide:

```bash
su - deploy
```

Confirm it worked:

```bash
whoami        # should print: deploy
```

---

## 3. Shared network between Caddy and this stack — **as `deploy`**

Caddy has to reach the API container, and they live in different compose
projects. Compose gives each project its own private network
(`hirracv_default`, `fetchmart_default`), and containers on different networks
cannot see each other at all. One shared network joins them.

```bash
docker network create web 2>/dev/null || true
```

The `2>/dev/null || true` makes it safe to re-run: if `web` already exists,
Docker errors and this swallows it.

Find the Caddy container's name — Compose names containers
`<project>-<service>-<number>`, so it is probably `hirracv-caddy-1`:

```bash
docker ps --format '{{.Names}}\t{{.Image}}' | grep -i caddy
```

Attach it:

```bash
docker network connect web <caddy-container-name>
```

**Then make it permanent.** That attachment is not written in any file, so the
next `docker compose up -d` in `/opt/hirracv` recreates Caddy without it and
FetchMart starts returning 502 — weeks later, looking unrelated. Edit
`/opt/hirracv/docker-compose.prod.yml` (owned by `deploy`, so no root needed):

```yaml
    networks:
      - default      # keeps Hirra's backend reachable — do not omit
      - web          # adds FetchMart
```

and at the bottom of that file:

```yaml
networks:
  web:
    external: true
```

> **Careful:** adding a `networks:` key to a service *replaces* the implicit
> default. Listing only `web` would cut Caddy off from Hirra's backend. Both
> entries must be present.

Verify Caddy is on two networks:

```bash
docker inspect <caddy-container-name> \
  --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

---

## 4. Clone — **as `deploy`**

The folder already exists and is yours from step 2, so no `sudo` here:

```bash
git clone <your-repo-url> /opt/fetchmart
cd /opt/fetchmart/market-backend
```

Private repo: same options as before — a fine-grained PAT as the password, or
a read-only deploy key generated as `deploy` (`ssh-keygen -t ed25519`) and
added under repo → Settings → Deploy keys.

---

## 5. Secrets — **as `deploy`**

```bash
cd /opt/fetchmart/market-backend
cp .env.example .env
chmod 600 .env
nano .env
```

Every `REPLACE_ME` must be filled. The ones that will bite:

- **`DATABASE_URL`** — the Neon connection string, `?sslmode=require` included.
- **`REDIS_URL`** — ignore it. Compose overrides it to `redis://redis:6379`.
- **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`** — `openssl rand -base64 48`
  each. Never the dev values; they were published in this repo's docs.
- **`FLUTTERWAVE_WEBHOOK_HASH`** — must be character-identical to the value in
  the Flutterwave dashboard, or every webhook is rejected.
- **`SMS_PROVIDER=termii`** — `mock` silently logs codes instead of sending.
- **`CLOUDINARY_*`** — image upload returns 503 until these are real.
- **`OTP_TEST_NUMBERS`** — keep it for App Review, remove after approval.

Avoid `$` in any value; compose interpolates it away.

---

## 6. Start it — **as `deploy`**

```bash
cd /opt/fetchmart/market-backend
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

Migrations are run explicitly rather than on container start, so a failed
migration cannot leave a half-started API serving traffic against a schema it
does not match.

Check both containers are healthy before moving on:

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 7. Add the site to Caddy — **as `deploy`**

Append `deploy/Caddyfile.snippet` to the Caddyfile at
`/opt/hirracv/deploy/Caddyfile`:

```bash
cat /opt/fetchmart/market-backend/deploy/Caddyfile.snippet \
  >> /opt/hirracv/deploy/Caddyfile
```

Validate **before** applying — a bad Caddyfile that gets restarted takes Hirra
down with it:

```bash
docker exec <caddy-container-name> caddy validate --config /etc/caddy/Caddyfile
```

Silence means valid. Now reload — graceful, no dropped connections, and if the
config were bad the old one would simply stay live:

```bash
docker exec <caddy-container-name> caddy reload --config /etc/caddy/Caddyfile
```

Use `reload`, never `restart`.

Then from your laptop:

```bash
curl https://api.fetchmart.com.ng/health
```

A `200` over HTTPS means DNS, the shared network, the certificate and the app
are all correct.

---

## 8. Point the rest at it — dashboards, not the server

- **Flutterwave** → Settings → Webhooks →
  `https://api.fetchmart.com.ng/payments/webhook/flutterwave`, with the same
  hash as `FLUTTERWAVE_WEBHOOK_HASH`.
- **Flutterwave** → whitelist the VPS public IP. Until then payouts,
  withdrawals and the pool sweep all fail with an IP-whitelisting error.
- **Admin panel** → `NEXT_PUBLIC_API_URL=https://api.fetchmart.com.ng`, then
  redeploy (the value is baked in at build time).

---

## 9. Deploying a change later — **as `deploy`**

```bash
ssh deploy@<VPS_IP>        # straight in as deploy; no root step needed
cd /opt/fetchmart && git pull
cd market-backend
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

Roughly 30 seconds of downtime while containers swap.

> Your SSH key was copied to `/home/deploy/.ssh/authorized_keys` during the
> Hirra setup, so `ssh deploy@<VPS_IP>` works directly. Only the initial
> `/opt` folder creation ever needed root.

---

## 10. Backups — **as `deploy`**

Neon handles database backups, which is the part that cannot be rebuilt. The
one piece of local state worth keeping is the Redis append-only file — losing
it drops queued accept-timeout jobs, so in-flight orders would never
auto-cancel.

```bash
mkdir -p /opt/backups     # if it does not already exist from the Hirra setup
crontab -e                # as deploy, so it runs with docker-group access
```

```cron
0 3 * * * docker run --rm -v market-backend_redis-data:/data -v /opt/backups:/backup alpine tar czf /backup/fetchmart-redis-$(date +\%F).tar.gz -C /data . && find /opt/backups -name 'fetchmart-redis-*' -mtime +14 -delete
```

---

## Things that will actually go wrong

**`Permission denied` on a docker command.** You are root when the guide says
`deploy`, or vice versa. `whoami`, then `su - deploy` or `exit`.

**`sudo: command not found` / `deploy is not in the sudoers file`.** Expected —
`deploy` has no sudo rights by design. Nothing in this guide needs it. If a
step truly requires root, `exit` back to the root shell first.

**Certificate never issues.** DNS not propagated, Cloudflare proxying, or
Caddy not on the `web` network. Check `dig`, then
`docker logs <caddy> | tail -50`.

**502 from Caddy.** Caddy resolved the hostname but could not reach the
container. Confirm both are on `web`:
`docker network inspect web --format '{{range .Containers}}{{.Name}} {{end}}'`

**FetchMart 502s after an unrelated Hirra deploy.** The `web` attachment was
never written into Hirra's compose file — step 3, second half.

**API restarts in a loop.** Almost always `.env`. `docker compose -f
docker-compose.prod.yml logs api` names the missing variable — env validation
runs at boot and fails loudly by design.

**Orders never auto-cancel.** Redis is down or the API is pointed at the wrong
one. `docker compose -f docker-compose.prod.yml ps` should show `redis`
healthy.

**OTP not arriving.** `SMS_PROVIDER` is still `mock`, or the Termii wallet is
empty — an exhausted balance returns HTTP 200 with an error in the body, which
the provider treats as a failure rather than a silent success.
