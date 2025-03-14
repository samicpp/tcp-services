//import "../../../../library.d.ts";
import cinit from "../../../../console.ts";
const [logfile,logsole]=cinit();
let del:Function;
let visits=0;
let imp;
export default async function(socket, url, get, opt){
    del();
}
export async function init(socket, url, get, opt, dele, self, imports){
    del=dele
    imp=imports;
    socket.setHeader("Content-Type","text/plain");
    let sleep=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<5;i++){
        logsole.log("chunk.deno.ts",await socket.writeText("i="+i.toString()+"\n"));
        await sleep(500);
    };
    socket.close("6")
    del();
}