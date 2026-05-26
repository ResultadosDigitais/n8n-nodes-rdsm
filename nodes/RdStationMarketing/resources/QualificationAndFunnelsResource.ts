import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdMarketingBaseUrl, rdMarketingRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;
type ContactIdentifier = 'email' | 'uuid';

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasProperty(fields: IDataObject, name: string): boolean {
	return Object.prototype.hasOwnProperty.call(fields, name);
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return normalizedValue;
}

function assertUuid(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const uuid = String(value ?? '').trim();
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(uuid)) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid UUID`, { itemIndex });
	}
	return uuid;
}

function assertNonNegativeNumber(
	value: unknown,
	label: string,
	context: IExecuteFunctions,
	itemIndex: number,
): number {
	const normalizedValue = Number(value);
	if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
		throw new NodeOperationError(context.getNode(), `${label} must be a non-negative number`, { itemIndex });
	}
	return normalizedValue;
}

function normalizeIdentifier(
	value: string,
	context: IExecuteFunctions,
	itemIndex: number,
): ContactIdentifier {
	if (value === 'email' || value === 'uuid') return value;
	throw new NodeOperationError(context.getNode(), `Unsupported identifier: ${value}`, { itemIndex });
}

function encodeContactIdentifierValue(identifier: ContactIdentifier, value: string): string {
	if (identifier === 'email') {
		return encodeURIComponent(value).replace(/%40/gi, '@').replace(/%2B/gi, '+');
	}

	return encodeURIComponent(value);
}

function buildContactFunnelsPath(
	context: IExecuteFunctions,
	itemIndex: number,
	identifier: ContactIdentifier,
	value: string,
): string {
	const identifierValue = assertNonEmpty(value, 'Identifier Value', context, itemIndex);
	if (identifier === 'uuid') {
		assertUuid(identifierValue, 'Identifier Value', context, itemIndex);
	}

	return `/platform/contacts/${identifier}:${encodeContactIdentifierValue(identifier, identifierValue)}/funnels/default`;
}

function getContactFunnelsPath(context: IExecuteFunctions, itemIndex: number): string {
	const identifier = normalizeIdentifier(context.getNodeParameter('identifier', itemIndex) as string, context, itemIndex);
	const value = context.getNodeParameter('identifierValue', itemIndex) as string;
	return buildContactFunnelsPath(context, itemIndex, identifier, value);
}

function toOutput(response: unknown): IDataObject | IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	if (isObject(response)) return response;
	return {
		data: response ?? null,
	};
}

function buildRequest(baseUrl: string, path: string, options: RequestInput): IHttpRequestOptions {
	return {
		...options,
		url: `${baseUrl}${path}`,
		headers: {
			accept: 'application/json',
			...(options.body ? { 'content-type': 'application/json' } : {}),
			...(options.headers ?? {}),
		},
	};
}

export async function executeQualificationAndFunnels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdMarketingBaseUrl(context, itemIndex);

	if (operation === 'markOpportunity' || operation === 'markOpportunityWon' || operation === 'markOpportunityLost') {
		const email = assertNonEmpty(context.getNodeParameter('email', itemIndex) as string, 'Email', context, itemIndex);
		const funnelName = assertNonEmpty(
			context.getNodeParameter('funnelName', itemIndex) as string,
			'Funnel Name',
			context,
			itemIndex,
		);
		const payload: IDataObject = {
			email,
			funnel_name: funnelName,
		};
		const eventConfigByOperation: Record<string, { queryEventType: string; bodyEventType: string }> = {
			markOpportunity: {
				queryEventType: 'opportunity',
				bodyEventType: 'OPPORTUNITY',
			},
			markOpportunityWon: {
				queryEventType: 'sale',
				bodyEventType: 'SALE',
			},
			markOpportunityLost: {
				queryEventType: 'opportunity_lost',
				bodyEventType: 'OPPORTUNITY_LOST',
			},
		};
		const eventConfig = eventConfigByOperation[operation];

		if (operation === 'markOpportunityWon') {
			payload.value = assertNonNegativeNumber(
				context.getNodeParameter('saleValue', itemIndex),
				'Sale Value',
				context,
				itemIndex,
			);
		}

		if (operation === 'markOpportunityLost') {
			payload.reason = assertNonEmpty(
				context.getNodeParameter('lostReason', itemIndex) as string,
				'Lost Reason',
				context,
				itemIndex,
			);
		}

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/events', {
			method: 'POST',
			qs: {
				event_type: eventConfig.queryEventType,
			},
			body: {
				event_type: eventConfig.bodyEventType,
				event_family: 'CDP',
				payload,
			},
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getContactFunnels') {
		const response = await rdMarketingRequest(context, buildRequest(baseUrl, getContactFunnelsPath(context, itemIndex), {
			method: 'GET',
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'updateContactFunnel') {
		const updateFields = context.getNodeParameter('funnelUpdateFields', itemIndex, {}) as IDataObject;
		const body: IDataObject = {};

		if (hasProperty(updateFields, 'lifecycleStage')) {
			body.lifecycle_stage = updateFields.lifecycleStage;
		}

		if (hasProperty(updateFields, 'opportunity')) {
			body.opportunity = updateFields.opportunity;
		}

		if (hasProperty(updateFields, 'clearContactOwner') && updateFields.clearContactOwner === true) {
			body.contact_owner_email = 'null';
		} else if (hasProperty(updateFields, 'contactOwnerEmail')) {
			const contactOwnerEmail = String(updateFields.contactOwnerEmail ?? '').trim();
			if (contactOwnerEmail) {
				body.contact_owner_email = contactOwnerEmail;
			}
		}

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(context.getNode(), 'At least one update field must be set', { itemIndex });
		}

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, getContactFunnelsPath(context, itemIndex), {
			method: 'PUT',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	throw new NodeOperationError(
		context.getNode(),
		`The operation "${operation}" is not supported for Qualification and Funnels`,
		{ itemIndex },
	);
}
