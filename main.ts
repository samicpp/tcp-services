import {Engine,setOpt} from './engine.ts';
import * as http from './http-server.ts';
import "./docs.d.ts";
import "./lib.deno.d.ts";
import * as Logsole from './console.ts';
//import "jsr:@std/dotenv/load";
const deno=Deno; // mitigate error messages in vscode

let logcatPath=deno.env.get("logcatfile");

//Error.stackTraceLimit = 1000;

setOpt("debug",false);
setOpt("eventDbg",false);

let args:{
    opt:Record<string,string[]>;
    sopt:string;
    lopt:string[];
}={
    opt:{},
    sopt:'',
    lopt:[],
};
let nopt:string='';
for(let a of deno.args){
    if(nopt){
        //args.opt[nopt.replace("--","")]=a;
        //nopt="";
    } else if(a.startsWith("--")&&a.length>2){
        let l=a.split("=");
        let fl=l[0].replace("--","");
        if(!args.opt[fl])args.opt[fl]=[String(l[1])];
        else args.opt[fl].push(String(l[1]));
        //nopt=a
    }
    else if(a.startsWith("-")&&a.length>1)args.sopt+=a.replace("-","");
    else{args.lopt.push(a)}
}

const tc={
    e:TextEncoder.prototype.encode.bind(new TextEncoder),
    d:TextDecoder.prototype.decode.bind(new TextDecoder),
};

const [logfile,logsole]=Logsole.default(logcatPath);
await logfile.ready;
/*const logfile=new class Logcat{
    stream; writer; ready;
    constructor(){
        this.ready=this.#init();
    }
    async#init(){
        let err;
        const logfstream = await deno.open(logcatPath||"./logcat.log", {
            create: true,
            append: true,
        }).catch(e=>err=e);
        if(err){
            this.write=
            this.log=(...a)=>new Promise(r=>r(a));
            return false
        }
        this.stream=logfstream;
        const logfile = logfstream.writable.getWriter();
        this.writer=logfile;
        await logfile.ready;
    }
    async write(text){ return await this.writer.write(tc.e(text)).catch(e=>e); };
    log(reason,msg){return this.write(`[${reason}] ${msg}\0\r\n`)};
};
await logfile.ready;
let keys=Object.keys(Object.getOwnPropertyDescriptors(console));
console.allow=true;
wraploop:for(let p of keys){
    //console.log(p);
    if(typeof console[p]!="function"){continue wraploop}; // label not needed
    console["_"+p]=console[p];
    let f=console[p].bind(console);
    console[p]=async function(...args){
        try{
            let s:string[]=[];
            for(let i in args){ 
                if(typeof args[i]=="string"&&!i)s.push(String(args[i]));
                else s.push(String(deno.inspect(args[i])));
            };
            logfile.log(p,s.join(" "));
            //await logfile.write(tc.e(`[${p}] ${s.join(" ")}\r\n`));
        } catch (err) {
            console._error("logfile write failed because",err);
        }

        try{
            if(console.allow)console["_"+p](...args);
        }catch(err){
            console._error("console invokation failed because",err);
        }
    };
};*/


//console.log(tlsopt);

// ---------start-----------
await logfile.write('\r\n');
await logfile.log("system",`start of ${import.meta.url}`);
//console.log("\r\nstart");

//console.log("options",args);

if(args.opt.help)logsole.log()

let ports=args.opt.http||[];
let sports=args.opt.https||[];
let dports=args.opt.dyn||[];
let silent=args.opt.silent||args.sopt.includes("s");

logsole.allow=!silent;


let allPerms=0;[
    deno.permissions.querySync({ name: "net" }),
    deno.permissions.querySync({ name: "env" }),
    deno.permissions.querySync({ name: "read" }),
    deno.permissions.querySync({ name: "write" }),
].forEach(e=>allPerms+=e.state=="granted");

if(allPerms!=4){
    logsole.error(`need net, env and file permissions`);
    deno.exit(1);
}


let tlsopt: TlsOptions={
    key: await deno.readTextFile(deno.env.get("keyfile")).catch(e=>""),
    cert: await deno.readTextFile(deno.env.get("certfile")).catch(e=>""),
    ca: await deno.readTextFile(deno.env.get("cafile")).catch(e=>""),
    alpnProtocols: ["h2","http/1.1"],
};


const tcp: Engine=new Engine();
for(let port of ports)tcp.start(parseInt(port));
tcp.tls=tlsopt;
for(let sport of sports)tcp.start(parseInt(sport));
tcp.proxied=true;
tcp.intTlsOpt=tlsopt;
for(let dport of dports)tcp.proxy(parseInt(dport));
tcp.on("nulldata",e=>logsole.log("no data"));
tcp.on("error",e=>logsole.error(e));
// http2, should also make it a cli option
tcp.on("connect",async({socket,client}:HttpSocket)=>{
    if(client.isValid&&client.headers.upgrade?.includes("h2c")){
        const h2c=await socket.http2();
        if(h2c){
            http.listener2(h2c);
            console.log("using http2");
            return;
        } else {
            console.log("couldn't upgrade to http2");
            //socket.deny();
            return;
        }
    } else {
        http.listener(socket);
        console.log("using http1.1");
    };
});
tcp.on("http2",http.listener2);
tcp.upgrade=true;

logsole.log('pid: ',deno.pid);
await deno.writeTextFile("last-pid.txt", deno.pid);

let lastBeat=Date.now();
setInterval(()=>{
    let t=Date.now();
    logsole.log("keep alive",t-lastBeat);
    lastBeat=t;
},1*60*60*1000);

/*
;(async e=>{
    for await (const c of deno.stdin.readable) {
        try{
            deno.stdout.write(tc.e(deno.inspect(eval(tc.d(c)))+"\r\n"));
        } catch(err){
            deno.stdout.write(tc.e(deno.inspect(err)+"\r\n"));
        };
    };
})();// */

logsole.log("main.ts finish",new Date());