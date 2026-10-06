import type { INodeProperties } from 'n8n-workflow';

export const properties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		default: 'audio',
		noDataExpression: true,
		options: [
			{
				name: 'Audio',
				value: 'audio',
			},
			{
				name: 'Lyric',
				value: 'lyrics',
			},
			{
				name: 'Task',
				value: 'task',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'create',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create audio through AceDataCloud',
				action: 'Create audio',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'create',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lyrics'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create lyrics through AceDataCloud',
				action: 'Create lyrics',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'get',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve the status and result of a task',
				action: 'Get a task',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve up to 50 tasks by ID',
				action: 'Get many tasks',
			},
		],
	},
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['get'],
			},
		},
		description: 'The task ID returned by the Create operation',
	},
	{
		displayName: 'Task IDs',
		name: 'taskIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['getMany'],
			},
		},
		description: 'Comma-separated task IDs, up to 50',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		default: '',
		required: true,
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['audio', 'lyrics'],
			},
		},
		description: 'Describe what to generate. In custom music mode, enter the lyrics.',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'chirp-v5-5',
		options: [
			{
				name: 'chirp-v3-0',
				value: 'chirp-v3-0',
			},
			{
				name: 'chirp-v3-5',
				value: 'chirp-v3-5',
			},
			{
				name: 'chirp-v4',
				value: 'chirp-v4',
			},
			{
				name: 'chirp-v4-5',
				value: 'chirp-v4-5',
			},
			{
				name: 'chirp-v4-5-plus',
				value: 'chirp-v4-5-plus',
			},
			{
				name: 'chirp-v5',
				value: 'chirp-v5',
			},
			{
				name: 'chirp-v5-5',
				value: 'chirp-v5-5',
			},
			{
				name: 'chirp-v6',
				value: 'chirp-v6',
			},
			{
				name: 'chirp-v6-mini',
				value: 'chirp-v6-mini',
			},
			{
				name: 'chirp-v6-wild',
				value: 'chirp-v6-wild',
			},
		],
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		description: 'The model to use. Availability and pricing depend on the selected model.',
	},
	{
		displayName: 'Custom Lyrics',
		name: 'custom',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		description: 'Whether to use the prompt as exact lyrics and specify a title and style',
	},
	{
		displayName: 'Instrumental',
		name: 'instrumental',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		description: 'Whether to generate music without vocals',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['audio'],
				custom: [true],
			},
		},
	},
	{
		displayName: 'Style',
		name: 'style',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['audio'],
				custom: [true],
			},
		},
		description: 'Musical genre, mood, and instruments',
	},
	{
		displayName: 'Lyrics Model',
		name: 'lyricsModel',
		type: 'options',
		default: 'default',
		options: [
			{
				name: 'Default',
				value: 'default',
			},
			{
				name: 'Remi V1',
				value: 'remi-v1',
			},
		],
		displayOptions: {
			show: {
				resource: ['lyrics'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
		options: [
			{
				displayName: 'Negative Tags',
				name: 'negativeTags',
				type: 'string',
				default: '',
				description: 'Styles or elements to avoid',
			},
			{
				displayName: 'Vocal Gender',
				name: 'vocalGender',
				type: 'options',
				default: '',
				options: [
					{
						name: 'Automatic',
						value: '',
					},
					{
						name: 'Female',
						value: 'f',
					},
					{
						name: 'Male',
						value: 'm',
					},
				],
			},
		],
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
];
