import type {
	IDataObject,
	IHookFunctions,
	IHttpRequestOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getRdMarketingBaseUrl, rdMarketingHookRequest } from './Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;
type WebhookEvent = 'WEBHOOK.CONVERTED' | 'WEBHOOK.MARKED_OPPORTUNITY';

const WEBHOOK_EVENTS: WebhookEvent[] = ['WEBHOOK.CONVERTED', 'WEBHOOK.MARKED_OPPORTUNITY'];
const INCLUDE_RELATIONS = ['COMPANY', 'CONTACT_FUNNEL'];

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertWebhookUrl(context: IHookFunctions): string {
	const webhookUrl = context.getNodeWebhookUrl('default');
	if (!webhookUrl) {
		throw new NodeOperationError(context.getNode(), 'The webhook URL could not be resolved');
	}
	return webhookUrl;
}

function getEvent(context: IHookFunctions): WebhookEvent {
	const event = context.getNodeParameter('event') as WebhookEvent;
	if (WEBHOOK_EVENTS.includes(event)) return event;

	throw new NodeOperationError(context.getNode(), `Unsupported webhook event: ${event}`);
}

function readFixedCollectionValues(fields: unknown, valuesName: string): IDataObject[] {
	if (!isObject(fields)) return [];

	const values = fields[valuesName];
	if (!Array.isArray(values)) return [];

	return values.filter(isObject);
}

function unique(values: string[]): string[] {
	return Array.from(new Set(values));
}

function getEventIdentifiers(context: IHookFunctions): string[] {
	const eventIdentifiersUi = context.getNodeParameter('eventIdentifiersUi', {}) as IDataObject;
	const values = readFixedCollectionValues(eventIdentifiersUi, 'eventIdentifierValues');

	return unique(
		values
			.map((entry) => String(entry.eventIdentifier ?? '').trim())
			.filter((entry) => entry !== ''),
	);
}

function getIncludeRelations(context: IHookFunctions): string[] {
	const includeRelations = context.getNodeParameter('includeRelations', []) as string[] | string;
	if (!Array.isArray(includeRelations)) return [];

	return unique(includeRelations.filter((entry) => INCLUDE_RELATIONS.includes(entry)));
}

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((entry) => String(entry ?? '').trim())
		.filter((entry) => entry !== '')
		.sort();
}

function sameStringArray(left: unknown, right: unknown): boolean {
	const normalizedLeft = normalizeStringArray(left);
	const normalizedRight = normalizeStringArray(right);

	if (normalizedLeft.length !== normalizedRight.length) return false;

	return normalizedLeft.every((entry, index) => entry === normalizedRight[index]);
}

function buildWebhookBody(context: IHookFunctions, webhookUrl: string): IDataObject {
	const event = getEvent(context);
	const body: IDataObject = {
		event_type: event,
		entity_type: 'CONTACT',
		url: webhookUrl,
		http_method: 'POST',
	};

	if (event === 'WEBHOOK.CONVERTED') {
		const eventIdentifiers = getEventIdentifiers(context);
		if (eventIdentifiers.length > 0) {
			body.event_identifiers = eventIdentifiers;
		}
	}

	const includeRelations = getIncludeRelations(context);
	if (includeRelations.length > 0) {
		body.include_relations = includeRelations;
	}

	return body;
}

function hasSameUrlAndEvent(subscription: IDataObject, body: IDataObject): boolean {
	return subscription.url === body.url && subscription.event_type === body.event_type;
}

function matchesSubscription(subscription: IDataObject, body: IDataObject): boolean {
	return (
		hasSameUrlAndEvent(subscription, body) &&
		subscription.entity_type === body.entity_type &&
		subscription.http_method === body.http_method &&
		sameStringArray(subscription.event_identifiers, body.event_identifiers) &&
		sameStringArray(subscription.include_relations, body.include_relations)
	);
}

function getStoredWebhookId(staticData: IDataObject): string | undefined {
	const webhookId = staticData.webhookId;
	return typeof webhookId === 'string' && webhookId.trim() !== '' ? webhookId : undefined;
}

function getWebhookUuid(subscription: IDataObject | undefined): string | undefined {
	if (!subscription) return undefined;

	const uuid = subscription.uuid;
	return typeof uuid === 'string' && uuid.trim() !== '' ? uuid : undefined;
}

async function rdMarketingWebhookRequest<T = IDataObject | IDataObject[]>(
	context: IHookFunctions,
	path: string,
	options: RequestInput,
): Promise<T> {
	const baseUrl = await getRdMarketingBaseUrl(context);

	return await rdMarketingHookRequest<T>(context, {
		...options,
		url: `${baseUrl}${path}`,
		headers: {
			accept: 'application/json',
			...(options.body ? { 'content-type': 'application/json' } : {}),
			...(options.headers ?? {}),
		},
	});
}

async function getWebhookSubscription(
	context: IHookFunctions,
	webhookId: string,
): Promise<IDataObject | undefined> {
	const response = await rdMarketingWebhookRequest<IDataObject>(
		context,
		`/integrations/webhooks/${encodeURIComponent(webhookId)}`,
		{
			method: 'GET',
		},
	);

	return isObject(response) ? response : undefined;
}

async function findWebhookSubscription(
	context: IHookFunctions,
	body: IDataObject,
	options: {
		exact: boolean;
	},
): Promise<IDataObject | undefined> {
	const response = await rdMarketingWebhookRequest<{ webhooks?: IDataObject[] }>(
		context,
		'/integrations/webhooks',
		{
			method: 'GET',
		},
	);
	const webhooks = Array.isArray(response.webhooks) ? response.webhooks.filter(isObject) : [];

	return webhooks.find((subscription) =>
		options.exact ? matchesSubscription(subscription, body) : hasSameUrlAndEvent(subscription, body),
	);
}

export class RdStationMarketingTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RD Station Marketing Trigger',
		name: 'rdStationMarketingTrigger',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when RD Station Marketing sends a webhook event',
		icon: 'file:rdstation.svg',
		defaults: {
			name: 'RD Station Marketing Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'rdStationMarketingApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'rd-station-marketing',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				default: 'WEBHOOK.CONVERTED',
				required: true,
				options: [
					{
						name: 'Converted',
						value: 'WEBHOOK.CONVERTED',
						description: 'Triggered when a conversion occurs',
					},
					{
						name: 'Marked Opportunity',
						value: 'WEBHOOK.MARKED_OPPORTUNITY',
						description: 'Triggered when an opportunity is marked',
					},
				],
			},
			{
				displayName: 'Conversion Identifiers',
				name: 'eventIdentifiersUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						event: ['WEBHOOK.CONVERTED'],
					},
				},
				description: 'Only listen for specific conversion identifiers. Leave empty to receive all conversions.',
				options: [
					{
						displayName: 'Conversion Identifier',
						name: 'eventIdentifierValues',
						values: [
							{
								displayName: 'Identifier',
								name: 'eventIdentifier',
								type: 'string',
								default: '',
								required: true,
								placeholder: 'newsletter',
							},
						],
					},
				],
			},
			{
				displayName: 'Include Relations',
				name: 'includeRelations',
				type: 'multiOptions',
				default: [],
				description: 'Additional related data to include in the webhook payload',
				options: [
					{
						name: 'Company',
						value: 'COMPANY',
					},
					{
						name: 'Contact Funnel',
						value: 'CONTACT_FUNNEL',
					},
				],
				},
			],
			usableAsTool: true,
		};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const body = buildWebhookBody(this, assertWebhookUrl(this));
				const storedWebhookId = getStoredWebhookId(staticData);

				if (storedWebhookId) {
					try {
						const subscription = await getWebhookSubscription(this, storedWebhookId);
						if (subscription && matchesSubscription(subscription, body)) return true;
						if (!subscription || !hasSameUrlAndEvent(subscription, body)) {
							delete staticData.webhookId;
						}
					} catch {
						delete staticData.webhookId;
					}
				}

				try {
					const subscription = await findWebhookSubscription(this, body, { exact: true });
					const uuid = getWebhookUuid(subscription);
					if (!uuid) return false;

					staticData.webhookId = uuid;
					return true;
				} catch {
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const body = buildWebhookBody(this, assertWebhookUrl(this));
				const existingSubscription = await findWebhookSubscription(this, body, { exact: false });
				const existingUuid = getWebhookUuid(existingSubscription);
				let subscription: IDataObject;

				if (existingUuid) {
					subscription = await rdMarketingWebhookRequest<IDataObject>(
						this,
						`/integrations/webhooks/${encodeURIComponent(existingUuid)}`,
						{
							method: 'PUT',
							body,
						},
					);
				} else {
					subscription = await rdMarketingWebhookRequest<IDataObject>(this, '/integrations/webhooks', {
						method: 'POST',
						body,
					});
				}

				const webhookId = getWebhookUuid(subscription) ?? existingUuid;
				if (!webhookId) {
					throw new NodeOperationError(this.getNode(), 'RD Station Marketing did not return a webhook UUID');
				}

				staticData.webhookId = webhookId;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const storedWebhookId = getStoredWebhookId(staticData);
				if (!storedWebhookId) return true;

				await rdMarketingWebhookRequest(this, `/integrations/webhooks/${encodeURIComponent(storedWebhookId)}`, {
					method: 'DELETE',
				});

				delete staticData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return {
			workflowData: [this.helpers.returnJsonArray([this.getBodyData()])],
		};
	}
}
