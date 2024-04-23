export interface ParsedState {
    state?: string;
    paramExpr?: string;
}

export function parseStateRef(ref: string): ParsedState {
    const paramsOnly = ref.match(/^\s*({[^}]*})\s*$/);
    if (paramsOnly) ref = '(' + paramsOnly[1] + ')';
    const parsed = ref.replace(/\n/g, ' ').match(/^\s*([^(]*?)\s*(\((.*)\))?\s*$/);
    if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
    return { state: parsed[1] || null, paramExpr: parsed[3] || null };
}
