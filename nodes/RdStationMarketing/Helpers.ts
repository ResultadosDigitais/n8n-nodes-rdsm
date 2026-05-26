import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	JsonObject,
	JsonValue,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type FullResponse = {
	body?: unknown;
	statusCode?: number;
	statusMessage?: string;
};

type RdMarketingRequestError = {
	description?: unknown;
	message?: string;
	request?: {
		href?: string;
	};
	response?: {
		body?: unknown;
		data?: unknown;
		status?: number;
	};
	statusCode?: number;
};

function toJsonValue(value: unknown): JsonValue {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
	if (Array.isArray(value)) return value.map(toJsonValue);
	if (typeof value === 'object') {
		const normalized: JsonObject = {};
		for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
			normalized[key] = toJsonValue(entry);
		}
		return normalized;
	}
	return String(value);
}

function toApiErrorResponse(error: unknown, options: IHttpRequestOptions): JsonObject {
	const requestError = (error ?? {}) as RdMarketingRequestError;
	const statusCode = requestError.statusCode ?? requestError.response?.status;
	const responseBody = requestError.response?.body ?? requestError.response?.data ?? requestError.description;

	return {
		message: requestError.message ?? 'The service was not able to process your request',
		statusCode: statusCode ?? null,
		requestUrl: requestError.request?.href ?? options.url,
		responseBody: toJsonValue(responseBody),
	};
}

export type RdMarketingEnvironment = 'production' | 'staging';

const MARKETING_BASE_URLS: Record<RdMarketingEnvironment, string> = {
	production: 'https://api.rd.services',
	staging: 'https://api-staging.rd.services',
};

type EnvironmentContext =
	| Pick<IExecuteFunctions, 'getCredentials'>
	| Pick<ILoadOptionsFunctions, 'getCredentials'>
	| Pick<IHookFunctions, 'getCredentials'>
	| Pick<IWebhookFunctions, 'getCredentials'>;

function normalizeEnvironment(value: unknown): RdMarketingEnvironment | undefined {
	const raw = String(value ?? '').trim().toLowerCase();
	if (raw === 'production') return 'production';
	if (raw === 'staging') return 'staging';
	return undefined;
}

function inferEnvironmentFromCredential(
	credentials: ICredentialDataDecryptedObject,
): RdMarketingEnvironment | undefined {
	const authUrl = String(credentials.authUrl ?? '').toLowerCase();
	const tokenUrl = String(credentials.accessTokenUrl ?? '').toLowerCase();
	const merged = `${authUrl} ${tokenUrl}`;
	if (merged.includes('staging')) return 'staging';
	if (merged.includes('api.rd.services') || merged.includes('accounts.rdstation.com')) return 'production';
	return undefined;
}

async function getCredentialsSafely(
	context: EnvironmentContext,
	itemIndex: number,
): Promise<ICredentialDataDecryptedObject | undefined> {
	try {
		return (await context.getCredentials('rdStationMarketingApi', itemIndex)) as ICredentialDataDecryptedObject;
	} catch {
		try {
			return (await context.getCredentials('rdStationMarketingApi')) as ICredentialDataDecryptedObject;
		} catch {
			return undefined;
		}
	}
}

export async function getRdMarketingEnvironment(
	context: EnvironmentContext,
	itemIndex = 0,
): Promise<RdMarketingEnvironment> {
	const credentials = await getCredentialsSafely(context, itemIndex);
	if (credentials) {
		const explicitEnvironment = normalizeEnvironment(credentials.environment);
		if (explicitEnvironment) return explicitEnvironment;

		const inferredEnvironment = inferEnvironmentFromCredential(credentials);
		if (inferredEnvironment) return inferredEnvironment;
	}

	return 'staging';
}

export async function getRdMarketingBaseUrl(
	context: EnvironmentContext,
	itemIndex = 0,
): Promise<string> {
	const environment = await getRdMarketingEnvironment(context, itemIndex);
	return MARKETING_BASE_URLS[environment];
}

export async function rdMarketingRequest<T = IDataObject | IDataObject[]>(
	context: IExecuteFunctions,
	options: IHttpRequestOptions,
	itemIndex: number,
): Promise<T> {
	try {
		const response = (await context.helpers.httpRequestWithAuthentication.call(
			context,
			'rdStationMarketingApi',
			{
				...options,
				json: true,
				returnFullResponse: true,
			},
		)) as FullResponse;

		return (response.body ?? {}) as T;
	} catch (error: unknown) {
		const apiErrorResponse = toApiErrorResponse(error, options);
		throw new NodeApiError(
			context.getNode(),
			apiErrorResponse,
			{
				itemIndex,
				httpCode: apiErrorResponse.statusCode === null ? undefined : String(apiErrorResponse.statusCode),
			},
		);
	}
}

export async function rdMarketingHookRequest<T = IDataObject | IDataObject[]>(
	context: IHookFunctions,
	options: IHttpRequestOptions,
): Promise<T> {
	try {
		const response = (await context.helpers.httpRequestWithAuthentication.call(
			context,
			'rdStationMarketingApi',
			{
				...options,
				json: true,
				returnFullResponse: true,
			},
		)) as FullResponse;

		return (response.body ?? {}) as T;
	} catch (error: unknown) {
		const apiErrorResponse = toApiErrorResponse(error, options);
		throw new NodeApiError(
			context.getNode(),
			apiErrorResponse,
			{
				httpCode: apiErrorResponse.statusCode === null ? undefined : String(apiErrorResponse.statusCode),
			},
		);
	}
}
