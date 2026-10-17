const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Suno } = require('../dist/nodes/Suno/Suno.node.js');

test('the installed node retains its workflow identifier and exposes brand search/help metadata', () => {
	const description = new Suno().description;
	assert.equal(description.name, 'suno');
	assert.deepEqual(description.inputs, ['main']);
	assert.equal(description.usableAsTool, true);
	assert.ok(description.codex.alias.includes('suno'));
	assert.ok(description.codex.resources.credentialDocumentation[0].url.endsWith('#credentials'));
	assert.ok(description.codex.resources.primaryDocumentation[0].url.endsWith('#use-the-node'));
});
