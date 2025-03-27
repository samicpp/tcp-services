import Engine from "../../../../../engine/library.d.ts";
import lsSetup from "../../../../../console.ts";

let _del:()=>void;
let td=new TextDecoder;
let te=new TextEncoder;
const [_logfile,logsole]=lsSetup();

export default async function(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    ;
}

export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    _del=dele;
}

export const state:{active:boolean}={
    active:false,
};