import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {
	failure,
	object,
	output,
	request,
	requiredText,
	submissionResult,
	taskResult,
} from './helpers';
import { properties } from './properties';

export class Suno implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Suno by AceDataCloud',
		name: 'suno',
		icon: { light: 'file:acedatacloud.svg', dark: 'file:acedatacloud.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create music and retrieve generation tasks through AceDataCloud',
		defaults: { name: 'Suno by AceDataCloud' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'aceDataSunoApi', required: true }],
		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const result: INodeExecutionData[] = [];
		for (let index = 0; index < items.length; index++) {
			try {
				const resource = this.getNodeParameter('resource', index) as string;
				const operation = this.getNodeParameter('operation', index) as string;
				const simplify = this.getNodeParameter('simplify', index, true) as boolean;
				if (resource === 'task') {
					let body: IDataObject;
					if (operation === 'get') {
						body = {
							action: 'retrieve',
							id: requiredText(this.getNodeParameter('taskId', index), 'Task ID'),
						};
					} else if (operation === 'getMany') {
						const ids = requiredText(this.getNodeParameter('taskIds', index), 'Task IDs')
							.split(',')
							.map((id) => id.trim())
							.filter(Boolean);
						if (!ids.length || ids.length > 50)
							throw new NodeOperationError(this.getNode(), 'Provide between 1 and 50 task IDs');
						body = { action: 'retrieve_batch', ids };
					} else {
						throw new NodeOperationError(this.getNode(), 'Select a supported task operation');
					}
					const response = await request(this, 'aceDataSunoApi', '/suno/tasks', body);
					const records = operation === 'getMany' ? response.items : [response];
					if (!Array.isArray(records))
						throw new NodeOperationError(
							this.getNode(),
							'The service returned an unexpected task list',
						);
					const valid = records.map((record) => object(record));
					if (valid.some((record) => !record.id && !record.task_id))
						throw new NodeOperationError(
							this.getNode(),
							'The task was not found. Check the task ID and service credential',
						);
					result.push(
						...output(
							this,
							valid.map((record) => (simplify ? taskResult(record) : record)),
							index,
						),
					);
				} else {
					if (operation !== 'create')
						throw new NodeOperationError(this.getNode(), 'Select a supported operation');
					const prompt = requiredText(this.getNodeParameter('prompt', index), 'Prompt');
					const options = object(this.getNodeParameter('options', index, {}));
					if (resource === 'lyrics') {
						const response = await request(this, 'aceDataSunoApi', '/suno/lyrics', {
							prompt,
							model: this.getNodeParameter('lyricsModel', index) as string,
						});
						result.push(
							...output(
								this,
								[
									simplify
										? { taskId: response.task_id ?? null, data: response.data ?? null }
										: response,
								],
								index,
							),
						);
					} else if (resource === 'audio') {
						const custom = this.getNodeParameter('custom', index, false) as boolean;
						const body: IDataObject = {
							action: 'generate',
							model: this.getNodeParameter('model', index) as string,
							async: true,
							custom,
							instrumental: this.getNodeParameter('instrumental', index, false) as boolean,
						};
						if (custom) {
							body.lyric = prompt;
							body.title = requiredText(this.getNodeParameter('title', index), 'Title');
							body.style = requiredText(this.getNodeParameter('style', index), 'Style');
						} else {
							body.prompt = prompt;
						}
						if (typeof options.negativeTags === 'string' && options.negativeTags.trim())
							body.negative_tags = options.negativeTags.trim();
						if (options.vocalGender) body.vocal_gender = options.vocalGender;
						const response = await request(this, 'aceDataSunoApi', '/suno/audios', body);
						const normalized = submissionResult(response);
						result.push(...output(this, [simplify ? normalized : response], index));
					} else {
						throw new NodeOperationError(this.getNode(), 'Select a supported resource');
					}
				}
			} catch (error) {
				result.push(failure(this, error, index));
			}
		}
		return [result];
	}
}
