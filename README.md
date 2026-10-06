# Suno by AceDataCloud — n8n community node

Use [Suno through AceDataCloud](https://platform.acedata.cloud/documents/suno-audios) in your n8n workflows.

This package is maintained by **Ace Data Cloud** and connects to **AceDataCloud's API**. It is an AceDataCloud integration, not an official node from Suno, Inc.. You need an AceDataCloud account and a token for the corresponding service; a direct Suno subscription is not an AceDataCloud API credential.

Package: `@acedatacloud/n8n-nodes-suno` · License: MIT.

## Installation

On self-hosted n8n, open **Settings → Community Nodes → Install**, enter `@acedatacloud/n8n-nodes-suno`, and install. See [n8n's installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/).

n8n Cloud requires verified community nodes. Publishing this package to npm does not grant verification. Check the n8n node panel for current availability; this repository does not claim verified status.

## Credentials

1. Sign in to [AceDataCloud](https://platform.acedata.cloud).
2. Open the [Suno service documentation](https://platform.acedata.cloud/documents/suno-audios) and acquire service access.
3. Create a **Suno by AceDataCloud API** credential in n8n and enter that service's API token.

The token is stored in n8n's credential store and sent as a Bearer token only to `https://api.acedata.cloud`. The credential test queries an empty batch of tasks; it does not create media. Use a service API token, not a platform management token. Different services may require different credentials.

## Operations

| Resource | Operation | Result |
| --- | --- | --- |
| Audio | Create | Submits a generation task and returns its task ID |
| Lyrics | Create | Generates lyrics from a prompt |
| Task | Get | Returns a task's state and final result |
| Task | Get Many | Queries up to 50 comma-separated task IDs |

Audio creation supports a description or custom lyrics with a title and musical style, instrumental music, model selection, and optional vocal preferences.

## Generate and wait for a result

Import [`examples/generate-and-wait.json`](examples/generate-and-wait.json), assign your credential to both Suno nodes, and edit the prompt and model in **Create**.

The template submits once, then queries the returned task every 15 seconds. A separate 30-minute deadline bounds the loop. A failed task or deadline ends with an explicit failure; a completed task exposes the final media in `data`. The deadline does not cancel an already submitted service task; its ID remains available in the execution history.

With **Simplify** enabled:

- Create returns `taskId`, `status: "submitted"`, `finished: false`, `successful: null`, and `traceId`.
- Task Get returns `taskId`, `status` (`processing`, `succeeded`, or `failed`), `finished`, `successful`, `data`, `error`, and `traceId`.
- Audio URLs are typically in `data[].audio_url`.

Disable **Simplify** to receive the raw API response. A submission acknowledgment is not a completed generation.

## Billing, retries, and limits

Generation uses your AceDataCloud balance. Check current pricing and supported model options on the service page before running a workflow. The node keeps the selected model; it never substitutes another model.

Creation requests are not automatically retried. Re-running **Create**, enabling n8n's retry-on-fail setting on it, or restarting the workflow can create another paid task. After a timeout, inspect your existing task and use **Task → Get** where possible. Query operations can be retried without resubmitting generation.

Each incoming n8n item creates or queries one request; a batch of input items can create multiple paid tasks. A failed task is returned as `finished: true` and `successful: false` so your workflow can handle it. Authentication, request validation, and HTTP errors fail the node unless you configure n8n to continue on error.

## Data handling

The node sends only the configured generation/query parameters to AceDataCloud. Prompts and media URLs are processed by the service. Public input media URLs must be accessible to the API. This package has no runtime dependencies beyond n8n's own workflow API, no telemetry, and no filesystem or environment-variable access in its node implementation.

## Development

The package follows the official [n8n node starter](https://github.com/n8n-io/n8n-nodes-starter) structure and uses `@n8n/node-cli` for building and linting. The programmatic style keeps conditional media payloads, asynchronous task-state interpretation, and per-item output mapping explicit; all HTTP calls still use n8n’s authenticated request helper.

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run lint
pnpm test
pnpm run dev
```

Node.js 24 is used in CI. Tests exercise request payloads, task state handling, result mapping, credential configuration, item linking, and failures with a mocked HTTP boundary; they do not incur generation charges. CI also loads the compiled package in the official n8n 2.42.3 image and verifies that workflow execution reaches credential validation without sending a generation request.

Releases run from merged code through [GitHub Actions](.github/workflows/publish.yml) using `npm publish --provenance`. Open a pull request, pass CI, merge, and push a matching version tag, or run the Publish workflow on `main`. Keep the npm version immutable after publication.

## Support

Report integration issues at [AceDataCloud/SunoN8N](https://github.com/AceDataCloud/SunoN8N/issues). Include the package version, n8n version, operation, and a redacted error. Never include API tokens or private generation content.
