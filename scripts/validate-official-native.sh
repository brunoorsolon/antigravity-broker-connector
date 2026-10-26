#!/usr/bin/env bash
# Pinned official parser/install gate only. No sign-in, model, policy bypass or real credentials.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
url='https://storage.googleapis.com/antigravity-public/antigravity-cli/1.4.7-5900205422411776/linux-x64/cli_linux_x64.tar.gz'
curl --fail --location --max-time 120 "$url" -o "$tmp/cli.tgz"
printf '%s  %s\n' 'beda760587589f5827b0b516c3ec2c5bd5cd2e91eb0e2533807ba1e990a27dcd63aef0191e0b76fb60feab0d16eaa8210fb79842c34dd4809e257e1712edd152' "$tmp/cli.tgz" | sha512sum --check --status
tar -xzf "$tmp/cli.tgz" -C "$tmp"
mkdir -m 700 "$tmp/home"
export HOME="$tmp/home"
test "$("$tmp/antigravity" --version)" = '1.4.7'
"$tmp/antigravity" plugin validate "$root" --strict --json
"$tmp/antigravity" plugin install "$root"
"$tmp/antigravity" plugin list --json
