import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class RdStationMarketingApi implements ICredentialType {
	name = 'rdStationMarketingApi';
	displayName = 'RD Station Marketing (OAuth2)';
	documentationUrl = 'https://developers.rdstation.com/reference';
	extends = ['oAuth2Api'];
	icon: Icon = 'file:rdstation.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Staging',
					value: 'staging',
				},
				{
					name: 'Production',
					value: 'production',
				},
			],
			default: 'staging',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			required: true,
			default:
				'={{ $self["environment"] === "production" ? "https://accounts.rdstation.com/oauth/authorize" : "https://api-staging.rd.services/auth/dialog" }}',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			required: true,
			default:
				'={{ $self["environment"] === "production" ? "https://api.rd.services/oauth2/token" : "https://api-staging.rd.services/auth/token?token_by=code" }}',
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
