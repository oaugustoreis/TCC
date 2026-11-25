import { ps } from '@pulse/core';
export function isProduct(data: any): boolean {
    return !!data && typeof data.id === 'number' &&
        typeof data.name === 'string' && data.name.length > 0 &&
        typeof data.price === 'number';
}
export function validateBody(response: any, label: string, contract: (data: any) => boolean): any {
    let data: any = null;
    try { data = response.json(); } catch (_) {}
    ps.check(data, { [label]: contract });
    return data;
}
