import type { INodeProperties } from 'n8n-workflow';

const ecommerceEventOperations = [
	'checkoutStarted',
	'abandonedCart',
	'orderAndPaymentCompleted',
	'orderCanceled',
	'shippedOrder',
	'deliveredOrder',
];

const commerceTotalOperations = [
	'checkoutStarted',
	'abandonedCart',
	'orderAndPaymentCompleted',
];

const productLineItemOperations = [
	'checkoutStarted',
	'abandonedCart',
	'orderAndPaymentCompleted',
];

const currencyOptions = [
	{
		name: 'ARS',
		value: 'ARS',
	},
	{
		name: 'BRL',
		value: 'BRL',
	},
	{
		name: 'CAD',
		value: 'CAD',
	},
	{
		name: 'CLP',
		value: 'CLP',
	},
	{
		name: 'COP',
		value: 'COP',
	},
	{
		name: 'EUR',
		value: 'EUR',
	},
	{
		name: 'MXN',
		value: 'MXN',
	},
	{
		name: 'PEN',
		value: 'PEN',
	},
	{
		name: 'USD',
		value: 'USD',
	},
	{
		name: 'UYU',
		value: 'UYU',
	},
];

const legalBaseTypeOptions = [
	{
		name: 'Consent',
		value: 'consent',
	},
	{
		name: 'Judicial Process',
		value: 'judicial_process',
	},
	{
		name: 'Legitimate Interest',
		value: 'legitimate_interest',
	},
	{
		name: 'Pre-Existing Contract',
		value: 'pre_existent_contract',
	},
	{
		name: 'Public Interest',
		value: 'public_interest',
	},
	{
		name: 'Vital Interest',
		value: 'vital_interest',
	},
];

const contactAdditionalFieldOptions: INodeProperties[] = [
	{
		displayName: 'Legal Bases',
		name: 'legalBasesUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description: 'Legal bases for the contact',
		options: [
			{
				displayName: 'Legal Base',
				name: 'legalBaseValues',
				values: [
					{
						displayName: 'Category',
						name: 'category',
						type: 'options',
						default: 'communications',
						options: [
							{
								name: 'Communications',
								value: 'communications',
							},
						],
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 'consent',
						options: legalBaseTypeOptions,
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'granted',
						options: [
							{
								name: 'Declined',
								value: 'declined',
							},
							{
								name: 'Granted',
								value: 'granted',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Mobile Phone',
		name: 'mobilePhone',
		type: 'string',
		default: '',
		description: 'Contact mobile phone',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Contact name',
	},
	{
		displayName: 'Personal Phone',
		name: 'personalPhone',
		type: 'string',
		default: '',
		description: 'Contact landline phone',
	},
];

const lineItemValues: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		description: 'Product ID. Maximum 150 characters.',
	},
	{
		displayName: 'Product Title',
		name: 'productTitle',
		type: 'string',
		default: '',
		required: true,
		description: 'Product title. Maximum 255 characters.',
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			minValue: 0,
		},
		description: 'Product price',
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		default: 1,
		required: true,
		typeOptions: {
			minValue: 1,
			numberStepSize: 1,
		},
		description: 'Product quantity',
	},
	{
		displayName: 'Categories',
		name: 'categories',
		type: 'string',
		default: '',
		description: 'Comma-separated product categories. Maximum 10 categories.',
	},
	{
		displayName: 'Image URL',
		name: 'imageUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/product.jpg',
		description: 'Product image URL',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/product',
	},
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		default: '',
		description: 'Product SKU',
	},
	{
		displayName: 'Variant ID',
		name: 'variantId',
		type: 'string',
		default: '',
		description: 'Product variant ID',
	},
	{
		displayName: 'Variant Title',
		name: 'variantTitle',
		type: 'string',
		default: '',
		description: 'Product variant title',
	},
];

export const ecommerceEventsDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'contact@example.com',
		required: true,
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ecommerceEventOperations,
			},
		},
		description: 'Email address of the contact',
	},
	{
		displayName: 'Identifier',
		name: 'identifier',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ecommerceEventOperations,
			},
		},
		description: 'Checkout, cart, order, or shipment identifier for this event',
	},
	{
		displayName: 'Contact Additional Fields',
		name: 'contactAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ecommerceEventOperations,
			},
		},
		options: contactAdditionalFieldOptions,
	},
	{
		displayName: 'Checkout URL',
		name: 'checkoutUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/checkout',
		required: true,
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ['checkoutStarted', 'abandonedCart'],
			},
		},
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		default: 'BRL',
		required: true,
		options: currencyOptions,
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: commerceTotalOperations,
			},
		},
		description: 'Currency used for the event price',
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: commerceTotalOperations,
			},
		},
		description: 'Total price for the checkout, cart, or order',
	},
	{
		displayName: 'Total Items',
		name: 'totalItems',
		type: 'number',
		default: 1,
		required: true,
		typeOptions: {
			minValue: 0,
			numberStepSize: 1,
		},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: commerceTotalOperations,
			},
		},
		description: 'Total number of items',
	},
	{
		displayName: 'Line Items',
		name: 'lineItemsUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: productLineItemOperations,
			},
		},
		description: 'Product line items. Maximum 20 items.',
		options: [
			{
				displayName: 'Line Item',
				name: 'lineItemValues',
				values: lineItemValues,
			},
		],
	},
	{
		displayName: 'Order Additional Fields',
		name: 'orderAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ['orderAndPaymentCompleted'],
			},
		},
		options: [
			{
				displayName: 'Order URL',
				name: 'orderUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/orders/123',
			},
			{
				displayName: 'Payment Methods',
				name: 'paymentMethodsUi',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				description: 'Payment methods used for the order. Maximum 5 items.',
				options: [
					{
						displayName: 'Payment Method',
						name: 'paymentMethodValues',
						values: [
							{
								displayName: 'Method',
								name: 'method',
								type: 'string',
								default: '',
								required: true,
							},
						],
					},
				],
			},
			{
				displayName: 'Shipping City',
				name: 'shippingCity',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Shipping Country',
				name: 'shippingCountry',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Shipping Price',
				name: 'shippingPrice',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Shipping State',
				name: 'shippingState',
				type: 'string',
				default: '',
			},
		],
	},
	{
		displayName: 'Cancel Additional Fields',
		name: 'cancelAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ['orderCanceled'],
			},
		},
		options: [
			{
				displayName: 'Cancel Reason',
				name: 'cancelReason',
				type: 'options',
				default: 'other',
				options: [
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Declined',
						value: 'declined',
					},
					{
						name: 'Fraud',
						value: 'fraud',
					},
					{
						name: 'Inventory',
						value: 'inventory',
					},
					{
						name: 'Other',
						value: 'other',
					},
				],
				description: 'Reason why the order was canceled',
			},
		],
	},
	{
		displayName: 'Shipping Additional Fields',
		name: 'shippingAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ['shippedOrder'],
			},
		},
		options: [
			{
				displayName: 'Order Identifier',
				name: 'orderIdentifier',
				type: 'string',
				default: '',
				description: 'Identifier of the related order',
			},
			{
				displayName: 'Tracking Code',
				name: 'trackingCode',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tracking Company',
				name: 'trackingCompany',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tracking URL',
				name: 'trackingUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/tracking/123',
			},
		],
	},
	{
		displayName: 'Order Identifier',
		name: 'deliveredOrderIdentifier',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['ecommerceEvents'],
				operation: ['deliveredOrder'],
			},
		},
		description: 'Identifier of the related order',
	},
];
