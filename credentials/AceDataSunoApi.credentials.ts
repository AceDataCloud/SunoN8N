import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AceDataSunoApi implements ICredentialType {
	name = 'aceDataSunoApi';
	displayName = 'Suno by Ace Data Cloud API';
	documentationUrl = 'https://github.com/AceDataCloud/SunoN8N#credentials';
	icon = 'file:../nodes/Suno/icon.png' as const;
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
		{
			displayName:
				'Create or copy an application API key in <a href="https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=sunon8n_credential_api_key" target="_blank">Ace Data Cloud Applications</a>. Paste only the token into API Token; do not add Bearer.',
			name: 'keySetup',
			type: 'notice',
			default: '',
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
