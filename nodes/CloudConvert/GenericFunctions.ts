import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-core';

import {
	IDataObject,
	IHookFunctions,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

export async function cloudConvertApiRequest(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	option: IDataObject = {},
	// tslint:disable:no-any
): Promise<any> {
	const credentials = (await this.getCredentials('cloudConvertCredentialsApi')) as IDataObject;
	const baseDomain = credentials.sandbox ? 'sandbox.cloudconvert.com' : 'cloudconvert.com';
	const baseURL = option.sync ? `https://sync.api.${baseDomain}` : `https://api.${baseDomain}`;

	const options: IHttpRequestOptions = {
		baseURL,
		url: '',
		headers: {
			Authorization: 'Bearer ' + credentials.key,
		},
		json: true,
	};

	if (Object.keys(option)) {
		Object.assign(options, option);
	}

	// console.dir(options, { depth: 10 });
	try {
		const response = await this.helpers.httpRequest(options);
		// console.dir(response, { depth: 10 });
		return response;
	} catch (error) {
		// console.dir(response, { depth: 10 });
		if (error.response?.data?.message) {
			error.message += ` - ${error.response.data.code}: ${error.response.data.message}`;
		}
		// console.dir(error);
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
