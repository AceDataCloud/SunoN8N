#!/usr/bin/env bash
set -euo pipefail
export PACKAGE_NAME="$(node -p "require('./package.json').name")"
export PACKAGE_VERSION="${PACKAGE_VERSION:-$(node -p "require('./package.json').version")}"
mkdir -p artifacts
docker run --rm --user root \
  -v "$PWD:/source:ro" \
  -e PACKAGE_NAME -e PACKAGE_VERSION \
  -e N8N_DIAGNOSTICS_ENABLED=false \
  -e N8N_VERSION_NOTIFICATIONS_ENABLED=false \
  -e N8N_TEMPLATES_ENABLED=false \
  --entrypoint sh "${N8N_IMAGE:-n8nio/n8n:2.43.7}" -ec '
    mkdir -p /home/node/.n8n/nodes
    npm install --prefix /home/node/.n8n/nodes --registry=https://registry.npmjs.org \
      --ignore-scripts --legacy-peer-deps --no-audit --no-fund /source/artifacts/published/package.tgz
    npm ls --prefix /home/node/.n8n/nodes --depth=0
    export NODE_PATH=/usr/local/lib/node_modules/n8n/node_modules
    export N8N_USER_FOLDER=/home/node
    node /source/scripts/assert-installed-package.cjs
    workflow_id="$(node -p "require(\"/source/tests/load-workflow.json\").id")"
    n8n --version
    n8n import:workflow --input=/source/tests/load-workflow.json
    if n8n execute --id="$workflow_id" >/tmp/execution.log 2>&1; then
      cat /tmp/execution.log >&2
      echo "Expected missing credentials before any API call" >&2
      exit 1
    fi
    cat /tmp/execution.log
    if grep -Eiq "unrecognized node|unknown node|cannot find module|error loading|failed to load" /tmp/execution.log; then exit 1; fi
    grep -Eiq "credential.*(not set|not found|missing|not configured|not available|required)|no credential|does not have any credentials" /tmp/execution.log
    echo "PASS: exact public npm bytes installed and imported; no authenticated API request"
  ' > artifacts/published-host-install.log 2>&1 && status=0 || status=$?
cat artifacts/published-host-install.log
exit "$status"
