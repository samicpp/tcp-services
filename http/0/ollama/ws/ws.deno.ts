import cinit from "../../../../console.ts";
const [logfile,logsole]=cinit();
let del:Function;
let visits=0;
let imp;
let messages:{role:string,content:string}[]=[];
let td=new TextDecoder;
let te=new TextEncoder;
let closing=false;

async function handler(ws:WebSocket,frame:WsFrame){
    logsole.log("ws.deno.ts frame",frame);
    if(frame.opname=="ping")ws.pong(frame.payload);
    else if(frame.opname=="pong")console.log("rchat.deno.ts pong received");

    else if(frame.opname=="text"){
        logsole.log("rchat.deno.ts got something");
        messages.push({role:"user",content:td.decode(frame.payload)});
        ws.sendText(await genRes());
    }
    else if(frame.opname=="close"&&!closing){
        logsole.log("rchat.deno.ts client closing", td.decode(frame.close.message));
        if(frame.close.code==-1){
            logsole.log("rchat.deno.ts client didnt send any closure data");
            ws.close(1002, "Client initiated closure. Cannot read closure code");
        }
        else ws.close(frame.close.code,"Client initiated closure");
        //del();
    }
    else if(frame.opname=="close"&&closing){
        logsole.log("rchat.deno.ts close acknowledgement received");
        ws.end();
        //del();
    }
}

export default async function(socket, url, get, opt){
    del();
}
export async function init({client,socket}:HttpSocket|PseudoHttpSocket, url: SpecialURL, get, opt, dele, self, imports){
    del=dele
    imp=imports;
    ;
    if(client.headers["upgrade"]=="websocket"){
        console.log("ws.deno.ts websocket upgrade");
        let ws=await socket.websocket();
        //if(w)ws=w;
        if(!ws) return console.log("ws.deno.ts couldnt upgrade");

        console.log("ws.deno.ts upgraded connection",ws);
        ws.on("frame",f=>handler(ws,f));

    }else{
        await socket.close("WS only"); 
    }

    del();
    //await socket.writeText("hello");
    //await socket.close(); 
}
async function genRes(){
    let res="";
    logsole.log("ollama.deno.ts",messages);
    try{
        const st=await imp.ollama.chat({
            stream: true,
            model: "deepseek-r1:1.5b",
            messages,
        });
        logsole.log("ollama.deno.ts stream", st);
        //logsole.log("ollama.deno.ts socket", socket.writeText);
        for await(let part of st){
            let str=part?.message?.content||"";
            //logsole.log("ollama.deno.ts response part",part?.message);
            res+=str;
            //socket.writeText(str);
        };
        logsole.log("ollama.deno.ts generated response",res);
        logsole.log("ollama.deno.ts stream", st);
        //socket.close("\n");
        messages.push({role:"assistent",content:res});
        return res;
    } catch(err){
        logsole.error("ollama.deno.ts",err);
        return res;
    }
}