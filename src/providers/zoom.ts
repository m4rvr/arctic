import {
	AuthorizationCodeAuthorizationURL,
	AuthorizationCodeTokenRequestContext,
	RefreshRequestContext,
	TokenRevocationRequestContext
} from "@oslojs/oauth2";
import { sendTokenRequest, sendTokenRevocationRequest } from "../request.js";

import type { OAuth2Tokens } from "../oauth2.js";

const authorizationEndpoint = "https://zoom.us/oauth/authorize";
const tokenEndpoint = "https://zoom.us/oauth/token";
const tokenRevocationEndpoint = "https://zoom.us/oauth/revoke";

export class Zoom {
	private clientId: string;
	private clientSecret: string;
	private redirectURI: string;

	constructor(clientId: string, clientSecret: string, redirectURI: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.redirectURI = redirectURI;
	}

	public createAuthorizationURL(
		state: string,
		codeVerifier: string
	): AuthorizationCodeAuthorizationURL {
		const url = new AuthorizationCodeAuthorizationURL(authorizationEndpoint, this.clientId);
		url.setRedirectURI(this.redirectURI);
		url.setState(state);
		url.setS256CodeChallenge(codeVerifier);
		return url;
	}

	public async validateAuthorizationCode(
		code: string,
		codeVerifier: string
	): Promise<OAuth2Tokens> {
		const context = new AuthorizationCodeTokenRequestContext(code);
		context.authenticateWithHTTPBasicAuth(this.clientId, this.clientSecret);
		context.setRedirectURI(this.redirectURI);
		context.setCodeVerifier(codeVerifier);
		const tokens = await sendTokenRequest(tokenEndpoint, context);
		return tokens;
	}

	public async refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens> {
		const context = new RefreshRequestContext(refreshToken);
		context.authenticateWithHTTPBasicAuth(this.clientId, this.clientSecret);
		const tokens = await sendTokenRequest(tokenEndpoint, context);
		return tokens;
	}

	public async revokeAccessToken(accessToken: string): Promise<void> {
		const context = new TokenRevocationRequestContext(accessToken);
		context.authenticateWithHTTPBasicAuth(this.clientId, this.clientSecret);
		await sendTokenRevocationRequest(tokenRevocationEndpoint, context);
	}
}
