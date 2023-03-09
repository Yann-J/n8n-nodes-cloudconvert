import { JSONPath } from 'jsonpath-plus';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-core';

import {
	IDataObject,
	IHookFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
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
		// Support pagination
		let response = null;
		let keepLooking = true;
		while (keepLooking) {
			const batch = await this.helpers.httpRequest(options);
			// console.dir(batch, { depth: 10 });
			// Append or set results
			response = response && response.length ? response.concat(batch.data) : batch.data || batch;
			if (batch.links && batch.links.next) {
				options.url = batch.links.next;
			} else {
				keepLooking = false;
			}
		}

		// console.dir(response, { depth: 10 });
		return response;
	} catch (error) {
		if (error.response?.data?.message) {
			error.message += ` - ${error.response.data.code}: ${error.response.data.message}`;
		}
		// console.dir(error, { depth: 10 });

		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function downloadExports(
	this: IExecuteFunctions | IWebhookFunctions,
	job: any,
	binaryItem: INodeExecutionData,
): Promise<INodeExecutionData> {
	const exportTasks = JSONPath({
		path: '$.tasks[?(@.operation==="export/url")]',
		json: job,
	});
	// console.dir(exportTasks, { depth: 10 });

	for (const exportTask of exportTasks) {
		for (const outputFile of JSONPath({
			path: '$.result.files[*]',
			json: exportTask,
		})) {
			let index = 0;
			// console.log(`Downloading result file from ${outputFile.url}`);

			const fileContent = await this.helpers.httpRequest({
				url: outputFile.url,
				encoding: 'arraybuffer',
			});

			// console.dir(fileContent);

			binaryItem.binary![`${exportTask.name}_${index++}`] = await this.helpers.prepareBinaryData(
				fileContent,
				outputFile.filename,
			);
		}
	}

	return binaryItem;
}
