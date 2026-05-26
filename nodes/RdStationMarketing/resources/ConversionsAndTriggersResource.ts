import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdMarketingBaseUrl, rdMarketingRequest } from '../Helpers';

type LegalBaseValue = {
	category?: string;
	type?: string;
	status?: string;
};

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasProperty(fields: IDataObject, name: string): boolean {
	return Object.prototype.hasOwnProperty.call(fields, name);
}

function hasString(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
	}
	return normalizedValue;
}

function readFixedCollectionValues(
	fields: IDataObject,
	collectionName: string,
	valuesName: string,
): IDataObject[] {
	const collection = fields[collectionName];
	if (!isObject(collection)) return [];

	const values = collection[valuesName];
	if (!Array.isArray(values)) return [];

	return values.filter(isObject);
}

function readStringArray(fields: IDataObject, collectionName: string, valuesName: string, keyName: string): string[] {
	const values = readFixedCollectionValues(fields, collectionName, valuesName);

	return values
		.map((entry) => String(entry[keyName] ?? '').trim())
		.filter((entry) => entry !== '');
}

function readLegalBases(fields: IDataObject): IDataObject[] {
	return readFixedCollectionValues(fields, 'legalBasesUi', 'legalBaseValues')
		.map((entry: LegalBaseValue) => ({
			category: entry.category ?? 'communications',
			type: entry.type ?? 'consent',
			status: entry.status ?? 'granted',
		}))
		.filter((entry) => hasString(entry.category) && hasString(entry.type) && hasString(entry.status));
}

function readCustomFields(context: IExecuteFunctions, itemIndex: number, fields: IDataObject): IDataObject {
	const customFields: IDataObject = {};
	const values = readFixedCollectionValues(fields, 'customFieldsUi', 'customFieldValues');

	for (const entry of values) {
		const fieldName = assertNonEmpty(
			String(entry.fieldName ?? ''),
			'Custom Field Name',
			context,
			itemIndex,
		);
		const normalizedFieldName = fieldName.startsWith('cf_') ? fieldName : `cf_${fieldName}`;
		customFields[normalizedFieldName] = String(entry.fieldValue ?? '').trim();
	}

	return customFields;
}

function applyStringField(data: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = fields[sourceName];
	if (value === undefined || value === null) return;

	data[targetName] = String(value).trim();
}

function applyBooleanField(data: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	if (!hasProperty(fields, sourceName)) return;

	data[targetName] = Boolean(fields[sourceName]);
}

function buildConversionPayload(
	context: IExecuteFunctions,
	itemIndex: number,
	conversionIdentifier: string,
	email: string,
	fields: IDataObject,
): IDataObject {
	const payload: IDataObject = {
		conversion_identifier: assertNonEmpty(conversionIdentifier, 'Conversion Identifier', context, itemIndex),
		email: assertNonEmpty(email, 'Email', context, itemIndex),
	};

	applyStringField(payload, fields, 'name', 'name');
	applyStringField(payload, fields, 'jobTitle', 'job_title');
	applyStringField(payload, fields, 'state', 'state');
	applyStringField(payload, fields, 'city', 'city');
	applyStringField(payload, fields, 'country', 'country');
	applyStringField(payload, fields, 'personalPhone', 'personal_phone');
	applyStringField(payload, fields, 'mobilePhone', 'mobile_phone');
	applyStringField(payload, fields, 'twitter', 'twitter');
	applyStringField(payload, fields, 'facebook', 'facebook');
	applyStringField(payload, fields, 'linkedin', 'linkedin');
	applyStringField(payload, fields, 'website', 'website');
	applyStringField(payload, fields, 'companyName', 'company_name');
	applyStringField(payload, fields, 'companySite', 'company_site');
	applyStringField(payload, fields, 'companyAddress', 'company_address');
	applyStringField(payload, fields, 'clientTrackingId', 'client_tracking_id');
	applyStringField(payload, fields, 'trafficSource', 'traffic_source');
	applyStringField(payload, fields, 'trafficMedium', 'traffic_medium');
	applyStringField(payload, fields, 'trafficCampaign', 'traffic_campaign');
	applyStringField(payload, fields, 'trafficValue', 'traffic_value');
	applyBooleanField(payload, fields, 'availableForMailing', 'available_for_mailing');

	const tags = readStringArray(fields, 'tagsUi', 'tagValues', 'tag');
	if (tags.length > 0) payload.tags = tags;

	const legalBases = readLegalBases(fields);
	if (legalBases.length > 0) payload.legal_bases = legalBases;

	return {
		...payload,
		...readCustomFields(context, itemIndex, fields),
	};
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

export async function executeConversionsAndTriggers(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdMarketingBaseUrl(context, itemIndex);

	if (operation === 'createConversionEvent') {
		const conversionIdentifier = context.getNodeParameter('conversionIdentifier', itemIndex) as string;
		const email = context.getNodeParameter('email', itemIndex) as string;
		const additionalFields = context.getNodeParameter('conversionAdditionalFields', itemIndex, {}) as IDataObject;

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/events', {
			method: 'POST',
			qs: {
				event_type: 'conversion',
			},
			body: {
				event_type: 'CONVERSION',
				event_family: 'CDP',
				payload: buildConversionPayload(context, itemIndex, conversionIdentifier, email, additionalFields),
			},
		}), itemIndex);

		return toOutput(response);
	}

	throw new NodeOperationError(
		context.getNode(),
		`The operation "${operation}" is not supported for Conversions and Triggers`,
		{ itemIndex },
	);
}
