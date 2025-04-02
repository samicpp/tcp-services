//import docs from "../../../docs.d.ts";
import Engine from "../../../engine/library.d.ts";
import setup from "../../../console.ts";
import { json } from "node:stream/consumers";
//import wsDeno from "../../0/ws/v2.deno.ts";

const [logcat,logsole]=setup();

let del:Function;
//let visits=0;
const td=new TextDecoder;
const te=new TextEncoder;
let closing=false;
export let store:Record<string,{ws:Engine.WebSocket,v:string,m:Engine.WebSocket[]}>={};
//let imp;
//const room:WebSocket[]=[];
//let active=true;
//let any:Record<string,Function>={}; // mitigare vscode warnings
//let console=new Proxy(any,{get(o,p){return imp.logsole[p]}});
//const dloUrl=(uid:any)=>`wss://ws.aerobe.net?userid=${uid}`;
const latest="6";
let slave:Engine.WebSocket;
let user:string;
const masters:Engine.WebSocket[]=[];

logsole.log("dlo/v2/v2.deno.ts imported");

async function shandler(this:null,ws:Engine.WebSocket,s:{closing:boolean},frame:WsFrame){
    try{
        logsole.log("v2.deno.ts frame from slave",frame);
        if(frame.opname=="ping")ws.pong(frame.payload);
        else if(frame.opname=="pong")logsole.log("v2.deno.ts pong frame received");

        else if(frame.opname=="text"){
            let str=td.decode(frame.payload);
            for(const m of store[user].m){
                m.sendText(frame.payload);
                logsole.log("v2.deno.ts forward to ", m,str);
            };
            const js="["+(str.replace(/^.*?(\[|$)/,"")||"]");
            const j=(()=>{try{return JSON.parse(js)}catch(_err){return[]}})();
            logsole.log("v2.deno.ts got something",str);
            ;
            if(str.startsWith("access")){
                //const js=("{"+str.replace(/^.*?\{/,""));
                logsole.log("v2.deno.ts access",js);
            }else if(str.startsWith("echo")){
                // const js=("["+str.replace(/^.*?\[/,"")),
                // j:Array<string|number|object>=JSON.parse(js);
                console.log("v2.deno.ts echo",j);
                j.forEach(m=>ws.sendText(String(m)));
            }else if(str.startsWith("ping")){
                logsole.log("v2.deno.ts received ping");
                ws.sendText(str.replace("ping","pong"));
                ws.ping("payload");
            }else if(str.startsWith("pong")){
                logsole.log("v2.deno.ts received pong");
            };
        }
        else if(frame.opname=="close"&&!s.closing){
            logsole.log("v2.deno.ts client closing", td.decode(frame.close.message));
            if(frame.close.code==-1){
                logsole.log("v2.deno.ts client didnt send any closure data");
                ws.close(1002, "Client initiated closure. Cannot read closure code");
            }
            else ws.close(frame.close.code,"Client initiated closure");
            s.closing=true;
            //del();
        }
        else if(frame.opname=="close"&&s.closing){
            logsole.log("v2.deno.ts close acknowledgement received");
            ws.end();
            //del();
        }
    }catch(err){
        logsole.error(err);
    }
};
async function mhandler(this:null,ws:Engine.WebSocket,s:{closing:boolean},frame:WsFrame){
    try{
        logsole.log("v2.deno.ts frame from master",frame);
        if(frame.opname=="ping")ws.pong(frame.payload);
        else if(frame.opname=="pong")logsole.log("v2.deno.ts pong frame received");

        else if(frame.opname=="text"){
            let str=td.decode(frame.payload);
            logsole.log("v2.deno.ts got something",str);
            ;
            store[user].ws.sendText(frame.payload);
        }
        else if(frame.opname=="close"&&!s.closing){
            logsole.log("v2.deno.ts client closing", td.decode(frame.close.message));
            if(frame.close.code==-1){
                logsole.log("v2.deno.ts client didnt send any closure data");
                ws.close(1002, "Client initiated closure. Cannot read closure code");
            }
            else ws.close(frame.close.code,"Client initiated closure");
            s.closing=true;
            store[user].m.splice(store[user].m.indexOf(ws),1);
            //del();
        }
        else if(frame.opname=="close"&&s.closing){
            logsole.log("v2.deno.ts close acknowledgement received");
            ws.end();
            //del();
        }
    }catch(err){
        logsole.error(err);
    }
};


export default async function main(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    const {client}=socket;
    //logsole.log("v2.deno.ts",0);
    
    if(!client)return;

    if(client.headers["upgrade"]=="websocket"){
        logsole.log("v2.deno.ts websocket upgrade");
        

        const uid=url.searchParams.get("uid");
        const type=url.searchParams.get("t");
        user=uid||"";
        
        if(uid&&type=="s"){
            let w=await socket.websocket();
            if(w)logsole.log("v2.deno.ts upgraded connection");
            else return logsole.log("v2.deno.ts couldnt upgrade");

            logsole.log("v2.deno.ts uid is",uid);
            logsole.log("v2.deno.ts type is",type);
            w.on("frame",shandler.bind(null,w,{closing:false}));
            let v=url.searchParams.get("version");
            store[uid]={ws:w,v:v||"0",m:[]};
            slave=w;

            if(v!=latest){
                w.sendText("notify"+JSON.stringify({
                    title:"update",
                    message:"je zit op een oudere versie. het kan minder goed gaan werken",
                }));
            }
        } else if(uid&&type=="m"&&store[uid]) {
            let w=await socket.websocket();
            if(w)logsole.log("v2.deno.ts upgraded connection");
            else return logsole.log("v2.deno.ts couldnt upgrade");
            logsole.log("v2.deno.ts uid is",uid);
            logsole.log("v2.deno.ts type is",type);
            w.on("frame",mhandler.bind(null,w,{closing:false}));
            store[uid].m.push(w);
        } else {
            logsole.log("v2.deno.ts no uid");
            socket.status=403;
            await socket.close("no uid");
        };
        
    
        //dele();
    }if(client.data){
        logsole.log("v2.deno.ts client send data",client.data);
        try{
            console.log("v2.deno.ts inquiering about "+client.data,store[client.data]);
            if(store[client.data])await socket.close("true");
            else await socket.close("false");
            // const json=JSON.parse(client.data);
            // if(!json?.token||!store[json?.token]||!Array.isArray(json?.msg)){
            //     logsole.log("v2.deno.ts no (valid) token/messgaes",json);
            //     await socket.close("false");
            // }else{
            //     for(const m of json.msg)await store[json.token].ws.sendText(m);
            //     logsole.log("v2.deno.ts sent messages");
            //     await socket.close("true");
            // }
        }catch(err){
            socket.status=400;
            await socket.close("");
        }
    }else{
        logsole.log("v2.deno.ts client isnt trying to upgrade");
        //await socket.writeText("hello");
        socket.setHeader("Content-Type","text/html;charset=utf8");
        await socket.close(`<!DOCTYPE html>
<html>
    <head>
        <title>something</title>
        <script src="/v2/preface.oc.js"></script>
        <link rel="stylesheet" href="/style.css"/>
    </head>
    <body>
        <!--https://dlo.cppdev.dev/hacks-->
        <div class="main">
            <p>hello world</p>
            <p></p>
        </div>
        ${/*<script src="/v2/load.js"></script>*/''}
    </body>
</html>`); 
        //dele();
    }
}
export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    del=dele;
    
    if(past){
        let nstore=(past?.mod?.getStore||(()=>store))();store=nstore;
        logsole.info("v2.deno.ts trying to use previous store",store);
    };
    main(socket,url,get,opt);

    dele();
}

//export {active};
export const state:{active:boolean}={
    active:false,
};
export function getStore(){
    return store;
}