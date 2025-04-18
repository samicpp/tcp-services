import Engine from "./engine/mod.ts";
const engine=Engine;


engine.on("connect",async function({socket,client}: Engine.HttpSocket): Promise<void>{
    console.log(client);
    if(!client)return;

    if(!client.isValid){
        socket.status=400;
        socket.statusMessage="Bad Request";
        socket.close("Cannot read client request");
    } else if(client.headers.upgrade?.includes("h2c")){
        const h2c=await socket.http2();
        console.log(h2c,socket);
        if(!h2c)return socket.deny();

        h2cHandler(h2c);
    } else if(client.headers.upgrade?.includes("websocket")){
        const ws=await socket.websocket();
        console.log(ws,socket);
        if(!ws)return socket.close();

        ws.on("frame",async(f:WsFrame)=>{ws.sendText(`${f.opcode}: ${new TextDecoder().decode(f.payload)}`)});
    } else {
        handler(socket);
    }
});
engine.on("http2",h2cHandler);
async function handler(sock:Engine.HttpSocket|Engine.PseudoHttpSocket){
    sock.setHeader("Content-Type","text/plain");
    sock.close(JSON.stringify(sock.client));
};
async function h2cHandler(socket: Engine.Http2Socket){
    socket.on("error",console.error);
    await socket.ready;
    console.log("http2");
    socket.on("stream",async function(stream:Engine.Http2Stream){
      console.log("http2 stream");
      const ps=stream.pseudo();
      handler(ps);
    })
};
engine.on("error",console.error);
engine.start(8080);
console.log("listening");

globalThis.engine=engine;
