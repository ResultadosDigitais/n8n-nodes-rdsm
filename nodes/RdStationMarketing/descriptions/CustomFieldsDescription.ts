import type { INodeProperties } from 'n8n-workflow';

const dataTypeOptions = [
	{
		name: 'Boolean',
		value: 'BOOLEAN',
	},
	{
		name: 'Integer',
		value: 'INTEGER',
	},
	{
		name: 'String',
		value: 'STRING',
	},
	{
		name: 'String Array',
		value: 'STRING[]',
	},
];

const presentationTypeOptions = [
	{
		name: 'Check Box',
		value: 'CHECK_BOX',
	},
	{
		name: 'Combo Box',
		value: 'COMBO_BOX',
	},
	{
		name: 'Email Input',
		value: 'EMAIL_INPUT',
	},
	{
		name: 'Multiple Choice',
		value: 'MULTIPLE_CHOICE',
	},
	{
		name: 'Number Input',
		value: 'NUMBER_INPUT',
	},
	{
		name: 'Phone Input',
		value: 'PHONE_INPUT',
	},
	{
		name: 'Radio Button',
		value: 'RADIO_BUTTON',
	},
	{
		name: 'Text Area',
		value: 'TEXT_AREA',
	},
	{
		name: 'Text Input',
		value: 'TEXT_INPUT',
	},
	{
		name: 'URL Input',
		value: 'URL_INPUT',
	},
];

const customFieldMetadataProperties: INodeProperties[] = [
	{
		displayName: 'Data Type',
		name: 'dataType',
		type: 'options',
		default: 'STRING',
		required: true,
		options: dataTypeOptions,
		description: 'Data type the field value must use',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'fieldName',
		type: 'string',
		default: '',
		required: true,
		description: 'Field name in RD Station Marketing',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Label',
		name: 'fieldLabel',
		type: 'string',
		default: '',
		required: true,
		description: 'Field label shown in RD Station forms',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Presentation Type',
		name: 'presentationType',
		type: 'options',
		default: 'TEXT_INPUT',
		required: true,
		options: presentationTypeOptions,
		description: 'How the field is presented in RD Station forms',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Valid Options',
		name: 'validOptionsUi',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description: 'Options for combo box, radio button, and multiple choice fields',
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Option',
				name: 'optionValues',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Stored value for the option',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						required: true,
						description: 'Label shown for the option',
					},
				],
			},
		],
	},
];

export const customFieldsDescription: INodeProperties[] = [
	{
		displayName: 'API Identifier',
		name: 'apiIdentifier',
		type: 'string',
		default: '',
		placeholder: 'cf_meu_campo_personalizado',
		required: true,
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['create'],
			},
		},
		description: "Unique field identifier. It must start with 'cf_' and can only contain lowercase letters, numbers, and underscores.",
	},
	{
		displayName: 'Field UUID',
		name: 'fieldUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['customFields'],
				operation: ['update', 'delete'],
			},
		},
		description: 'UUID of the custom field',
	},
	...customFieldMetadataProperties,
];
