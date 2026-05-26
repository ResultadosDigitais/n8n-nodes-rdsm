import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdMarketingBaseUrl, rdMarketingRequest } from '../Helpers';

type ContactIdentifier = 'email' | 'uuid';

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

function assertUuid(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const uuid = String(value ?? '').trim();
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid UUID`, { itemIndex });
	}
	return uuid;
}

function assertNonEmpty(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = String(value ?? '').trim();
	if (!normalizedValue) {
		throw new NodeOperationError(context.getNode(), `${label} is required`, { itemIndex });
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

function formatDateOnly(value: string, context: IExecuteFunctions, itemIndex: number, label: string): string {
	const raw = String(value ?? '').trim();
	if (!raw) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
	if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid date`, { itemIndex });
	}
	return parsed.toISOString().slice(0, 10);
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

function readStringArrayFromCollection(fields: IDataObject, valuesName: string, keyName: string): string[] {
	const values = fields[valuesName];
	if (!Array.isArray(values)) return [];

	return values
		.filter(isObject)
		.map((entry) => String(entry[keyName] ?? '').trim())
		.filter((entry) => entry !== '');
}

function readStringArray(fields: IDataObject, collectionName: string, valuesName: string, keyName: string): string[] {
	const collection = fields[collectionName];
	if (!isObject(collection)) return [];
	return readStringArrayFromCollection(collection, valuesName, keyName);
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

function applyStringField(data: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = fields[sourceName];
	if (value === undefined || value === null) return;

	data[targetName] = String(value).trim();
}

function applyDateField(
	data: IDataObject,
	fields: IDataObject,
	sourceName: string,
	targetName: string,
	context: IExecuteFunctions,
	itemIndex: number,
	label: string,
): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = formatDateOnly(String(fields[sourceName] ?? ''), context, itemIndex, label);
	data[targetName] = value;
}

function buildContactPayload(
	context: IExecuteFunctions,
	itemIndex: number,
	fields: IDataObject,
	options: {
		includeEmail: boolean;
	},
): IDataObject {
	const data: IDataObject = {};

	if (options.includeEmail) applyStringField(data, fields, 'email', 'email');
	applyStringField(data, fields, 'name', 'name');
	applyStringField(data, fields, 'jobTitle', 'job_title');
	applyDateField(data, fields, 'birthdate', 'birthdate', context, itemIndex, 'Birthdate');
	applyStringField(data, fields, 'bio', 'bio');
	applyStringField(data, fields, 'website', 'website');
	applyStringField(data, fields, 'personalPhone', 'personal_phone');
	applyStringField(data, fields, 'mobilePhone', 'mobile_phone');
	applyStringField(data, fields, 'city', 'city');
	applyStringField(data, fields, 'state', 'state');
	applyStringField(data, fields, 'country', 'country');
	applyStringField(data, fields, 'twitter', 'twitter');
	applyStringField(data, fields, 'facebook', 'facebook');
	applyStringField(data, fields, 'linkedin', 'linkedin');

	const tags = readStringArray(fields, 'tagsUi', 'tagValues', 'tag');
	if (tags.length > 0) data.tags = tags;

	const legalBases = readLegalBases(fields);
	if (legalBases.length > 0) data.legal_bases = legalBases;

	return data;
}

function encodeContactIdentifierValue(identifier: ContactIdentifier, value: string): string {
	if (identifier === 'email') {
		return encodeURIComponent(value).replace(/%40/gi, '@').replace(/%2B/gi, '+');
	}

	return encodeURIComponent(value);
}

function buildContactPath(
	context: IExecuteFunctions,
	itemIndex: number,
	identifier: ContactIdentifier,
	value: string,
): string {
	const identifierValue = assertNonEmpty(value, 'Identifier Value', context, itemIndex);
	if (identifier === 'uuid') {
		assertUuid(identifierValue, 'Identifier Value', context, itemIndex);
	}
	return `/platform/contacts/${identifier}:${encodeContactIdentifierValue(identifier, identifierValue)}`;
}

function getContactIdentifier(context: IExecuteFunctions, itemIndex: number): {
	identifier: ContactIdentifier;
	value: string;
	path: string;
} {
	const identifier = normalizeIdentifier(context.getNodeParameter('identifier', itemIndex) as string, context, itemIndex);
	const value = context.getNodeParameter('identifierValue', itemIndex) as string;
	const path = buildContactPath(context, itemIndex, identifier, value);

	return {
		identifier,
		value: assertNonEmpty(value, 'Identifier Value', context, itemIndex),
		path,
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

export async function executeContacts(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdMarketingBaseUrl(context, itemIndex);

	if (operation === 'create') {
		const email = context.getNodeParameter('email', itemIndex) as string;
		const additionalFields = context.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
		const fields: IDataObject = {
			...additionalFields,
			email: assertNonEmpty(email, 'Email', context, itemIndex),
		};
		const body = buildContactPayload(context, itemIndex, fields, {
			includeEmail: true,
		});

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/contacts', {
			method: 'POST',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'get') {
		const contact = getContactIdentifier(context, itemIndex);
		const response = await rdMarketingRequest(context, buildRequest(baseUrl, contact.path, {
			method: 'GET',
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'update') {
		const contact = getContactIdentifier(context, itemIndex);
		const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
		const body = buildContactPayload(context, itemIndex, updateFields, {
			includeEmail: contact.identifier !== 'email',
		});

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(context.getNode(), 'At least one update field must be set', { itemIndex });
		}

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, contact.path, {
			method: 'PATCH',
			body,
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'delete') {
		const contact = getContactIdentifier(context, itemIndex);
		await rdMarketingRequest(context, buildRequest(baseUrl, contact.path, {
			method: 'DELETE',
		}), itemIndex);

		return {
			success: true,
			identifier: contact.identifier,
			value: contact.value,
		};
	}

	if (operation === 'addTags') {
		const contact = getContactIdentifier(context, itemIndex);
		const tagsUi = context.getNodeParameter('tagsUi', itemIndex, {}) as IDataObject;
		const tags = readStringArrayFromCollection(tagsUi, 'tagValues', 'tag');

		if (tags.length === 0) {
			throw new NodeOperationError(context.getNode(), 'At least one tag must be set', { itemIndex });
		}

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, `${contact.path}/tag`, {
			method: 'POST',
			body: {
				tags,
			},
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'getEvents') {
		const uuid = assertUuid(context.getNodeParameter('contactUuid', itemIndex) as string, 'Contact UUID', context, itemIndex);
		const eventType = context.getNodeParameter('eventType', itemIndex) as string;
		const additionalFields = context.getNodeParameter('eventAdditionalFields', itemIndex, {}) as IDataObject;
		const qs: IDataObject = {
			event_type: eventType,
		};

		if (additionalFields.page !== undefined) {
			qs.page = additionalFields.page;
		}

		if (hasString(additionalFields.sortDirection)) {
			qs.order = `created_at:${additionalFields.sortDirection}`;
		}

		const response = await rdMarketingRequest(context, buildRequest(baseUrl, `/platform/contacts/${encodeURIComponent(uuid)}/events`, {
			method: 'GET',
			qs,
		}), itemIndex);

		return toOutput(response);
	}

	throw new NodeOperationError(context.getNode(), `The operation "${operation}" is not supported for Contact`, {
		itemIndex,
	});
}
