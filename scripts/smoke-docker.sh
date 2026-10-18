#!/usr/bin/env bash
set -euo pipefail
package_name="$(node -p "require('./package.json').name")"
package_version="$(node -p "require('./package.json').version")"
mkdir -p artifacts
# Exercise the same tarball layout that a community-package user installs.
# No credential or paid operation is supplied; execution must stop at authentication.
npm pack --ignore-scripts --json --pack-destination artifacts > artifacts/packed-package.json
package_archive="$(node -p "JSON.parse(require('fs').readFileSync('artifacts/packed-package.json', 'utf8'))[0].filename")"
docker run --rm --user root \
  -v "$PWD:/package:ro" \
  -e N8N_DIAGNOSTICS_ENABLED=false \
  -e N8N_VERSION_NOTIFICATIONS_ENABLED=false \
  -e N8N_TEMPLATES_ENABLED=false \
  -e PACKAGE_NAME="$package_name" \
  -e PACKAGE_VERSION="$package_version" \
  -e PACKAGE_ARCHIVE="$package_archive" \
  --entrypoint /bin/sh "${N8N_IMAGE:-n8nio/n8n:2.43.7}" -ec '
    mkdir -p /home/node/.n8n/nodes
    npm install --prefix /home/node/.n8n/nodes --ignore-scripts --legacy-peer-deps \
      --no-audit --no-fund "/package/artifacts/$PACKAGE_ARCHIVE"
    npm ls --prefix /home/node/.n8n/nodes --depth=0
    export NODE_PATH=/usr/local/lib/node_modules/n8n/node_modules
    export N8N_USER_FOLDER=/home/node
    node /package/scripts/assert-installed-package.cjs
    n8n --version
    n8n import:workflow --input=/package/tests/load-workflow.json
    if n8n execute --id=aceSunoSmokeTest >/tmp/n8n-execution.log 2>&1; then
      cat /tmp/n8n-execution.log >&2
      echo "Expected execution to stop before an API request" >&2
      exit 1
    fi
    cat /tmp/n8n-execution.log
    if grep -Eiq "unrecognized node|unknown node|cannot find module|error loading|failed to load" /tmp/n8n-execution.log; then
      exit 1
    fi
    grep -Eiq "credential.*(not set|not found|missing|not configured|not available|required)|no credential|does not have any credentials" /tmp/n8n-execution.log
    echo "PASS: exact packed package installed in real n8n; execution stopped before any API call"
  ' > artifacts/n8n-load.log 2>&1 && status=0 || status=$?
cat artifacts/n8n-load.log
exit "$status"
