import * as engine from "./engine/mod.ts";

engine.on("connect",async function({socket,client}: HttpSocket): Promise<void>{
    console.log("connect",client);

    if(!client.isValid){
        socket.status=400;
        socket.statusMessage="Bad Request";
        socket.close("Cannot read client request");
    } else if(client.headers.upgrade?.includes("h2c")){
        console.log("h2c");
        const h2c=await socket.http2();
        console.log(h2c,socket);
        if(!h2c)return socket.deny();

        h2cHandler(h2c);
    } else if(client.headers.upgrade?.includes("websocket")){
        console.log("ws");
        const ws=await socket.websocket();
        console.log(ws,socket);
        if(!ws)return socket.close();

        ws.on("frame",async(f:WsFrame)=>{ws.sendText(`${f.opcode}: ${new TextDecoder().decode(f.payload)}`)});
    } else {
        console.log("plain");
        handler(socket);
    }
});
engine.on("http2",h2cHandler);
async function handler(sock:HttpSocket|PseudoHttpSocket){
    console.log("http1");
    sock.setHeader("Content-Type","text/plain");
    sock.close(JSON.stringify(sock.client,null,2));
};
async function h2cHandler(socket: Http2Socket){
    socket.on("error",console.error);
    await socket.ready;
    console.log("http2");
    socket.on("stream",async function(stream:Http2Stream){
      console.log("http2 stream");
      const ps=stream.pseudo();
      handler(ps);
    })
};
engine.on("error",console.error);
engine.start(8080);
console.log("listening 8080");

engine.setTls({
    key:Deno.readTextFileSync("localhost.key"),
    cert:Deno.readTextFileSync("localhost.crt"),
    alpn:["h2","http1"]
});
engine.start(1443,true);
console.log("listening 1443");

globalThis.engine=engine;
