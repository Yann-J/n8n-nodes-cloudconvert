import {
	// IDataObject,
	IHookFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	// LoggerProxy,
} from 'n8n-workflow';

import { cloudConvertApiRequest, downloadExports } from './GenericFunctions';
import * as crypto from 'crypto';

export class CloudConvertTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudConvert Trigger',
		name: 'cloudConvertTrigger',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:cloudconvert-logo.png',
		group: ['trigger'],
		version: 1,
		description: 'Process CloudConvert Job Webhooks',
		defaults: {
			name: 'CloudConvert Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'cloudConvertCredentialsApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'<strong>INFO</strong>: this node requires an API key with the <strong><code>webhook.read</code></strong> and <strong><code>webhook.write</code></strong> scopes!',
				name: 'notice_signature',
				type: 'notice',
				default: '',
				displayOptions: {},
			},

			{
				displayName: 'Events To Subscribe To',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['job.finished', 'job.failed'],
				description: 'List of events to be notified for',
				options: [
					{
						name: 'Job Created',
						value: 'job.created',
					},
					{
						name: 'Job Finished',
						value: 'job.finished',
					},
					{
						name: 'Job Failed',
						value: 'job.failed',
					},
				],
			},

			{
				displayName: 'Download?',
				name: 'download',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-url
				description:
					'Whether to download result files from a sync request and add them as binary attachments?',
				displayOptions: {},
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

			{
				displayName: 'Verify Signature?',
				name: 'verify',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-url
				description: 'Whether to validate the webhook signature',
				displayOptions: {},
			},
		],
	};

	// @ts-ignore
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (/^http(s)?:\/\/localhost.*/.test(webhookUrl)) {
					// console.log('Skipping local webhook registration');
					// ignore localhost webhook registrations, those are tests
					return true;
				}

				const webhooks = await cloudConvertApiRequest.call(this, {
					url: `/v2/users/me/webhooks`,
					qs: {
						'filter[url]': webhookUrl,
					},
				});

				// console.dir(webhooks);

				if (webhooks && webhooks.length) {
					webhookData.webhookId = webhooks[0].id;
					webhookData.webhookSigningSecret = webhooks[0].signing_secret;
					return true;
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events') as string[];

				if (/^http(s)?:\/\/localhost.*/.test(webhookUrl)) {
					// ignore localhost webhook registrations, those are tests
					// console.log('Skipping local webhook registration');
					return true;
				}

				const response = await cloudConvertApiRequest.call(this, {
					method: 'POST',
					url: `/v2/webhooks`,
					body: {
						url: webhookUrl,
						events,
					},
				});

				if (response.id) {
					webhookData.webhookId = response.id;
					webhookData.webhookSigningSecret = response.signing_secret;
					return true;
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId) {
					try {
						await cloudConvertApiRequest.call(this, {
							method: 'DELETE',
							url: `/v2/webhooks/${webhookData.webhookId}`,
						});
					} catch (error) {
						return false;
					}

					delete webhookData.webhookId;
					delete webhookData.webhookSigningSecret;
				}

				return true;
			},
		},
	};

	methods = {};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node');
		const req = this.getRequestObject();
		// console.dir(req, { depth: 10 });
		const download = this.getNodeParameter('download', false) as boolean;
		const verify = this.getNodeParameter('verify', false) as boolean;
		const signKey = webhookData.webhookSigningSecret as string;

		if (verify && signKey) {
			const signature = req.header('CloudConvert-Signature');
			const hmac = crypto.createHmac('sha256', signKey);
			const hash = hmac.update(req.rawBody).digest('hex');

			// console.log('signature', signature);
			// console.log('hash', hash);
			if (signature !== hash) {
				// console.log('Received webhook has invalid signature, skipping');
				return {};
			}
		}

		// console.dir(req.body, { depth: 10 });
		// download result files for sync requests
		const binaryItem: INodeExecutionData = {
			json: req.body,
			binary: {},
		};

		if (download && req.body && req.body.job && 'job.finished' === req.body.event) {
			// console.log('Fetching attachments');
			await downloadExports.call(this, req.body.job, binaryItem);
		}

		return {
			workflowData: [[binaryItem]],
		};
	}
}
