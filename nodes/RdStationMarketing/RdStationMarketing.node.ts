import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	contactsDescription,
	conversionsAndTriggersDescription,
	customFieldsDescription,
	ecommerceEventsDescription,
	qualificationAndFunnelsDescription,
} from './descriptions';
import {
	executeContacts,
	executeConversionsAndTriggers,
	executeCustomFields,
	executeEcommerceEvents,
	executeQualificationAndFunnels,
} from './resources';

type RdStationMarketingResource = 'contact' | 'conversionsAndTriggers' | 'customFields' | 'ecommerceEvents' | 'qualificationAndFunnels';

export class RdStationMarketing implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'RD Station Marketing',
		name: 'rdStationMarketing',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with RD Station Marketing',
		icon: 'file:rdstation.svg',
		defaults: {
			name: 'RD Station Marketing',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'rdStationMarketingApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'contact',
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Conversion and Trigger',
						value: 'conversionsAndTriggers',
					},
					{
						name: 'Custom Field',
						value: 'customFields',
					},
					{
						name: 'E-Commerce Event',
						value: 'ecommerceEvents',
					},
					{
						name: 'Qualification and Funnel',
						value: 'qualificationAndFunnels',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				default: 'create',
				options: [
					{
						name: 'Add Tags',
						value: 'addTags',
						action: 'Add tags to a contact',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a contact',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a contact',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a contact',
					},
					{
						name: 'Get Events',
						value: 'getEvents',
						action: 'Get contact events',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a contact',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['conversionsAndTriggers'],
					},
				},
				default: 'createConversionEvent',
				options: [
					{
						name: 'Create Conversion Event',
						value: 'createConversionEvent',
						action: 'Create a conversion event',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customFields'],
					},
				},
				default: 'getAll',
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many custom fields',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a custom field',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a custom field',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a custom field',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ecommerceEvents'],
					},
				},
				default: 'checkoutStarted',
				options: [
					{
						name: 'Abandoned Cart',
						value: 'abandonedCart',
						action: 'Track abandoned cart event',
					},
					{
						name: 'Checkout Started',
						value: 'checkoutStarted',
						action: 'Track checkout started event',
					},
					{
						name: 'Order Canceled',
						value: 'orderCanceled',
						action: 'Track order canceled event',
					},
					{
						name: 'Order Fulfilled',
						value: 'shippedOrder',
						action: 'Track order fulfilled event',
					},
					{
						name: 'Order Paid',
						value: 'orderAndPaymentCompleted',
						action: 'Track order paid event',
					},
					{
						name: 'Shipment Delivered',
						value: 'deliveredOrder',
						action: 'Track shipment delivered event',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['qualificationAndFunnels'],
					},
				},
				default: 'markOpportunity',
				options: [
					{
						name: 'Get Contact Funnels',
						value: 'getContactFunnels',
						action: 'Get contact funnels',
					},
					{
						name: 'Mark Lead as Opportunity',
						value: 'markOpportunity',
						action: 'Mark lead as opportunity',
					},
					{
						name: 'Mark Opportunity as Lost',
						value: 'markOpportunityLost',
						action: 'Mark opportunity as lost',
					},
					{
						name: 'Mark Opportunity as Won',
						value: 'markOpportunityWon',
						action: 'Mark opportunity as won',
					},
					{
						name: 'Update Contact Funnel',
						value: 'updateContactFunnel',
						action: 'Update contact funnel',
					},
				],
			},
			...contactsDescription,
			...conversionsAndTriggersDescription,
			...customFieldsDescription,
			...ecommerceEventsDescription,
			...qualificationAndFunnelsDescription,
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as RdStationMarketingResource;
				let result: IDataObject | IDataObject[] | undefined;

				if (resource === 'contact') {
					result = await executeContacts(this, i);
				} else if (resource === 'conversionsAndTriggers') {
					result = await executeConversionsAndTriggers(this, i);
				} else if (resource === 'customFields') {
					result = await executeCustomFields(this, i);
				} else if (resource === 'qualificationAndFunnels') {
					result = await executeQualificationAndFunnels(this, i);
				} else if (resource === 'ecommerceEvents') {
					result = await executeEcommerceEvents(this, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
				}

				if (Array.isArray(result)) {
					for (const entry of result) returnData.push(entry);
				} else if (result) {
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message, itemIndex: i });
					continue;
				}
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
