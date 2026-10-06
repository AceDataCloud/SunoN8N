const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Suno } = require('../dist/nodes/Suno/Suno.node.js');
const { taskResult } = require('../dist/nodes/Suno/helpers.js');
const { AceDataSunoApi } = require('../dist/credentials/AceDataSunoApi.credentials.js');

function context(parameters, responses, { count = 1, continueOnFail = false } = {}) {
	const calls = [];
	let next = 0;
	return {
		calls,
		getInputData: () => Array.from({ length: count }, () => ({ json: {} })),
		getNode: () => ({
			name: 'Test Suno',
			type: '@acedatacloud/n8n-nodes-suno.suno',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		}),
		getNodeParameter: (name, index, fallback) => {
			const p = Array.isArray(parameters) ? parameters[index] : parameters;
			return name in p ? p[name] : fallback;
		},
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequestWithAuthentication: async (credential, request) => {
				calls.push({ credential, ...request });
				const response = responses[next++];
				if (response instanceof Error) throw response;
				return response;
			},
			returnJsonArray: (data) => data.map((json) => ({ json })),
			constructExecutionMetaData: (data, meta) =>
				data.map((item) => ({ ...item, pairedItem: meta.itemData })),
		},
	};
}

const create = {
	resource: 'audio',
	operation: 'create',
	prompt: 'A quiet morning by the sea',
	model: 'chirp-v5-5',
	simplify: true,
};

test('create submits once asynchronously and preserves the selected model', async () => {
	const ctx = context(create, [{ success: true, task_id: 'task-1', trace_id: 'trace-1' }]);
	const [items] = await new Suno().execute.call(ctx);
	assert.equal(ctx.calls.length, 1);
	assert.equal(ctx.calls[0].body.async, true);
	assert.equal(ctx.calls[0].body.model, create.model);
	assert.equal(ctx.calls[0].url, 'https://api.acedata.cloud/suno/audios');
	assert.equal(ctx.calls[0].credential, 'aceDataSunoApi');
	assert.deepEqual(items[0].json, {
		taskId: 'task-1',
		status: 'submitted',
		finished: false,
		successful: null,
		traceId: 'trace-1',
	});
	assert.deepEqual(items[0].pairedItem, { item: 0 });
});

test('query preserves pending, success and terminal failure independently', async () => {
	for (const [response, status, finished, successful] of [
		[{ id: 'task-1', response: null }, 'processing', false, null],
		[
			{
				id: 'task-1',
				response: { success: true, data: [{ audio_url: 'https://example.com/music.mp3' }] },
			},
			'succeeded',
			true,
			true,
		],
		[
			{
				id: 'task-1',
				response: { success: false, error: { code: 'content_moderation', message: 'Rejected' } },
			},
			'failed',
			true,
			false,
		],
	]) {
		const ctx = context({ resource: 'task', operation: 'get', taskId: 'task-1', simplify: true }, [
			response,
		]);
		const [items] = await new Suno().execute.call(ctx);
		assert.equal(ctx.calls.length, 1);
		assert.deepEqual(ctx.calls[0].body, { action: 'retrieve', id: 'task-1' });
		assert.equal(items[0].json.status, status);
		assert.equal(items[0].json.finished, finished);
		assert.equal(items[0].json.successful, successful);
		if (successful)
			assert.deepEqual(items[0].json.data, [{ audio_url: 'https://example.com/music.mp3' }]);
	}
});

test('top-level success alone is not proof that a task completed', () => {
	assert.equal(taskResult({ id: 'task-1', success: true }).finished, false);
	assert.equal(
		taskResult({ id: 'task-1', state: 'succeeded', response: { success: false } }).status,
		'failed',
	);
});

test('batch query returns paired items and handles an empty result', async () => {
	const ctx = context(
		{ resource: 'task', operation: 'getMany', taskIds: 'one, two', simplify: true },
		[
			{
				items: [
					{ id: 'one' },
					{
						id: 'two',
						response: { success: true, data: [{ audio_url: 'https://example.com/music.mp3' }] },
					},
				],
				count: 2,
			},
		],
	);
	const [items] = await new Suno().execute.call(ctx);
	assert.deepEqual(ctx.calls[0].body, { action: 'retrieve_batch', ids: ['one', 'two'] });
	assert.equal(items.length, 2);
	assert.deepEqual(items[1].pairedItem, { item: 0 });
	const empty = context({ resource: 'task', operation: 'getMany', taskIds: 'missing' }, [
		{ items: [], count: 0 },
	]);
	assert.deepEqual(await new Suno().execute.call(empty), [[]]);
});

test('missing task and malformed submission fail clearly', async () => {
	await assert.rejects(
		new Suno().execute.call(
			context({ resource: 'task', operation: 'get', taskId: 'missing' }, [{}]),
		),
		/not found/i,
	);
	await assert.rejects(new Suno().execute.call(context(create, [{ success: true }])), /task ID/i);
});

test('inputs stay linked and continue-on-fail does not retry a paid submission', async () => {
	const ctx = context([create, create], [new Error('429 Too Many Requests'), { task_id: 'two' }], {
		count: 2,
		continueOnFail: true,
	});
	const [items] = await new Suno().execute.call(ctx);
	assert.equal(ctx.calls.length, 2);
	assert.match(items[0].json.error, /429/);
	assert.equal(items[1].json.taskId, 'two');
	assert.deepEqual(items[1].pairedItem, { item: 1 });
});

test('missing required input fails before calling the API', async () => {
	const ctx = context({ ...create, prompt: ' ' }, []);
	await assert.rejects(new Suno().execute.call(ctx), /Prompt is required/);
	assert.equal(ctx.calls.length, 0);
});

test('raw output preserves the service response', async () => {
	const response = {
		id: 'task-1',
		response: { success: true, data: [{ audio_url: 'https://example.com/music.mp3' }] },
		elapsed: 9,
	};
	const ctx = context({ resource: 'task', operation: 'get', taskId: 'task-1', simplify: false }, [
		response,
	]);
	assert.deepEqual((await new Suno().execute.call(ctx))[0][0].json, response);
});

test('credential uses password storage, Bearer auth and a query-only test', () => {
	const credential = new AceDataSunoApi();
	assert.equal(credential.properties[0].typeOptions.password, true);
	assert.match(credential.authenticate.properties.headers.Authorization, /Bearer/);
	assert.equal(credential.test.request.url, '/suno/tasks');
	assert.deepEqual(credential.test.request.body, { action: 'retrieve_batch', ids: [] });
});
test('custom lyrics are sent as lyric with title and style', async () => {
	const ctx = context(
		{
			...create,
			custom: true,
			prompt: '[Verse] Hello world',
			title: 'Hello',
			style: 'Pop',
			instrumental: false,
		},
		[{ task_id: 'custom' }],
	);
	await new Suno().execute.call(ctx);
	assert.equal(ctx.calls[0].body.lyric, '[Verse] Hello world');
	assert.equal(ctx.calls[0].body.title, 'Hello');
	assert.equal(ctx.calls[0].body.style, 'Pop');
	assert.equal('prompt' in ctx.calls[0].body, false);
});

test('lyrics use their own model and endpoint', async () => {
	const data = [{ text: 'Hello', title: 'Hello' }];
	const ctx = context(
		{ resource: 'lyrics', operation: 'create', prompt: 'Winter', lyricsModel: 'default' },
		[{ task_id: 'lyrics-1', data }],
	);
	const [items] = await new Suno().execute.call(ctx);
	assert.equal(ctx.calls[0].url, 'https://api.acedata.cloud/suno/lyrics');
	assert.deepEqual(ctx.calls[0].body, { prompt: 'Winter', model: 'default' });
	assert.deepEqual(items[0].json.data, data);
});

test('the example polling loop cannot reach Create again', () => {
	const workflow = require('../examples/generate-and-wait.json');
	const queue = ['Get Task'];
	const visited = new Set();
	while (queue.length) {
		const name = queue.shift();
		if (visited.has(name)) continue;
		visited.add(name);
		for (const branch of workflow.connections[name]?.main ?? [])
			for (const edge of branch) queue.push(edge.node);
	}
	assert.equal(visited.has('Create'), false);
	assert.equal(visited.has('Wait 15 Seconds'), true);
	assert.equal(visited.has('Stop Waiting'), true);
	assert.equal(visited.has('Generation Failed'), true);
	assert.equal(workflow.nodes.find((node) => node.name === 'Create').retryOnFail, false);
	assert.equal(JSON.stringify(workflow).includes('apiToken'), false);
});
