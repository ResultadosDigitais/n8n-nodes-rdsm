import type { INodeProperties } from 'n8n-workflow';

const identifierOptions = [
	{
		name: 'Email',
		value: 'email',
	},
	{
		name: 'UUID',
		value: 'uuid',
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
		name: 'Pre-Existent Contract',
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

const contactFieldOptions: INodeProperties[] = [
	{
		displayName: 'Bio',
		name: 'bio',
		type: 'string',
		default: '',
		description: 'Notes about the contact',
	},
	{
		displayName: 'Birthdate',
		name: 'birthdate',
		type: 'dateTime',
		default: '',
		description: 'Contact birthdate. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Facebook',
		name: 'facebook',
		type: 'string',
		default: '',
		placeholder: 'https://www.facebook.com/contact',
	},
	{
		displayName: 'Job Title',
		name: 'jobTitle',
		type: 'string',
		default: '',
		description: 'Contact job title',
	},
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
								name: 'Granted',
								value: 'granted',
							},
							{
								name: 'Declined',
								value: 'declined',
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'LinkedIn',
		name: 'linkedin',
		type: 'string',
		default: '',
		placeholder: 'https://www.linkedin.com/in/contact',
	},
	{
		displayName: 'Mobile Phone',
		name: 'mobilePhone',
		type: 'string',
		default: '',
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
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Tags',
		name: 'tagsUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description: 'Tags for the contact',
		options: [
			{
				displayName: 'Tag',
				name: 'tagValues',
				values: [
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						required: true,
					},
				],
			},
		],
	},
	{
		displayName: 'Twitter',
		name: 'twitter',
		type: 'string',
		default: '',
		placeholder: 'https://twitter.com/contact',
	},
	{
		displayName: 'Website',
		name: 'website',
		type: 'string',
		default: '',
		placeholder: 'https://example.com',
	},
];

export const contactsDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'contact@example.com',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		description: 'Primary email address of the contact',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		options: contactFieldOptions,
	},
	{
		displayName: 'Identifier',
		name: 'identifier',
		type: 'options',
		options: identifierOptions,
		default: 'email',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'update', 'delete', 'addTags'],
			},
		},
		description: 'Identifier used to find the contact',
	},
	{
		displayName: 'Identifier Value',
		name: 'identifierValue',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'update', 'delete', 'addTags'],
			},
		},
		description: 'Email address or UUID value for the selected identifier',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
		description: 'Fields to update. Email is ignored when the identifier is email.',
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'contact@example.com',
				description: 'New primary email address. Ignored when updating by email identifier.',
			},
			...contactFieldOptions,
		],
	},
	{
		displayName: 'Tags',
		name: 'tagsUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['addTags'],
			},
		},
		description: 'Tags to add to the contact',
		options: [
			{
				displayName: 'Tag',
				name: 'tagValues',
				values: [
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						required: true,
					},
				],
			},
		],
	},
	{
		displayName: 'Contact UUID',
		name: 'contactUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getEvents'],
			},
		},
		description: 'UUID of the contact',
	},
	{
		displayName: 'Event Type',
		name: 'eventType',
		type: 'options',
		options: [
			{
				name: 'Conversion',
				value: 'CONVERSION',
			},
			{
				name: 'Opportunity',
				value: 'OPPORTUNITY',
			},
		],
		default: 'CONVERSION',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getEvents'],
			},
		},
		description: 'Type of contact event to retrieve',
	},
	{
		displayName: 'Additional Fields',
		name: 'eventAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getEvents'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Page number to retrieve',
			},
			{
				displayName: 'Sort Direction',
				name: 'sortDirection',
				type: 'options',
				options: [
					{
						name: 'Ascending',
						value: 'asc',
					},
					{
						name: 'Descending',
						value: 'desc',
					},
				],
				default: 'asc',
				description: 'Sort events by creation date',
			},
		],
	},
];
