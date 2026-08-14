# Hexis — deploy runbook (friends-and-family beta)

Stack: VPS (Hetzner-class) + Docker Compose (`compose.prod.yml`): Next.js standalone → Caddy (auto-TLS) → MySQL 8. Photos on the `uploads` volume. Spec: `docs/superpowers/specs/2026-08-14-beta-deploy-prep-design.md`.

## 0. Prerequisites (one-time, owner)

- VPS with a public IPv4 (2 GB RAM stačí), SSH key access.
- Domain/subdomain **A record → VPS IP** (propagated BEFORE first start — Let's Encrypt validates over HTTP).
- Optional: Sentry project → DSN (D2).

## 1. VPS bootstrap (one-time)

```bash
# as root
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw
# Docker (official convenience script)
curl -fsSL https://get.docker.com | sh
# Firewall: SSH + HTTP/HTTPS only
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

## 2. First deploy

```bash
git clone git@github.com:JakubSejda/hexis.git /opt/hexis && cd /opt/hexis
cp .env.production.example .env.production
nano .env.production        # DOMAIN, MYSQL_ROOT_PASSWORD, DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

# Build + start (first build ~ minutes)
docker compose -f compose.prod.yml --env-file .env.production up -d --build

# Migrations (one-off container from the builder stage)
docker compose -f compose.prod.yml --env-file .env.production --profile tools run --rm migrate

# Catalog seed (muscle groups + exercises; idempotent)
docker compose -f compose.prod.yml --env-file .env.production --profile tools run --rm migrate npm run db:seed
```

Check: `https://<DOMAIN>/login` loads with the HEXIS brand block; `docker compose -f compose.prod.yml ps` shows app/mysql/caddy healthy.

## 3. Beta accounts

```bash
docker compose -f compose.prod.yml --env-file .env.production --profile tools run --rm \
  seed-users alice@example.com bob@example.com
```

Passwords print to stdout only — send them personally. New accounts land in the onboarding wizard on first login.

## 4. Update (each release)

```bash
cd /opt/hexis && git pull
docker compose -f compose.prod.yml --env-file .env.production up -d --build app
# only when the release contains a new src/db/migrations/ file:
docker compose -f compose.prod.yml --env-file .env.production --profile tools run --rm migrate
```

Zero-downtime is not a goal at this scale — the rebuild swap takes seconds.

## 5. Backups (cron on the VPS)

```bash
mkdir -p /opt/hexis-backups
crontab -e
# daily 03:15, keep 14 days:
15 3 * * * docker compose -f /opt/hexis/compose.prod.yml --env-file /opt/hexis/.env.production exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" hexis' | gzip > /opt/hexis-backups/hexis-$(date +\%F).sql.gz && find /opt/hexis-backups -name '*.sql.gz' -mtime +14 -delete
```

Photos: `uploads` volume — add a second cron line if photos matter:
`20 3 * * * docker run --rm -v hexis_uploads:/data -v /opt/hexis-backups:/backup alpine tar czf /backup/uploads-$(date +\%F).tar.gz -C /data .`

Restore drill (do it once before inviting people): `gunzip < backup.sql.gz | docker compose ... exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" hexis`.

## 6. Troubleshooting

- **Caddy has no cert** → A record not propagated or port 80 blocked; `docker compose ... logs caddy`.
- **App 500s with CSS parse error** → the Tailwind source-scan time-bomb (see memory/globals.css `@source not` comments): a stray un-ignored file with class-like strings.
- **Login fails with CredentialsSignin after update** → migrations not applied (drizzle selects a missing column) — run the migrate one-off.
- **Logs**: `docker compose -f compose.prod.yml logs -f app`.
