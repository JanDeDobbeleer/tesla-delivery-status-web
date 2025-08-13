
// NOTE: This file is a reference for the required server-side proxy logic.
// You must deploy this updated logic to your proxy endpoint:
// https://tesla-delivery-proxy.gewoonjaap.workers.dev/

import { CLIENT_ID, REDIRECT_URI, TOKEN_URL } from '../constants';

// --- Types for Request Bodies ---
interface AuthProxyRequest {
    grant_type: 'authorization_code' | 'refresh_token';
    code?: string;
    codeVerifier?: string;
    refreshToken?: string;
}

interface ApiProxyRequest {
    action: 'proxy';
    targetUrl: string;
    accessToken: string;
}

// --- Helper for CORS Responses ---
function createJsonResponse(body: any, status: number, extraHeaders: Record<string, string> = {}): Response {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow any origin
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...extraHeaders,
    };
    return new Response(JSON.stringify(body), { status, headers });
}

// --- Main Handler ---
export default async function handler(request: Request): Promise<Response> {
    // Handle CORS preflight requests for browsers
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (request.method !== 'POST') {
        return createJsonResponse({ error: 'Method Not Allowed' }, 405, { 'Allow': 'POST, OPTIONS' });
    }

    try {
        const body: AuthProxyRequest | ApiProxyRequest = await request.json();

        // --- Handle Authentication Requests ---
        if ('grant_type' in body) {
            let requestBody: URLSearchParams;

            if (body.grant_type === 'authorization_code') {
                if (!body.code || !body.codeVerifier) {
                    return createJsonResponse({ error: 'Missing code or codeVerifier for authorization_code grant' }, 400);
                }
                requestBody = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: CLIENT_ID,
                    code: body.code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: body.codeVerifier,
                });
            } else if (body.grant_type === 'refresh_token') {
                if (!body.refreshToken) {
                    return createJsonResponse({ error: 'Missing refreshToken for refresh_token grant' }, 400);
                }
                requestBody = new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: CLIENT_ID,
                    refresh_token: body.refreshToken,
                });
            } else {
                 return createJsonResponse({ error: 'Invalid grant_type specified' }, 400);
            }

            const teslaResponse = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: requestBody,
            });
            const data = await teslaResponse.json();
            return createJsonResponse(data, teslaResponse.status);
        }
        
        // --- Handle General API Proxy Requests ---
        if ('action' in body && body.action === 'proxy') {
            if (!body.targetUrl || !body.accessToken) {
                return createJsonResponse({ error: 'Missing targetUrl or accessToken for proxy action' }, 400);
            }
            
            const apiResponse = await fetch(body.targetUrl, {
                headers: {
                    'Authorization': `Bearer ${body.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            
            // Handle cases where the API returns no content (e.g., 204)
            if (apiResponse.status === 204) {
                return createJsonResponse({}, 204);
            }

            const data = await apiResponse.json();
            return createJsonResponse(data, apiResponse.status);
        }

        return createJsonResponse({ error: 'Invalid request body or action specified' }, 400);

    } catch (error) {
        console.error('Proxy handler error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return createJsonResponse({ error: 'Internal Server Error in proxy', details: errorMessage }, 500);
    }
}
