import Engine from "./engine.ts";

const engine: Engine=new Engine();
engine.port=80;
engine.host="0.0.0.0";
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

        h2c.on("error",console.error);
        h2c.on("stream",async function(stream:Http2Stream){
            console.log(stream);

            stream.setHeader("content-type","text/plain");
            await stream.close("Hello, world!");
        })
    } else {
        if(client.path=="/"){
            socket.close("Hello, world!");
        }
    }
});
engine.on("error",console.error);
engine.start();
console.log("listening");