import Engine from "../../engine/library.d.ts";
import lsSetup from "../../console.ts";

let _del:()=>void;
let td=new TextDecoder;
let te=new TextEncoder;
const [_logfile,logsole]=lsSetup();

export default async function main(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    const nu=`https://www.cppdev.dev${socket.client?.path||""}`;
    logsole.log("redirect.deno.ts redirect to new domain")
    socket.setHeader("Location",nu);
    socket.status=301;
    socket.close(`<a href="${nu}">main site</a><script>location="${nu}"</script>`);
}

export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    _del=dele;
    main(socket,url,get,opt);
}

export const state:{active:boolean}={
    active:false,
};