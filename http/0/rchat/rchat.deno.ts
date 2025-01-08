//import docs from "../../../docs.d.ts";


let del:Function;
let visits=0;
let td=new TextDecoder;
let te=new TextEncoder;
let closing=false;
let imp;
const room:WebSocket[]=[];
//let active=true;
let any:Record<string,Function>={}; // mitigare vscode warnings
let console=new Proxy(any,{get(o,p){return imp.logsole[p]}});

async function handler(dest:number,ws:WebSocket,frame:WsFrame){
    console.log("ws.deno.ts frame",frame);
    if(frame.opname=="ping")ws.pong(frame.payload);
    else if(frame.opname=="pong")console.log("rchat.deno.ts pong received");

    else if(frame.opname=="text"){
        console.log("rchat.deno.ts got something");
        let str=td.decode(frame.payload);
        let tar=room[dest];
        console.log("rchat.deno.ts",str);
        if(str[0]=="!"){
            let cmd=str.split(" ")[0];
            switch(cmd){
                case"!bin":
                    tar.sendBinary(str.replace("!bin ",""));
                    return;
                
                case"!ping":
                    tar.ping("ping");
                    return;
            }
        }
        let r=tar.sendText(frame.payload);
        console.log("rchat.deno.ts forward result",r);
    }
    else if(frame.opname=="close"&&!closing){
        console.log("rchat.deno.ts client closing", td.decode(frame.close.message));
        if(frame.close.code==-1){
            console.log("rchat.deno.ts client didnt send any closure data");
            ws.close(1002, "Client initiated closure. Cannot read closure code");
        }
        else ws.close(frame.close.code,"Client initiated closure");
        del();
    }
    else if(frame.opname=="close"&&closing){
        console.log("rchat.deno.ts close acknowledgement received");
        ws.end();
        del();
    }
}

export default async function(socket: HttpSocket, url, get, opt){
    const {client}=socket;
    console.log("rchat.deno.ts",1);

    if(client.headers["upgrade"]=="websocket"){
        console.log("rchat.deno.ts websocket upgrade");
        let w=await socket.websocket();
        if(w)console.log("rchat.deno.ts upgraded connection");
        else return console.log("rchat.deno.ts couldnt upgrade");

        w.on("frame",handler.bind(this,0,w));
        room.push(w);

        console.log("rchat.deno.ts",room);
        room[0].sendText("test");
        room[1].sendText("test");
        del();
    }else{
        console.log("rchat.deno.ts client isnt trying to upgrade");
        await socket.writeText("hello");
        socket.close(); 
    }
}
export async function init(socket: HttpSocket, url: URL, get: string, opt, dele: ()=> void, past: any|void, imports){
    del=dele;
    imp=imports;
    const {client}=socket;
    console.log("rchat.deno.ts",0);
    

    if(client.headers["upgrade"]=="websocket"){
        console.log("rchat.deno.ts websocket upgrade");
        let w=await socket.websocket();
        if(w)console.log("rchat.deno.ts upgraded connection");
        else return console.log("rchat.deno.ts couldnt upgrade");

        w.on("frame",handler.bind(this,1,w));
        room.push(w);
    }else{
        console.log("rchat.deno.ts client isnt trying to upgrade");
        await socket.writeText("hello");
        socket.close(); 
        dele();
    }

    //dele();
}

//export {active};
export const state:{active:boolean}={
    active:false,
};