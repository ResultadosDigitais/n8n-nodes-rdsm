import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdMarketingBaseUrl, rdMarketingRequest } from '../Helpers';

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function assertApiIdentifier(value: string, context: IExecuteFunctions, itemIndex: number): string {
	const apiIdentifier = assertNonEmpty(value, 'API Identifier', context, itemIndex);
	if (!/^cf_[a-z0-9_]+$/.test(apiIdentifier)) {
		throw new NodeOperationError(
			context.getNode(),
			"API Identifier must start with 'cf_' and contain only lowercase letters, numbers, and underscores",
			{ itemIndex },
		);
	}

	if (apiIdentifier.length > 64) {
		throw new NodeOperationError(context.getNode(), 'API Identifier must be 64 characters or fewer', { itemIndex });
	}

	return apiIdentifier;
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

function readValidOptions(context: IExecuteFunctions, itemIndex: number): IDataObject[] {
	const validOptionsUi = context.getNodeParameter('validOptionsUi', itemIndex, {}) as IDataObject;
	const values = readFixedCollectionValues({ validOptionsUi }, 'validOptionsUi', 'optionValues');
	const seenValues = new Set<string>();

	return values.map((entry) => {
		const value = assertNonEmpty(String(entry.value ?? ''), 'Valid Option Value', context, itemIndex);
		const label = assertNonEmpty(String(entry.label ?? ''), 'Valid Option Label', context, itemIndex);

		if (seenValues.has(value)) {
			throw new NodeOperationError(context.getNode(), `Valid Option Value must be unique: ${value}`, { itemIndex });
		}
		seenValues.add(value);

		return {
			value,
			label: {
				'pt-BR': label,
			},
		};
	});
}

function buildLocalizedValue(value: string, label: string, context: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		'pt-BR': assertNonEmpty(value, label, context, itemIndex),
	};
}

function buildCustomFieldPayload(
	context: IExecuteFunctions,
	itemIndex: number,
	options: {
		includeApiIdentifier: boolean;
	},
): IDataObject {
	const body: IDataObject = {
		data_type: assertNonEmpty(context.getNodeParameter('dataType', itemIndex) as string, 'Data Type', context, itemIndex),
		name: buildLocalizedValue(context.getNodeParameter('fieldName', itemIndex) as string, 'Name', context, itemIndex),
		label: buildLocalizedValue(context.getNodeParameter('fieldLabel', itemIndex) as string, 'Label', context, itemIndex),
		presentation_type: assertNonEmpty(
			context.getNodeParameter('presentationType', itemIndex) as string,
			'Presentation Type',
			context,
			itemIndex,
		),
	};

	if (options.includeApiIdentifier) {
		body.api_identifier = assertApiIdentifier(
			context.getNodeParameter('apiIdentifier', itemIndex) as string,
			context,
			itemIndex,
		);
	}

	const validOptions = readValidOptions(context, itemIndex);
	if (validOptions.length > 0) {
		body.validation_rules = {
			valid_options: validOptions,
		};
	}

	return body;
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

export async function executeCustomFields(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const baseUrl = await getRdMarketingBaseUrl(context, itemIndex);

	if (operation === 'getAll') {
		const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/contacts/fields', {
			method: 'GET',
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'create') {
		const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/contacts/fields', {
			method: 'POST',
			body: buildCustomFieldPayload(context, itemIndex, {
				includeApiIdentifier: true,
			}),
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'update') {
		const uuid = assertUuid(context.getNodeParameter('fieldUuid', itemIndex) as string, 'Field UUID', context, itemIndex);
		const response = await rdMarketingRequest(context, buildRequest(baseUrl, `/platform/contacts/fields/${encodeURIComponent(uuid)}`, {
			method: 'PATCH',
			body: buildCustomFieldPayload(context, itemIndex, {
				includeApiIdentifier: false,
			}),
		}), itemIndex);

		return toOutput(response);
	}

	if (operation === 'delete') {
		const uuid = assertUuid(context.getNodeParameter('fieldUuid', itemIndex) as string, 'Field UUID', context, itemIndex);
		await rdMarketingRequest(context, buildRequest(baseUrl, `/platform/contacts/fields/${encodeURIComponent(uuid)}`, {
			method: 'DELETE',
		}), itemIndex);

		return {
			success: true,
			uuid,
		};
	}

	throw new NodeOperationError(context.getNode(), `The operation "${operation}" is not supported for Custom Fields`, {
		itemIndex,
	});
}
