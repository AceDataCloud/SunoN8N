import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const source = JSON.parse(await readFile('package.json', 'utf8'));
const version = process.env.PACKAGE_VERSION || source.version;
assert.match(version, /^\d+\.\d+\.\d+$/);
const directory = 'artifacts/published';
await mkdir(directory, { recursive: true });
async function get(url) {
	const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
	assert.ok(response.ok, `GET ${url}: HTTP ${response.status}`);
	return response;
}
const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(source.name)}/${version}`;
const metadata = await (await get(registryUrl)).json();
assert.equal(metadata.name, source.name);
assert.equal(metadata.version, version);
assert.equal(new URL(metadata.dist.tarball).origin, 'https://registry.npmjs.org');
assert.equal(typeof metadata.gitHead, 'string');
if (process.env.VERSION_SOURCE_SHA) assert.equal(metadata.gitHead, process.env.VERSION_SOURCE_SHA);
assert.ok(metadata.dist.attestations?.url, 'npm provenance attestation is missing');
const archive = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer());
const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
assert.equal(integrity, metadata.dist.integrity);
assert.equal(createHash('sha1').update(archive).digest('hex'), metadata.dist.shasum);
const file = `${directory}/package.tgz`;
await writeFile(file, archive);
const files = execFileSync('tar', ['-tzf', file], { encoding: 'utf8' }).trim().split('\n');
assert.ok(files.every((path) => path.startsWith('package/') && !path.split('/').includes('..')));
const read = (path) => execFileSync('tar', ['-xOf', file, `package/${path}`], { encoding: 'utf8' });
const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.name, source.name);
assert.equal(manifest.version, version);
assert.equal(manifest.license, 'MIT');
assert.deepEqual(Object.keys(manifest.dependencies || {}), []);
for (const path of [...manifest.n8n.nodes, ...manifest.n8n.credentials]) {
	assert.ok(files.includes(`package/${path}`), `Missing published entrypoint ${path}`);
}
const discovery = manifest.n8n.nodes.map((path) => {
	const codex = JSON.parse(read(path.replace(/\.js$/, '.json')));
	assert.ok(codex.alias?.length, 'Published service search aliases are missing');
	assert.ok(codex.resources.primaryDocumentation.length);
	assert.ok(codex.resources.credentialDocumentation.length);
	assert.ok(read(path).includes('by Ace Data Cloud'));
	return { node: codex.node, aliases: codex.alias, resources: codex.resources };
});
const readme = read('README.md');
for (const text of [
	'Initialize General Application',
	'Manage Keys',
	'Allowed APIs',
	'utm_source=opensource',
	'utm_medium=referral',
	'utm_campaign=evergreen',
	'utm_content=',
])
	assert.ok(readme.includes(text), `Missing onboarding ${text}`);
await writeFile(`${directory}/README.md`, readme);
const receipt = {
	checkedAt: new Date().toISOString(),
	name: source.name,
	version,
	registryUrl,
	latest: (
		await (await get(`https://registry.npmjs.org/${encodeURIComponent(source.name)}/latest`)).json()
	).version,
	tarballUrl: metadata.dist.tarball,
	npmIntegrity: metadata.dist.integrity,
	actualIntegrity: integrity,
	sha256: createHash('sha256').update(archive).digest('hex'),
	shasum: metadata.dist.shasum,
	gitHead: metadata.gitHead,
	provenanceUrl: metadata.dist.attestations.url,
	n8n: manifest.n8n,
	discovery,
	keyOnboarding: true,
	utm: true,
	limits:
		'Published npm artifact verification, not n8n official catalog approval or an authorized API response',
};
await writeFile(`${directory}/receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(
	`PASS: ${source.name}@${version} registry bytes, provenance pointer, aliases, help and Key/UTM`,
);
