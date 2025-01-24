import Engine from "./engine.ts";
import "./docs.d.ts";

const engine: Engine=new Engine();
engine.port=80;
engine.host="0.0.0.0";
engine.upgrade=true;
engine.on("connect",async function({socket,client}: HttpSocket): Promise<void>{
    console.log(client);

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
        if(client.path=="/"){
            socket.close("Hello, world!");
        }
    }
});
engine.on("http2",h2cHandler);
async function h2cHandler(h2c:Http2Socket){
    let r=await h2c.ready;
    console.log("h2c",r);
    h2c.on("error",console.error);
    h2c.on("stream",async function(stream:Http2Stream){
        console.log(stream);

        //stream.status=200;
        stream.setHeader("content-type","text/plain");
        await stream.close("Hello, world!");
    });
    h2c.on("close",c=>console.warn(c));
}
engine.on("error",console.error);
engine.start();
console.log("listening");

globalThis.engine=engine;
