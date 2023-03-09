import { IExecuteFunctions } from 'n8n-core';

import {
	IBinaryData,
	IBinaryKeyData,
	IDataObject,
	// IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	// NodeOperationError,
} from 'n8n-workflow';

import { cloudConvertApiRequest, downloadExports } from './GenericFunctions';

export class CloudConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudConvert',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		documentationUrl: 'https://github.com/one-acre-fund/n8n-nodes-cloudconvert',
		name: 'cloudConvert',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:cloudconvert-logo.png',
		group: ['transform'],
		version: 1,
		description: 'A node to execute file conversion jobs on https://cloudconvert.com',
		defaults: {
			name: 'CloudConvert',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cloudConvertCredentialsApi',
				required: true,
			},
		],
		properties: [
			// Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Job',
						value: 'job',
						description: 'Conversion Jobs',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
				],
				default: 'job',
				required: true,
			},

			// Operations
			{
				displayName: 'Create',
				name: 'operation',
				type: 'options',
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				default: 'create',
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create job',
					},
					{
						name: 'Get All',
						value: 'list',
						action: 'Get all jobs',
					},
					{
						name: 'Get One',
						value: 'get',
						action: 'Get job',
					},
				],
			},
			{
				displayName: 'Create',
				name: 'operation',
				type: 'options',
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				default: 'list',
				options: [
					{
						name: 'Get All',
						value: 'list',
						action: 'Get all webhooks',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete webhook',
					},
				],
			},

			{
				displayName:
					'You can use the CloudConvert <a target="_blank" href="https://cloudconvert.com/api/v2/jobs/builder">job builder UI</a> to construct your job definition and paste it below.',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Job Definition (JSON)',
				name: 'definition',
				type: 'string',
				default: '',
				description: 'The full JSON definition of the conversion job',
				typeOptions: {
					rows: 10,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
			},

			{
				displayName: 'ID',
				name: 'jobId',
				type: 'string',
				default: '',
				description: 'Job ID',
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['get'],
					},
				},
			},

			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description: 'Custom tag to add to the job',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
			},

			{
				displayName: 'Synchronous Call?',
				name: 'sync',
				type: 'boolean',
				default: false,
				description: 'Whether to send the request synchronously (waiting for job completion)?',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
			},
			{
				displayName:
					'<strong>WARNING</strong>, synchronous calls are not recommended for heavy jobs, please consider using an asynchronous call using webhooks to be notified of job completions',
				name: 'notice_async',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						sync: [true],
					},
				},
			},

			{
				displayName: 'Download?',
				name: 'download',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-url
				description:
					'Whether to download result files from a sync request and add them as binary attachments?',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
						sync: [true],
					},
				},
			},
			{
				displayName:
					'<strong>NOTE</strong>: only <strong><code>export/url</code></strong> export tasks will be retrieved. The property name of the binary attachment will be the name of the export task in the job definition (e.g. <code>export-1</code>).',
				name: 'notice_async',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						download: [true],
					},
				},
			},

			// Process input binaries?
			{
				displayName: 'Upload Input Binaries?',
				name: 'upload',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-url
				description: 'Whether to upload any binary attachment from input items?',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
			},
			{
				displayName:
					'<strong>NOTE</strong>: If an input item has any binary attachment, it will be imported into CloudConvert by automatically adding a corresponding <strong><code>import/base64</code></strong> task to the job. The task name will be <strong><code>autoimport-propertyName</code></strong> where <strong><code>propertyName</code></strong> is the name of the binary property. Your job may use this task as an input to any conversion or export task by referencing that name.',
				name: 'notice_upload',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						upload: [true],
					},
				},
			},

			{
				displayName: 'Webhook URL',
				name: 'webhook_url',
				type: 'string',
				default: '',
				description:
					'Webhook URL to invoke on job completion (in addition to any account-wide webhooks)',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
						sync: [false],
					},
				},
			},

			// {
			// 	displayName: 'Options',
			// 	name: 'options',
			// 	placeholder: 'Add Option',
			// 	type: 'collection',
			// 	default: {},
			// 	options: [
			// 		{
			// 			displayName: 'Use Sandbox?',
			// 			name: 'sandbox',
			// 			type: 'boolean',
			// 			default: false,
			// 			description:
			// 				'Whether to use the sanbox (requires whitelisting of all input files at https://sandbox.cloudconvert.com/dashboard/api/v2/sandbox)?',
			// 		},
			// 	],
			// },

			{
				displayName: 'List Options',
				name: 'list_options',
				type: 'collection',
				default: {},
				description: 'Options for job list',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Status Filter',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'All',
								value: '',
							},
							{
								name: 'Error',
								value: 'error',
							},
							{
								name: 'Finished',
								value: 'finished',
							},
							{
								name: 'Processing',
								value: 'processing',
							},
						],
						default: '',
					},
					{
						displayName: 'Tag Filter',
						name: 'tag',
						type: 'string',
						default: '',
					},
				],
			},

			// Webhook options
			{
				displayName: 'Webhook ID',
				name: 'webhook_id',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['delete'],
					},
				},
			},
			{
				displayName: 'Webhook URL',
				name: 'webhook_url',
				type: 'string',
				default: '',
				description: 'The result will be filtered to include only webhooks with a specific URL',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['list'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const binaryItems: INodeExecutionData[] = [];

		// tslint:disable-next-line: no-any
		let returnData: any[] = [];
		// tslint:disable-next-line: no-any
		let responseData: any;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			// const options = this.getNodeParameter('options', i, '') as IDataObject;

			if (resource === 'job') {
				// *********************************************************************
				//                             Jobs
				// *********************************************************************

				if (operation === 'list') {
					// ----------------------------------
					//          Job::list
					// ----------------------------------
					const listOptions = this.getNodeParameter('list_options', i) as IDataObject;

					responseData = await cloudConvertApiRequest.call(this, {
						url: `/v2/jobs`,
						qs: {
							...(listOptions.tag && { 'filter[tag]': listOptions.tag }),
							...(listOptions.status && { 'filter[status]': listOptions.status }),
						},
					});

					returnData = returnData.concat(responseData || []);
				}

				if (operation === 'get') {
					// ----------------------------------
					//          Job::get
					// ----------------------------------
					const jobId = this.getNodeParameter('jobId', i, null) as string;

					responseData = await cloudConvertApiRequest.call(this, {
						url: `/v2/jobs/${jobId}`,
					});

					returnData = returnData.concat(responseData);
				}

				if (operation === 'delete') {
					// ----------------------------------
					//          Job::delete
					// ----------------------------------
					const jobId = this.getNodeParameter('jobId', i, null) as string;

					responseData = await cloudConvertApiRequest.call(this, {
						method: 'DELETE',
						url: `/v2/jobs/${jobId}`,
					});

					returnData = returnData.concat([{ success: true }]);
				}

				if (operation === 'create') {
					// ----------------------------------
					//          Job::create
					// ----------------------------------
					const definition = this.getNodeParameter('definition', i, '') as string;
					const tag = this.getNodeParameter('tag', i, '') as string;
					const sync = this.getNodeParameter('sync', i, false) as boolean;
					const download = this.getNodeParameter('download', i, false) as boolean;

					const body = {
						...JSON.parse(definition),
						...(tag ? { tag } : {}),
					};

					// Check if input item has any binary attachment, and import them as base64
					const attachments = items[i].binary as IBinaryKeyData;
					if (attachments) {
						for (const binaryPropertyName of Object.keys(attachments)) {
							const binaryData = attachments[binaryPropertyName] as IBinaryData;
							body.tasks['autoimport-' + binaryPropertyName] = {
								operation: 'import/base64',
								file: binaryData.data,
								filename: binaryData.fileName,
							};
						}
					}

					responseData = await cloudConvertApiRequest.call(this, {
						method: 'POST',
						url: `/v2/jobs`,
						body,
						sync,
						download,
					});

					// download result files for sync requests
					if (sync && download && responseData) {
						const binaryItem: INodeExecutionData = {
							json: responseData,
							binary: {},
						};

						await downloadExports.call(this, responseData, binaryItem);

						binaryItems.push(binaryItem);
					}

					returnData = returnData.concat(responseData);
				}
			}

			if (resource === 'webhook') {
				// *********************************************************************
				//                             Webhooks
				// *********************************************************************

				if (operation === 'list') {
					// ----------------------------------
					//          Webhook::list
					// ----------------------------------
					const url = this.getNodeParameter('webhook_url', i, '') as string;

					responseData = await cloudConvertApiRequest.call(this, {
						url: `/v2/users/me/webhooks`,
						qs: {
							...(url && { 'filter[url]': url }),
						},
					});

					returnData = returnData.concat(responseData || []);
				}

				if (operation === 'delete') {
					// ----------------------------------
					//          Webhook::delete
					// ----------------------------------
					const webhookId = this.getNodeParameter('webhook_id', i, '') as string;

					responseData = await cloudConvertApiRequest.call(this, {
						method: 'delete',
						url: `/v2/webhooks/${webhookId}`,
					});

					returnData = returnData.concat([{ success: true }]);
				}
			}
		}

		return binaryItems.length > 0 ? [binaryItems] : [this.helpers.returnJsonArray(returnData)];
	}
}
