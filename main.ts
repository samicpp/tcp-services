import { Engine, EngineLib, setOpt } from './engine/mod.ts';
import * as http from './http-server.tsx';
import "./engine/library.d.ts";
//import "./engine/lib.engine.d.ts";
import "./lib.deno.d.ts";
import * as Logsole from './console.ts';
//import { Engine } from './engine/mod.ts';
//import "jsr:@std/dotenv/load";

const deno = Deno; // mitigate error messages in vscode
const engine:Engine=EngineLib;
//const {setOpt}=engine;
Engine

let logcatPath = deno.env.get("logcatfile");
const [logfile, logsole] = Logsole.default(logcatPath);
await logfile.ready;

const tc = {
    e: TextEncoder.prototype.encode.bind(new TextEncoder),
    d: TextDecoder.prototype.decode.bind(new TextDecoder),
};

//Error.stackTraceLimit = 1000;

setOpt("debug", false);
setOpt("eventDbg", false);

/**/await deno.stat("./.env").then(f => {
    if (!f.isFile) {
        logsole.fatal(new Error(".env isn't a file"));
        deno.exit(2);
    }
}).catch(err => {
    logsole.error(err);
    // write default env

    deno.env.set("envonly", "0");
    deno.env.set("usetls", "0");

    deno.env.set("http", "8080");

    /*Deno.writeFile(
        ".env",
        tc.e('# main.ts\nenvonly="1"\n\ndyn=""\nhttp="8080"\nhttps=""\n\nsilent="0"\n\nuseTls="0"\nkeyfile=""\ncertfile=""\ncafile=""\nalpn=""\n\nlogcatfile="./logcat.log"\n\n# http-server.ts\nopenai_key=""\n\ndissallow=".no;.not"')
    ).then(async r=>{
        logsole.info("created env file",r);
        await import("jsr:@std/dotenv/load");
    }).catch(err=>{
        logsole.fatal(err);
        Deno.exit(1);
    });*/
});//*/

let args: {
    opt: Record<string, string[]>;
    sopt: string;
    lopt: string[];
} = {
    opt: {},
    sopt: '',
    lopt: [],
};
let nopt: string = '';
for (let a of deno.args) {
    if (nopt) {
        //args.opt[nopt.replace("--","")]=a;
        //nopt="";
    } else if (a.startsWith("--") && a.length > 2) {
        let l = a.split("=");
        let fl = l[0].replace("--", "");
        if (!args.opt[fl]) args.opt[fl] = [String(l[1])];
        else args.opt[fl].push(String(l[1]));
        //nopt=a
    }
    else if (a.startsWith("-") && a.length > 1) args.sopt += a.replace("-", "");
    else { args.lopt.push(a) }
}




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
await logfile.log("system", `start of ${import.meta.url}`);
//console.log("\r\nstart");

//console.log("options",args);


if (args.opt.help) logsole.log();

let envOnly = parseInt(deno.env.get("envonly") || "0");


let ports = envOnly ? (deno.env.get("http")?.split(";") || []) : (args.opt.http || []);
let sports = envOnly ? (deno.env.get("https")?.split(";") || []) : (args.opt.https || []);
let dports = envOnly ? (deno.env.get("dyn")?.split(";") || []) : (args.opt.dyn || []);
let silent = envOnly ? parseInt(deno.env.get("silent") || "0") : (args.opt.silent || args.sopt.includes("s"));

if (ports[0] === "") ports = [];
if (sports[0] === "") sports = [];
if (dports[0] === "") dports = [];

logsole.allow = !silent;

logsole.log(ports, sports, dports, silent);

/*let allPerms = 0;[
    deno.permissions.querySync({ name: "net" }),
    deno.permissions.querySync({ name: "env" }),
    deno.permissions.querySync({ name: "read" }),
    deno.permissions.querySync({ name: "write" }),
].forEach(e => allPerms += e.state == "granted" ? 1 : 0);

if (allPerms != 4) {
    logsole.error(`need net, env and file permissions`);
    deno.exit(1);
}*/

let useTls = parseInt(deno.env.get("useTls") || "0");


let tlsopt: TlsOptions;
if (useTls) {
    tlsopt = {
        key: await deno.readTextFile(deno.env.get("keyfile") || "").catch(e => ""),
        cert: await deno.readTextFile(deno.env.get("certfile") || "").catch(e => ""),
        ca: await deno.readTextFile(deno.env.get("cafile") || "").catch(e => ""),
        alpnProtocols: deno.env.get("alpn")?.split(";"),
    };
} else {
    tlsopt = {
        key: "",
        cert: "",
    };
}



const tcp = engine;
tcp.setTls(tlsopt);
//tcp.tls=(tlsopt);
for (let port of ports) tcp.start(parseInt(port), false);
for (let sport of sports) tcp.start(parseInt(sport), true);
for (let dport of dports) tcp.proxy(parseInt(dport));
//tcp.intTlsOpt=tlsopt;
//tcp.proxied=true;
//tcp.intTlsOpt=tlsopt;
tcp.on("nulldata", e => logsole.log("no data"));
tcp.on("error", e => logsole.error(e));
// http2, should also make it a cli option
tcp.on("connect", async ({ socket, client }: HttpSocket) => {
    if (client && client.isValid && client.headers.upgrade?.includes("h2c")) {
        const h2c = await socket.http2();
        if (h2c) {
            http.listener2(h2c);
            logsole.log("using http2");
            return;
        } else {
            logsole.warn("couldn't upgrade to http2");
            //socket.deny();
            return;
        }
    } else {
        http.listener(socket);
        logsole.log("using http1.1");
    };
});
tcp.on("http2", http.listener2);
//tcp.allowH2 = true;

logsole.info('pid: ', deno.pid);
await deno.writeTextFile("last-pid.txt", deno.pid.toString());

let lastBeat = Date.now();
setInterval(() => {
    let t = Date.now();
    logsole.debug("keep alive", t - lastBeat);
    lastBeat = t;
}, 1 * 60 * 60 * 1000);

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
//logsole.levels.splice(logsole.levels.indexOf("log"),1);
//logsole.levels=["debug","debug2","info","log","log2","log3","warn","warn2","error","error2"];
//logsole.levels=["log","error","fatal"];
logsole.levels = deno.env.get("loglevels")?.split(";") || logsole.levels;
if (true) {
    globalThis.logsole = logsole;
    //globalThis.Engine = Engine;
    globalThis.engine = tcp;
    globalThis.http = http;
}


logsole.info("main.ts finish", new Date());