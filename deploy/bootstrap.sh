#!/usr/bin/env bash
# For a NEW, dedicated Debian 13 x64 server. Review before running as root.
# Usage: sudo bash deploy/bootstrap.sh app.example.com
set -euo pipefail
[[ "$EUID" -eq 0 && $(uname -m) == x86_64 ]] || exit 1
DOMAIN=${1:?Provide the DNS hostname pointing to this server}
[[ "$DOMAIN" =~ ^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "Invalid hostname" >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl xz-utils git gnupg debian-keyring debian-archive-keyring apt-transport-https ufw
# Official Node.js binary; verify its SHA256 against the vendor's HTTPS manifest.
DOWNLOAD=$(mktemp -d)
trap 'rm -rf -- "$DOWNLOAD"' EXIT
curl --fail --silent --show-error https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o "$DOWNLOAD/SHASUMS256.txt"
NODE_ARCHIVE=$(awk '$2 ~ /^node-v22\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz$/ {print $2}' "$DOWNLOAD/SHASUMS256.txt")
[[ "$NODE_ARCHIVE" =~ ^node-v22\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz$ ]] || exit 1
curl --fail --silent --show-error "https://nodejs.org/dist/latest-v22.x/$NODE_ARCHIVE" -o "$DOWNLOAD/$NODE_ARCHIVE"
(cd "$DOWNLOAD" && sha256sum --check --ignore-missing SHASUMS256.txt)
tar -xJf "$DOWNLOAD/$NODE_ARCHIVE" -C /usr/local --strip-components=1
node --version
npm --version
# Official Caddy APT repository; no remote shell installer is executed.
curl --fail --silent --show-error https://dl.cloudsmith.io/public/caddy/stable/gpg.key -o "$DOWNLOAD/caddy.key"
gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg "$DOWNLOAD/caddy.key"
curl --fail --silent --show-error https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
chmod 644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy
id shiftos >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/shiftos --shell /usr/sbin/nologin shiftos
install -d -o root -g shiftos -m 750 /opt/shiftos /etc/shiftos
if [[ ! -f /etc/shiftos/app.env ]]; then
  printf 'APP_ORIGIN=https://%s\nNEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\nAI_PROVIDER=disabled\n' "$DOMAIN" > /etc/shiftos/app.env
fi
chown root:shiftos /etc/shiftos/app.env
chmod 640 /etc/shiftos/app.env
# A 1 GB pilot needs swap while compiling. Never replace an existing swap setup.
if [[ $(swapon --show --noheadings | wc -l) -eq 0 && ! -e /swapfile-shiftos ]]; then
  fallocate -l 2G /swapfile-shiftos
  chmod 600 /swapfile-shiftos
  mkswap /swapfile-shiftos
  swapon /swapfile-shiftos
  printf '/swapfile-shiftos none swap sw 0 0\n' >> /etc/fstab
fi
printf '%s {\n  encode zstd gzip\n  header Strict-Transport-Security "max-age=31536000"\n  reverse_proxy 127.0.0.1:3000\n}\n' "$DOMAIN" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
systemctl enable --now caddy
systemctl reload caddy
printf 'Bootstrap complete. Set DNS, review app.env, then run deploy/release.sh.\n'
