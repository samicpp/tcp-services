import cinit from "../../../console.ts";
const [logfile,logsole]=cinit();
let del:Function;
let visits=0;
let imp;
let messages:{role:string,content:string}[]=[];
export default async function(socket, url, get, opt){
    //await socket.writeText(res);
    //await socket.close(res); 
    socket.setHeader("Content-Type","text/plain");
    let prompt=url.hash.replace('#',"")||"hello";
    prompt=decodeURIComponent(prompt);
    messages.push({role:"user",content:prompt});
    let res=await genRes(socket);
    messages.push({role:"assistant",content:res});
    visits++;
    if(visits>2)del();
}
export async function init(socket:HttpSocket|PseudoHttpSocket, url: SpecialURL, get, opt, dele, self, imports){
    del=dele
    imp=imports;
    socket.setHeader("Content-Type","text/plain; charset=utf-8");
    let prompt=url.hash.replace('#',"")||"hello";
    prompt=decodeURIComponent(prompt);
    messages.push({role:"user",content:prompt});
    let res=await genRes(socket);
    messages.push({role:"assistant",content:res});
    //del();
    //await socket.writeText("hello");
    //await socket.close(); 
}
async function genRes(socket:HttpSocket|PseudoHttpSocket){
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
            await socket.writeText(str);
        };
        logsole.log("ollama.deno.ts generated response",res);
        logsole.log("ollama.deno.ts stream", st);
        socket.close("\n");
        return res;
    } catch(err){
        logsole.error("ollama.deno.ts",err);
        return res;
    }
}