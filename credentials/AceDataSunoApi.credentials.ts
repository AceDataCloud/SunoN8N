import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AceDataSunoApi implements ICredentialType {
	name = 'aceDataSunoApi';
	displayName = 'Suno by AceDataCloud API';
	documentationUrl = 'https://github.com/AceDataCloud/SunoN8N#credentials';
	icon = 'file:../nodes/Suno/acedatacloud.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The API token for your Suno service on AceDataCloud',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiToken}}' } },
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.acedata.cloud',
			url: '/suno/tasks',
			method: 'POST',
			body: { action: 'retrieve_batch', ids: [] },
		},
	};
}
