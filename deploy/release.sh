#!/usr/bin/env bash
# Root-only deployment from a reviewed source directory on this server.
# Usage: sudo bash deploy/release.sh /opt/shiftos/source
set -euo pipefail
[[ "$EUID" -eq 0 ]] || { echo "Run as root" >&2; exit 1; }
SOURCE=$(realpath "${1:?Provide the source directory}")
[[ -f "$SOURCE/package-lock.json" && -f "$SOURCE/deploy/shiftos.service" ]] || exit 1
[[ -f /etc/shiftos/app.env ]] || { echo "Missing /etc/shiftos/app.env" >&2; exit 1; }
# Serialize releases; a second deploy must not switch the symlink during a build.
exec 9>/run/shiftos-deploy.lock
flock -n 9 || { echo "Another deployment is running" >&2; exit 1; }
RELEASE=$(date -u +%Y%m%dT%H%M%SZ)-$(runuser -u shiftos -- git -C "$SOURCE" rev-parse --short HEAD)
TARGET="/opt/shiftos/releases/$RELEASE"
[[ ! -e "$TARGET" ]] || { echo "Release already exists" >&2; exit 1; }
install -d -o shiftos -g shiftos /opt/shiftos/releases "$TARGET"
# npm lifecycle scripts and the build run as the unprivileged service account.
# Only public Supabase settings, APP_ORIGIN and AI_PROVIDER belong in app.env.
runuser -u shiftos -- bash -c '
  set -euo pipefail
  set -a; source /etc/shiftos/app.env; set +a
  cd "$1"
  export NEXT_TELEMETRY_DISABLED=1
  npm ci --no-audit --no-fund
  NODE_OPTIONS=--max-old-space-size=768 npm run build
' bash "$SOURCE"
cp -a "$SOURCE/.next/standalone/." "$TARGET/"
cp -a "$SOURCE/.next/static" "$TARGET/.next/static"
if [[ -d "$SOURCE/public" ]]; then cp -a "$SOURCE/public" "$TARGET/public"; fi
install -d -o shiftos -g shiftos "$TARGET/.next/cache"
chown -R root:shiftos "$TARGET"
chmod -R g+rX,o-rwx "$TARGET"
chown -R shiftos:shiftos "$TARGET/.next/cache"
install -m 644 "$SOURCE/deploy/shiftos.service" /etc/systemd/system/shiftos.service
PREVIOUS=$(readlink -f /opt/shiftos/current || true)
ln -s "$TARGET" /opt/shiftos/current.next
mv -Tf /opt/shiftos/current.next /opt/shiftos/current
systemctl daemon-reload
systemctl enable shiftos
systemctl restart shiftos
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3000/api/health >/dev/null; then
    printf 'Release ready: %s\n' "$RELEASE"
    if [[ -n "$PREVIOUS" ]]; then printf '%s\n' "$PREVIOUS" > /opt/shiftos/previous-release; fi
    exit 0
  fi
  sleep 2
done
echo "Health check failed; restoring previous release when available" >&2
if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
  ln -s "$PREVIOUS" /opt/shiftos/current.rollback
  mv -Tf /opt/shiftos/current.rollback /opt/shiftos/current
  systemctl restart shiftos
else
  systemctl stop shiftos
fi
exit 1
