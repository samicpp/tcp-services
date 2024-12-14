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

let allPerms=0;[
    deno.permissions.querySync({ name: "net", host: "80" }),
    deno.permissions.querySync({ name: "net", host: "443" }),
    deno.permissions.querySync({ name: "read" }),
].forEach(e=>allPerms+=e.state=="granted");

if(allPerms!=3){
    console.error("need all permissions");
    deno.exit(1);
}

const logfstream = await deno.open("./logcat.out", {
    create: true,
    append: true,
});
const logfile = logfstream.writable.getWriter();
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
            await logfile.write(tc.e(`[${p}] ${s.join(" ")}\r\n`));
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

let tlsopt: TlsOptions={
    key: deno.readTextFileSync("D:\\privkey.pem"),
    cert: deno.readTextFileSync("D:\\fullchain.pem"),
    ca: deno.readTextFileSync("D:\\chain.pem"),
};
//console.log(tlsopt);

// ---------start-----------
await logfile.write("\r\nstart of main.ts").catch(e=>console.error(e));

console.log("options",args);
let ports=args.opt["http-port"]||[80];
let sports=args.opt["https-port"]||[443];
let silent=args.opt.silent||args.sopt.includes("s");

console.allow=!silent;

const tcp: Engine=new Engine();
for(let port of ports)tcp.start(parseInt(port));
for(let sport of sports)tcp.start(parseInt(sport), tlsopt);
tcp.on("connect",http.listener);
tcp.on("null data",e=>console.log("no data"));

console.log('pid: ',deno.pid);
await deno.writeTextFile("last-pid.txt", deno.pid);