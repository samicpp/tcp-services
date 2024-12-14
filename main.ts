import Engine from './engine.ts';
import * as http from './http-server.ts';
import docs from "./docs.d.ts";
const deno=Deno; // mitigate error messages in vscode

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
        args.opt[nopt.replace("--","")]=a;
        nopt="";
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

const logfile=new class Logcat{
    stream; writer; ready;
    constructor(){
        this.ready=this.#init();
    }
    async#init(){
        let err;
        const logfstream = await deno.open("./logcat.log", {
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
    if(["indentLevel"].includes(p))continue wraploop; // label not needed
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
};


//console.log(tlsopt);

// ---------start-----------
await logfile.write('\r\n');
await logfile.log("system",`start of ${import.meta.url}`);
//console.log("\r\nstart");

//console.log("options",args);

if(args.opt.help)console.log()

let ports=args.opt["http-port"]||[80];
let sports=args.opt["https-port"]||[443];
let silent=args.opt.silent||args.sopt.includes("s");

console.allow=!silent;


let allPerms=0;[
    deno.permissions.querySync({ name: "net" }),
    deno.permissions.querySync({ name: "read" }),
].forEach(e=>allPerms+=e.state=="granted");

if(allPerms!=2){
    console.error(`need net and file read permissions`);
    deno.exit(1);
}


let tlsopt: TlsOptions={
    key: deno.readTextFileSync("D:\\privkey.pem"),
    cert: deno.readTextFileSync("D:\\fullchain.pem"),
    ca: deno.readTextFileSync("D:\\chain.pem"),
};

const tcp: Engine=new Engine();
for(let port of ports)tcp.start(parseInt(port));
for(let sport of sports)tcp.start(parseInt(sport), tlsopt);
tcp.on("connect",http.listener);
tcp.on("null data",e=>console.log("no data"));

console.log('pid: ',deno.pid);
await deno.writeTextFile("last-pid.txt", deno.pid);