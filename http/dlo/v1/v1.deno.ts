//import docs from "../../../docs.d.ts";
import Engine from "../../../engine/library.d.ts";
import setup from "../../../console.ts";
//import wsDeno from "../../0/ws/ws.deno.ts";

const [logcat,logsole]=setup();

let del:Function;
//let visits=0;
let td=new TextDecoder;
let te=new TextEncoder;
let closing=false;
//let imp;
//const room:WebSocket[]=[];
//let active=true;
//let any:Record<string,Function>={}; // mitigare vscode warnings
//let console=new Proxy(any,{get(o,p){return imp.logsole[p]}});
const dloUrl=(uid:any)=>`wss://ws.aerobe.net?userid=${uid}`;

logsole.log("dlo/ws/ws.deno.ts imported");

async function handler(ws:Engine.WebSocket,wsc:WebSocket,frame:WsFrame){
    try{
        logsole.log("ws.deno.ts frame",frame);
        if(frame.opname=="ping")ws.pong(frame.payload);
        else if(frame.opname=="pong")logsole.log("ws.deno.ts pong received");

        else if(frame.opname=="text"){
            let str=td.decode(frame.payload);
            logsole.log("ws.deno.ts got something",str);
            wsc.send(str);
            logsole.log("ws.deno.ts forward result");
        }
        else if(frame.opname=="close"&&!closing){
            logsole.log("ws.deno.ts client closing", td.decode(frame.close.message));
            if(frame.close.code==-1){
                logsole.log("ws.deno.ts client didnt send any closure data");
                ws.close(1002, "Client initiated closure. Cannot read closure code");
            }
            else ws.close(frame.close.code,"Client initiated closure");
            closing=true;
            wsc.close();
            del();
        }
        else if(frame.opname=="close"&&closing){
            logsole.log("ws.deno.ts close acknowledgement received");
            wsc.close();
            ws.end();
            del();
        }
    }catch(err){
        logsole.error(err);
    }
};

async function dhand(ws:Engine.WebSocket,wsc:WebSocket,data:MessageEvent){
    logsole.log("ws.deno.ts server sent something", data);
    ws.sendText(data.data);
}

export default async function(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    ;
}
export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    del=dele;
    
    const {client}=socket;
    //logsole.log("ws.deno.ts",0);
    
    if(!client)return del();

    if(client.headers["upgrade"]=="websocket"){
        logsole.log("ws.deno.ts websocket upgrade");
        
        const websocket=new WebSocket(dloUrl(url.searchParams.get("userid")));

        let res:Event|CloseEvent=await new Promise(r=>{websocket.onopen=r;/*websocket.onerror=r*/;websocket.onclose=r});
        logsole.log("ws.deno.ts res",res);
        if(websocket.readyState==1){

            let w=await socket.websocket();
            if(w)logsole.log("ws.deno.ts upgraded connection");
            else return logsole.log("ws.deno.ts couldnt upgrade");

            w.on("frame",handler.bind(this,w,websocket));
            websocket.onmessage=dhand.bind(this,w,websocket);
            websocket.onclose=(e:CloseEvent)=>w.close(e.code,e.reason);
            websocket.onerror=e=>w.close();
        } else if(res instanceof CloseEvent) { // mitigate vscode warnings
            socket.status=500;
            socket.close(`${res.code}: ${res.reason}`);
        };
        //dele();
    }else{
        logsole.log("ws.deno.ts client isnt trying to upgrade");
        //await socket.writeText("hello");
        await socket.close("hello"); 
        //dele();
    }

    dele();
}

//export {active};
export const state:{active:boolean}={
    active:false,
};