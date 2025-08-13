import { CombinedOrder, OrderDiff } from "../types";

// --- PKCE Helpers ---

function base64urlencode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return base64urlencode(randomBytes.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlencode(digest);
}

// --- Token Helpers ---

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

export function isTokenValid(accessToken: string): boolean {
    const decoded = decodeJwt(accessToken);
    if (!decoded || !decoded.exp) {
        return false;
    }
    // Check if expiry time is in the future (with a 60-second buffer)
    return decoded.exp > (Date.now() / 1000) + 60;
}

// --- Comparison Helpers ---

function isObject(obj: any): obj is object {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export function compareObjects(oldObj: any, newObj: any, path: string = '', diffs: OrderDiff = {}): OrderDiff {
    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);

    for (const key of new Set([...oldKeys, ...newKeys])) {
        const currentPath = path ? `${path}.${key}` : key;
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        if (isObject(oldVal) && isObject(newVal)) {
            compareObjects(oldVal, newVal, currentPath, diffs);
        } else if (!Object.is(oldVal, newVal)) {
            // Only add diff if one of the values is not undefined
            if(typeof oldVal !== 'undefined' || typeof newVal !== 'undefined') {
                diffs[currentPath] = { old: oldVal, new: newVal };
            }
        }
    }
    return diffs;
}

export function compareOrders(oldOrders: CombinedOrder[], newOrders: CombinedOrder[]): Record<string, OrderDiff> {
    const allDiffs: Record<string, OrderDiff> = {};
    const newOrdersMap = new Map(newOrders.map(o => [o.order.referenceNumber, o]));

    for (const oldOrder of oldOrders) {
        const rn = oldOrder.order.referenceNumber;
        const newOrder = newOrdersMap.get(rn);
        if (newOrder) {
            const orderDiffs = compareObjects(oldOrder, newOrder);
            if(Object.keys(orderDiffs).length > 0) {
                allDiffs[rn] = orderDiffs;
            }
        }
    }
    return allDiffs;
}