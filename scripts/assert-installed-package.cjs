const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join('/home/node/.n8n/nodes/node_modules', process.env.PACKAGE_NAME);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(manifest.name, process.env.PACKAGE_NAME);
assert.equal(manifest.version, process.env.PACKAGE_VERSION);
assert.deepEqual(Object.keys(manifest.dependencies || {}), []);
const nodes = manifest.n8n.nodes.map((file) => {
	const exports = require(path.join(root, file));
	const Constructor = Object.values(exports).find((value) => typeof value === 'function');
	assert.ok(Constructor, `No node constructor in ${file}`);
	const node = new Constructor();
	const metadata = JSON.parse(
		fs.readFileSync(path.join(root, file.replace(/\.js$/, '.json')), 'utf8'),
	);
	assert.ok(metadata.resources.primaryDocumentation.length);
	assert.ok(metadata.resources.credentialDocumentation.length);
	for (const icon of Object.values(node.description.icon)) {
		assert.equal(icon.startsWith('file:'), true);
		assert.equal(fs.existsSync(path.join(root, path.dirname(file), icon.slice(5))), true);
	}
	assert.deepEqual(node.description.inputs, ['main']);
	assert.deepEqual(node.description.outputs, ['main']);
	assert.equal(node.description.usableAsTool, true);
	assert.ok(node.description.codex.alias.length);
	assert.deepEqual(metadata.alias, node.description.codex.alias);
	return {
		name: node.description.name,
		displayName: node.description.displayName,
		aliases: node.description.codex?.alias || [],
		inputs: node.description.inputs,
		outputs: node.description.outputs,
	};
});
for (const file of manifest.n8n.credentials) {
	const Constructor = Object.values(require(path.join(root, file))).find(
		(value) => typeof value === 'function',
	);
	const credential = new Constructor();
	const token = credential.properties.find((property) => property.name === 'apiToken');
	assert.equal(token.typeOptions.password, true);
	assert.equal(token.default, '');
	assert.match(credential.authenticate.properties.headers.Authorization, /Bearer/);
	assert.equal(credential.test.request.method, 'POST');
	assert.deepEqual(credential.test.request.body, { action: 'retrieve_batch', ids: [] });
	assert.ok(credential.properties.find((property) => property.name === 'keySetup'));
}
console.log(
	'PACKED_NODE_METADATA ' +
		JSON.stringify({
			package: manifest.name,
			version: manifest.version,
			nodes,
			credentialsEmbedded: false,
			serviceRequests: 0,
		}),
);
