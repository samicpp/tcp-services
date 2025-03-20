import Engine from "../../../engine/library.d.ts";
import lsSetup from "../../../console.ts";

let _del:()=>void;
let td=new TextDecoder;
let te=new TextEncoder;
const [_logfile,logsole]=lsSetup();
export const room:Engine.WebSocket[]=[];

function wsHandler(self:Engine.WebSocket,frame:Engine.WsFrame){
    for(let ws of room)ws.sendText(frame.payload);
}
function roomPush(client:Engine.WebSocket){
    room.push(client);
    client.on("frame",wsHandler.bind(null,client));
}

async function handleConn(sock:Engine.HttpSocket|Engine.PseudoHttpSocket){
    const {client}=sock;
    logsole.log("handling con");
    if(!client)return sock.close("cannot read client");
    if(client.headers["upgrade"]=="websocket"){
        logsole.log("gchat.deno.ts websocket upgrade");
        let w=await sock.websocket();
        if(w)logsole.log("gchat.deno.ts upgraded connection");
        else return logsole.log("gchat.deno.ts couldnt upgrade");

        roomPush(w);

        logsole.log("gchat.deno.ts",room);
    }else{
        logsole.log("gchat.deno.ts client isnt trying to upgrade");
        await sock.close("WS required"); 
    }
}

export default async function(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    handleConn(socket);
}

export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    _del=dele;
    if(past?.room&&Array.isArray(past.room))room.push(...past.room);

    handleConn(socket);
}

export const state:{active:boolean}={
    active:false,
};