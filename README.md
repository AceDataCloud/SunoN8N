# Suno by Ace Data Cloud — n8n community node

Use [Suno through AceDataCloud](https://platform.acedata.cloud/documents/suno-audios?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=sunon8n_readme_documents_suno_audios) in your n8n workflows.

This package is maintained by **Ace Data Cloud** and connects to **AceDataCloud's API**. It is an AceDataCloud integration, not an official node from Suno, Inc.. You need an AceDataCloud account and a token for the corresponding service; a direct Suno subscription is not an AceDataCloud API credential.

Package: `@acedatacloud/n8n-nodes-suno` · License: MIT.

## Installation

On self-hosted n8n, open **Settings → Community Nodes → Install**, enter `@acedatacloud/n8n-nodes-suno`, and install. See [n8n's installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/).

n8n Cloud requires verified community nodes. Publishing this package to npm does not grant verification. Check the n8n node panel for current availability; this repository does not claim verified status.

## Use the node

Search for **Suno** after installation. Choose **Suno by Ace Data Cloud**; the integration is maintained by Ace Data Cloud, not the model developer. Related search phrases are `suno`, `suno music`, `music generation`. These are discovery hints, not a claim about search rank or official approval.

- **Self-hosted n8n:** follow [the official community-node installation instructions](https://docs.n8n.io/integrations/community-nodes/installation-and-management/gui-installation/) and install `@acedatacloud/n8n-nodes-suno`. After installation, add a Manual Trigger (or use your existing trigger), then use its next **+** to find the node. This is a processing/query node, not a trigger.
- **n8n Cloud:** use [the verified-node picker](https://docs.n8n.io/integrations/community-nodes/installation-and-management/install-verified-community-nodes/) only when this package is officially available there. Do not paste an unverified package name into Cloud or treat npm publication as verification.
- Create **Suno by Ace Data Cloud API** in n8n credentials, then paste your raw application API token into **API Token**. See [Credentials](#credentials) for account registration, General application initialization and optional expiry/access/usage limits.

![Official n8n reference: add an action after a trigger](https://raw.githubusercontent.com/n8n-io/n8n-docs/4a84a4229f694c8565dcd0a9cd0af37623fa2cbc/docs/get-started/.gitbook/assets/build-your-first-workflow-get-weather-01.png)

Official n8n tutorial image, referenced on 2026-10-18; its original capture date and exact version are not declared. The pictured HTTP Request node illustrates the native action-picker layout, not this service's installation or output. Use this package's service name in your own picker. [Official source](https://docs.n8n.io/get-started/build-your-first-workflow).

### Read an existing task first

1. Add this node after a trigger and choose **Resource → Task**, **Operation → Get**. Select the credential for this service.
2. Paste an existing task ID returned by this same service. The **Task ID** field is not a prompt or a video/image URL. Leave creation and n8n retry-on-fail off.
3. Execute that query node once. Continue only when `finished` and `successful` are true; inspect `data` for the final media URL. A pending response or task ID is not the final output. Record 401/403 and check access rather than creating a replacement task.

For new creation, choose **Resource → Audio**, **Operation → Create**, then explicitly select the model and inputs. Check [current pricing](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=sunon8n_readme_pricing) and balance before executing once. Keep the returned ID and query it after a timeout; restarting creation can incur another charge. Each incoming item can create a separate task. No model fallback is added by this integration.

The API-key screenshots below are real platform references; this README does not claim that they show an n8n installation or output. Native n8n installation/configuration screenshots must identify the actual package/version and contain no secret. All customer-facing node text and documentation remain English to match [n8n verification requirements](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines/).

## Credentials

1. Open [Ace Data Cloud → Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=sunon8n_readme_api_key). Sign in, or register an account first.
2. Find **General application**. If it has not been created, choose **Initialize General Application**. A general key can use the services available to your account; a dedicated application's key is limited to its service. Check the required service/model access and [current pricing](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=sunon8n_readme_pricing).
3. Copy the **API Key** from the application card, or open **Keys / Manage Keys → Create** to create a separate key for this integration. Give it a recognizable name so you can revoke or rotate it independently.
4. When creating a key, review **Expiration Time**, **Set Usage Limitation**, and **Allowed APIs**. Enable only the restrictions you need, allow the operations you will call, then click **Create** and copy the token from the key list. Task lookup does not grant permission to submit a generation. Confirm the application's balance can cover your first request; any trial allowance is whatever your account currently displays.
5. Copy only the token value, without quotation marks, spaces, or `Bearer `. An API Key / API Token field expects this raw value; only a manually configured HTTP `Authorization` header needs the `Bearer ` prefix. A `platform-...` account-management token cannot replace a generation API key.

![Copy an application API key or open Manage Keys](https://raw.githubusercontent.com/AceDataCloud/SunoDify/8d3d03570e73324220f111f7fe343da0792a8071/_assets/tutorial/get-api-key-en.png)

![Create a separately named key with optional restrictions](https://raw.githubusercontent.com/AceDataCloud/SunoDify/8d3d03570e73324220f111f7fe343da0792a8071/_assets/tutorial/create-api-key-en.png)

Save the key in the client's credential store or the environment variable shown below. Never put it in a prompt, shared workflow, screenshot, or Git commit. If authentication fails, check the full copied value, application/service access, expiration, usage limit, and balance before creating another key.

In n8n, open a node and create a **Suno by Ace Data Cloud API** credential. Paste the raw value into **API Token**, save, and select this credential on every node that needs it, including task readers.

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

Node.js 24 is used in CI. Tests exercise request payloads, task state handling, result mapping, credential configuration, item linking, and failures with a mocked HTTP boundary; they do not incur generation charges. CI also loads the compiled package in the official n8n 2.43.7 image and verifies that workflow execution reaches credential validation without sending a generation request.

Releases run from merged code through [GitHub Actions](.github/workflows/publish.yml) using `npm publish --provenance`. Open a pull request, pass CI, merge, and push a matching version tag, or run the Publish workflow on `main`. Keep the npm version immutable after publication.

## Support

Report integration issues at [AceDataCloud/SunoN8N](https://github.com/AceDataCloud/SunoN8N/issues). Include the package version, n8n version, operation, and a redacted error. Never include API tokens or private generation content.
