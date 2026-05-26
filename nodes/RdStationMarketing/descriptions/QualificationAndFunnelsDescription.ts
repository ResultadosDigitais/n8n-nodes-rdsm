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

export const qualificationAndFunnelsDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'contact@example.com',
		required: true,
		displayOptions: {
			show: {
				resource: ['qualificationAndFunnels'],
				operation: ['markOpportunity', 'markOpportunityWon', 'markOpportunityLost'],
			},
		},
		description: 'Email of the existing contact to qualify',
	},
	{
		displayName: 'Funnel Name',
		name: 'funnelName',
		type: 'options',
		default: 'default',
		required: true,
		displayOptions: {
			show: {
				resource: ['qualificationAndFunnels'],
				operation: ['markOpportunity', 'markOpportunityWon', 'markOpportunityLost'],
			},
		},
		description: 'Name of the funnel where the contact should be qualified',
		options: [
			{
				name: 'Default',
				value: 'default',
			},
		],
	},
	{
		displayName: 'Sale Value',
		name: 'saleValue',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['qualificationAndFunnels'],
				operation: ['markOpportunityWon'],
			},
		},
		description: 'Value of the won opportunity',
	},
	{
		displayName: 'Lost Reason',
		name: 'lostReason',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['qualificationAndFunnels'],
				operation: ['markOpportunityLost'],
			},
		},
		description: 'Reason why the opportunity was lost',
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
				resource: ['qualificationAndFunnels'],
				operation: ['getContactFunnels', 'updateContactFunnel'],
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
				resource: ['qualificationAndFunnels'],
				operation: ['getContactFunnels', 'updateContactFunnel'],
			},
		},
		description: 'Email address or UUID value for the selected identifier',
	},
	{
		displayName: 'Update Fields',
		name: 'funnelUpdateFields',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				resource: ['qualificationAndFunnels'],
				operation: ['updateContactFunnel'],
			},
		},
		description: 'Funnel fields to update',
		options: [
			{
				displayName: 'Clear Contact Owner',
				name: 'clearContactOwner',
				type: 'boolean',
				default: false,
				description: 'Whether to remove the currently assigned contact owner',
			},
			{
				displayName: 'Contact Owner Email',
				name: 'contactOwnerEmail',
				type: 'string',
				default: '',
				placeholder: 'owner@example.com',
				description: 'Email address of the user responsible for the contact',
			},
			{
				displayName: 'Lifecycle Stage',
				name: 'lifecycleStage',
				type: 'options',
				default: 'Lead',
				description: 'Stage in the funnel to which the contact belongs',
				options: [
					{
						name: 'Lead',
						value: 'Lead',
					},
					{
						name: 'Qualified Lead',
						value: 'Qualified Lead',
					},
					{
						name: 'Client',
						value: 'Client',
					},
				],
			},
			{
				displayName: 'Opportunity',
				name: 'opportunity',
				type: 'boolean',
				default: true,
				description: 'Whether the contact is an opportunity in the funnel',
			},
		],
	},
];
