export var dStoreEnabled=false;
export const setDStoreEnabled=b=>dStoreEnabled=b;
export const dStore:Record<string,Array<any>>={};
export function store(name:string,value:any):void{
    if(!dStoreEnabled)return;
    if(dStore[name])dStore[name].push(value);
    else dStore[name]=[value];
};

export const libOpt = {
    debug: false,
    eventDbg: false,
};
export function setOpt(name: string, value: any): boolean {
    if (typeof libOpt[name] != typeof value) return false;
    libOpt[name] = value;
    return true;
};