import type { ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class RdStationMarketingApi implements ICredentialType {
	name = 'rdStationMarketingApi';
	displayName = 'RD Station Marketing (OAuth2)';
	documentationUrl = 'https://developers.rdstation.com/reference';
	extends = ['oAuth2Api'];
	icon: Icon = 'file:rdstation.svg';
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}',
			url: '/platform/contacts/fields',
			method: 'GET',
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://api.rd.services',
			description: 'Base URL for RD Station Marketing API requests. Do not include a trailing slash.',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			required: true,
			default: 'https://accounts.rdstation.com/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			required: true,
			default:
				'={{ (() => { let url = String($self["baseUrl"] ?? "").trim(); while (url.endsWith("/")) { url = url.slice(0, -1); } return url; })() + "/oauth2/token" }}',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
