import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CloudConvertCredentialsApi implements ICredentialType {
	name = 'cloudConvertCredentialsApi';
	displayName = 'CloudConvert Credentials API';
	properties: INodeProperties[] = [
		{
			displayName:
				'You can generate your API keys from your <a href="https://cloudconvert.com/dashboard/api/v2/keys" target="_blank">CloudConvert dashboard</a><br/>Depending on what you want to do, you will most likely need at least the <strong><code>task.read</code></strong> and <strong><code>task.write</code></strong> scopes',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'API Key',
			name: 'key',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Sandbox',
			description: 'Whether this API key is for the sandbox environment?',
			name: 'sandbox',
			type: 'boolean',
			default: false,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.key}}',
				'Content-type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: `=https://api.{{$credentials.sandbox ? 'sandbox.' : ''}}cloudconvert.com`,
			url: '/v2/jobs',
		},
	};
}
