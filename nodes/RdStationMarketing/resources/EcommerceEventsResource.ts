import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getRdMarketingBaseUrl, rdMarketingRequest } from '../Helpers';

type EcommerceOperation =
	| 'checkoutStarted'
	| 'abandonedCart'
	| 'orderAndPaymentCompleted'
	| 'orderCanceled'
	| 'shippedOrder'
	| 'deliveredOrder';

type LegalBaseValue = {
	category?: string;
	type?: string;
	status?: string;
};

type RequestInput = Omit<IHttpRequestOptions, 'url'>;

const eventTypeByOperation: Record<EcommerceOperation, string> = {
	checkoutStarted: 'ECOMMERCE_CHECKOUT_STARTED',
	abandonedCart: 'ECOMMERCE_CART_ABANDONED',
	orderAndPaymentCompleted: 'ECOMMERCE_ORDER_PAID',
	orderCanceled: 'ECOMMERCE_ORDER_CANCELLED',
	shippedOrder: 'ECOMMERCE_ORDER_FULFILLED',
	deliveredOrder: 'ECOMMERCE_SHIPMENT_DELIVERED',
};

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

function assertIntegerAtLeast(
	value: unknown,
	label: string,
	minimum: number,
	context: IExecuteFunctions,
	itemIndex: number,
): number {
	const normalizedValue = Number(value);
	if (!Number.isInteger(normalizedValue) || normalizedValue < minimum) {
		throw new NodeOperationError(context.getNode(), `${label} must be an integer greater than or equal to ${minimum}`, {
			itemIndex,
		});
	}
	return normalizedValue;
}

function assertHttpUrl(value: string, label: string, context: IExecuteFunctions, itemIndex: number): string {
	const normalizedValue = assertNonEmpty(value, label, context, itemIndex);
	if (!/^https?:\/\/\S+$/i.test(normalizedValue)) {
		throw new NodeOperationError(context.getNode(), `${label} must be an HTTP or HTTPS URL`, { itemIndex });
	}
	return normalizedValue;
}

function applyStringField(data: IDataObject, fields: IDataObject, sourceName: string, targetName: string): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = fields[sourceName];
	if (value === undefined || value === null) return;

	const normalizedValue = String(value).trim();
	if (normalizedValue) {
		data[targetName] = normalizedValue;
	}
}

function applyUrlField(
	data: IDataObject,
	fields: IDataObject,
	sourceName: string,
	targetName: string,
	label: string,
	context: IExecuteFunctions,
	itemIndex: number,
): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = String(fields[sourceName] ?? '').trim();
	if (!value) return;

	data[targetName] = assertHttpUrl(value, label, context, itemIndex);
}

function applyNumberField(
	data: IDataObject,
	fields: IDataObject,
	sourceName: string,
	targetName: string,
	label: string,
	context: IExecuteFunctions,
	itemIndex: number,
): void {
	if (!hasProperty(fields, sourceName)) return;

	const value = fields[sourceName];
	if (value === undefined || value === null || value === '') return;

	data[targetName] = assertNonNegativeNumber(value, label, context, itemIndex);
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

function readLegalBases(fields: IDataObject): IDataObject[] {
	return readFixedCollectionValues(fields, 'legalBasesUi', 'legalBaseValues')
		.map((entry: LegalBaseValue) => ({
			category: entry.category ?? 'communications',
			type: entry.type ?? 'consent',
			status: entry.status ?? 'granted',
		}))
		.filter((entry) => hasString(entry.category) && hasString(entry.type) && hasString(entry.status));
}

function readCommaSeparatedValues(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

function readLineItems(context: IExecuteFunctions, itemIndex: number): IDataObject[] {
	const lineItemsUi = context.getNodeParameter('lineItemsUi', itemIndex, {}) as IDataObject;
	const values = readFixedCollectionValues({ lineItemsUi }, 'lineItemsUi', 'lineItemValues');

	if (values.length > 20) {
		throw new NodeOperationError(context.getNode(), 'Line Items can contain at most 20 items', { itemIndex });
	}

	return values.map((entry, index) => {
		const label = `Line Item ${index + 1}`;
		const item: IDataObject = {
			product_id: assertNonEmpty(String(entry.productId ?? ''), `${label} Product ID`, context, itemIndex),
			product_title: assertNonEmpty(String(entry.productTitle ?? ''), `${label} Product Title`, context, itemIndex),
			price: assertNonNegativeNumber(entry.price, `${label} Price`, context, itemIndex),
			quantity: assertIntegerAtLeast(entry.quantity, `${label} Quantity`, 1, context, itemIndex),
		};

		applyUrlField(item, entry, 'productUrl', 'product_url', `${label} Product URL`, context, itemIndex);
		applyStringField(item, entry, 'variantId', 'variant_id');
		applyStringField(item, entry, 'variantTitle', 'variant_title');
		applyStringField(item, entry, 'sku', 'sku');
		applyUrlField(item, entry, 'imageUrl', 'image_url', `${label} Image URL`, context, itemIndex);

		const categories = readCommaSeparatedValues(entry.categories);
		if (categories.length > 10) {
			throw new NodeOperationError(context.getNode(), `${label} Categories can contain at most 10 items`, { itemIndex });
		}
		if (categories.length > 0) {
			item.categories = categories;
		}

		return item;
	});
}

function readPaymentMethods(orderFields: IDataObject, context: IExecuteFunctions, itemIndex: number): string[] {
	const methods = readFixedCollectionValues(orderFields, 'paymentMethodsUi', 'paymentMethodValues')
		.map((entry) => assertNonEmpty(String(entry.method ?? ''), 'Payment Method', context, itemIndex));

	if (methods.length > 5) {
		throw new NodeOperationError(context.getNode(), 'Payment Methods can contain at most 5 items', { itemIndex });
	}

	return methods;
}

function applyContactFields(payload: IDataObject, context: IExecuteFunctions, itemIndex: number): void {
	const contactFields = context.getNodeParameter('contactAdditionalFields', itemIndex, {}) as IDataObject;

	applyStringField(payload, contactFields, 'name', 'name');
	applyStringField(payload, contactFields, 'mobilePhone', 'mobile_phone');
	applyStringField(payload, contactFields, 'personalPhone', 'personal_phone');

	const legalBases = readLegalBases(contactFields);
	if (legalBases.length > 0) payload.legal_bases = legalBases;
}

function applyCommerceTotalFields(
	payload: IDataObject,
	operation: EcommerceOperation,
	context: IExecuteFunctions,
	itemIndex: number,
): void {
	payload.currency = assertNonEmpty(context.getNodeParameter('currency', itemIndex) as string, 'Currency', context, itemIndex);
	payload.price = assertNonNegativeNumber(context.getNodeParameter('price', itemIndex), 'Price', context, itemIndex);
	payload.total_items = assertIntegerAtLeast(
		context.getNodeParameter('totalItems', itemIndex),
		'Total Items',
		operation === 'orderAndPaymentCompleted' ? 0 : 1,
		context,
		itemIndex,
	);
}

function buildEcommercePayload(
	operation: EcommerceOperation,
	context: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const payload: IDataObject = {
		email: assertNonEmpty(context.getNodeParameter('email', itemIndex) as string, 'Email', context, itemIndex),
		identifier: assertNonEmpty(context.getNodeParameter('identifier', itemIndex) as string, 'Identifier', context, itemIndex),
	};

	applyContactFields(payload, context, itemIndex);

	if (operation === 'checkoutStarted' || operation === 'abandonedCart') {
		payload.checkout_url = assertHttpUrl(
			context.getNodeParameter('checkoutUrl', itemIndex) as string,
			'Checkout URL',
			context,
			itemIndex,
		);
		applyCommerceTotalFields(payload, operation, context, itemIndex);
	}

	if (operation === 'orderAndPaymentCompleted') {
		applyCommerceTotalFields(payload, operation, context, itemIndex);

		const orderFields = context.getNodeParameter('orderAdditionalFields', itemIndex, {}) as IDataObject;
		applyNumberField(payload, orderFields, 'shippingPrice', 'shipping_price', 'Shipping Price', context, itemIndex);
		applyStringField(payload, orderFields, 'shippingCity', 'shipping_city');
		applyStringField(payload, orderFields, 'shippingState', 'shipping_state');
		applyStringField(payload, orderFields, 'shippingCountry', 'shipping_country');
		applyUrlField(payload, orderFields, 'orderUrl', 'order_url', 'Order URL', context, itemIndex);

		const paymentMethods = readPaymentMethods(orderFields, context, itemIndex);
		if (paymentMethods.length > 0) payload.payment_methods = paymentMethods;
	}

	if (operation === 'checkoutStarted' || operation === 'abandonedCart' || operation === 'orderAndPaymentCompleted') {
		const lineItems = readLineItems(context, itemIndex);
		if (lineItems.length > 0) payload.line_items = lineItems;
	}

	if (operation === 'orderCanceled') {
		const cancelFields = context.getNodeParameter('cancelAdditionalFields', itemIndex, {}) as IDataObject;
		applyStringField(payload, cancelFields, 'cancelReason', 'cancel_reason');
	}

	if (operation === 'shippedOrder') {
		const shippingFields = context.getNodeParameter('shippingAdditionalFields', itemIndex, {}) as IDataObject;
		applyStringField(payload, shippingFields, 'orderIdentifier', 'order_identifier');
		applyStringField(payload, shippingFields, 'trackingCompany', 'tracking_company');
		applyStringField(payload, shippingFields, 'trackingCode', 'tracking_code');
		applyUrlField(payload, shippingFields, 'trackingUrl', 'tracking_url', 'Tracking URL', context, itemIndex);
	}

	if (operation === 'deliveredOrder') {
		payload.order_identifier = assertNonEmpty(
			context.getNodeParameter('deliveredOrderIdentifier', itemIndex) as string,
			'Order Identifier',
			context,
			itemIndex,
		);
	}

	return payload;
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

function normalizeOperation(value: string, context: IExecuteFunctions, itemIndex: number): EcommerceOperation {
	if (value in eventTypeByOperation) return value as EcommerceOperation;
	throw new NodeOperationError(context.getNode(), `The operation "${value}" is not supported for E-commerce Events`, {
		itemIndex,
	});
}

export async function executeEcommerceEvents(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const operation = normalizeOperation(context.getNodeParameter('operation', itemIndex) as string, context, itemIndex);
	const baseUrl = await getRdMarketingBaseUrl(context, itemIndex);
	const eventType = eventTypeByOperation[operation];

	const response = await rdMarketingRequest(context, buildRequest(baseUrl, '/platform/events', {
		method: 'POST',
		qs: {
			event_type: eventType,
		},
		body: {
			event_type: eventType,
			event_family: 'CDP',
			payload: buildEcommercePayload(operation, context, itemIndex),
		},
	}), itemIndex);

	return toOutput(response);
}
