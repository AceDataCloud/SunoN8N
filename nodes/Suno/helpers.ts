import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { IDataObject, IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';

export function requiredText(value: unknown, name: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
	return value.trim();
}

export function object(value: unknown): IDataObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as IDataObject)
		: {};
}

export function taskResult(record: IDataObject): IDataObject {
	const response = object(record.response);
	const state = String(record.state ?? record.status ?? '').toLowerCase();
	const failed =
		response.success === false ||
		record.success === false ||
		['failed', 'error', 'cancelled', 'canceled'].includes(state);
	const complete =
		!failed &&
		(response.success === true ||
			['succeeded', 'success', 'completed', 'complete'].includes(state));
	return {
		taskId: record.id ?? record.task_id ?? '',
		status: failed ? 'failed' : complete ? 'succeeded' : 'processing',
		finished: failed || complete,
		successful: failed ? false : complete ? true : null,
		data: response.data ?? null,
		error: response.error ?? record.error ?? null,
		traceId: record.trace_id ?? response.trace_id ?? null,
	};
}

export function submissionResult(response: IDataObject): IDataObject {
	if (typeof response.task_id !== 'string' || !response.task_id)
		throw new Error('The service did not return a task ID');
	return {
		taskId: response.task_id,
		status: 'submitted',
		finished: false,
		successful: null,
		traceId: response.trace_id ?? null,
	};
}

export async function request(
	context: IExecuteFunctions,
	credential: string,
	endpoint: string,
	body: IDataObject,
): Promise<IDataObject> {
	let result: unknown;
	try {
		result = await context.helpers.httpRequestWithAuthentication.call(context, credential, {
			method: 'POST',
			url: `https://api.acedata.cloud${endpoint}`,
			body,
			json: true,
			timeout: 60000,
		});
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}
	const data = object(result);
	if (data.success === false || data.error) {
		const error = object(data.error);
		throw new NodeApiError(context.getNode(), {
			message: String(error.message ?? 'The service rejected this request'),
			code: error.code,
		} as JsonObject);
	}
	return data;
}

export function output(
	context: IExecuteFunctions,
	data: IDataObject[],
	index: number,
): INodeExecutionData[] {
	return context.helpers.constructExecutionMetaData(context.helpers.returnJsonArray(data), {
		itemData: { item: index },
	});
}

export function failure(
	context: IExecuteFunctions,
	error: unknown,
	index: number,
): INodeExecutionData {
	const message = error instanceof Error ? error.message : String(error);
	if (context.continueOnFail()) return { json: { error: message }, pairedItem: { item: index } };
	if (error instanceof NodeApiError || error instanceof NodeOperationError) throw error;
	throw new NodeOperationError(context.getNode(), message, { itemIndex: index });
}
