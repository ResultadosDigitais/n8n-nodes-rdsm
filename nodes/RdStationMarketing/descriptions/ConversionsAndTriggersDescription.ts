import type { INodeProperties } from 'n8n-workflow';

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

const conversionFieldOptions: INodeProperties[] = [
	{
		displayName: 'Available for Mailing',
		name: 'availableForMailing',
		type: 'boolean',
		default: true,
		description: 'Whether the contact can receive emails',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Client Tracking ID',
		name: 'clientTrackingId',
		type: 'string',
		default: '',
		description: "Value from the '_rdtrk' cookie",
	},
	{
		displayName: 'Company Address',
		name: 'companyAddress',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Company Site',
		name: 'companySite',
		type: 'string',
		default: '',
		placeholder: 'https://example.com',
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Custom Fields',
		name: 'customFieldsUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description: 'Custom fields to send in the conversion payload',
		options: [
			{
				displayName: 'Custom Field',
				name: 'customFieldValues',
				values: [
					{
						displayName: 'Field Name',
						name: 'fieldName',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'cf_assunto_de_interesse',
						description: 'Custom field API name. The cf_ prefix is added automatically when omitted.',
					},
					{
						displayName: 'Value',
						name: 'fieldValue',
						type: 'string',
						default: '',
						required: true,
					},
				],
			},
		],
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
		displayName: 'Traffic Campaign',
		name: 'trafficCampaign',
		type: 'string',
		default: '',
		description: 'UTM campaign',
	},
	{
		displayName: 'Traffic Medium',
		name: 'trafficMedium',
		type: 'string',
		default: '',
		description: 'UTM medium',
	},
	{
		displayName: 'Traffic Source',
		name: 'trafficSource',
		type: 'string',
		default: '',
		description: 'Value from the __trf.src cookie or UTM source',
	},
	{
		displayName: 'Traffic Value',
		name: 'trafficValue',
		type: 'string',
		default: '',
		description: 'UTM value or term',
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

export const conversionsAndTriggersDescription: INodeProperties[] = [
	{
		displayName: 'Conversion Identifier',
		name: 'conversionIdentifier',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['conversionsAndTriggers'],
				operation: ['createConversionEvent'],
			},
		},
		description: 'Name of the conversion event',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'contact@example.com',
		required: true,
		displayOptions: {
			show: {
				resource: ['conversionsAndTriggers'],
				operation: ['createConversionEvent'],
			},
		},
		description: 'Email of the contact that converted',
	},
	{
		displayName: 'Additional Fields',
		name: 'conversionAdditionalFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['conversionsAndTriggers'],
				operation: ['createConversionEvent'],
			},
		},
		options: conversionFieldOptions,
	},
];
