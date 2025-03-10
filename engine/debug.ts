export const libOpt = {
    debug: false,
    eventDbg: false,
};
export function setOpt(name: string, value: any): boolean {
    if (typeof libOpt[name] != typeof value) return false;
    libOpt[name] = value;
    return true;
};