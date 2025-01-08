const deno=Deno;
const tc={
    e:TextEncoder.prototype.encode.bind(new TextEncoder),
    d:TextDecoder.prototype.decode.bind(new TextDecoder),
};

let logcatPath:string;
export function setLogPath(p:string){ logcatPath=p };

export class Logcat{
    stream; writer; ready;
    logcatPath;
    constructor(lcp){
        this.ready=this.#init(lcp);
        this.logcatPath=lcp;
    }
    async#init(logcatPath){
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

//let consoleKeys=Object.keys(Object.getOwnPropertyDescriptors(console));
export class LogcatConsole extends Proxy{
    #logcat:Logcat; allow:boolean;
    constructor(logcat:Logcat){
        super(console,{get(o,p){
            if(typeof o[p]!="function"||["Console"].includes(p))return o[p];
            return async function(...args){
                try{
                    let s:string[]=[];
                    for(let i in args){ 
                        if(typeof args[i]=="string"&&!i)s.push(String(args[i]));
                        else s.push(String(deno.inspect(args[i])));
                    };
                    logcat.log(p,s.join(" "));
                    //await logfile.write(tc.e(`[${p}] ${s.join(" ")}\r\n`));
                } catch (err) {
                    console.error("logfile write failed because",err);
                }
        
                try{
                    console[p](...args);
                }catch(err){
                    console.error("console invokation failed because",err);
                }
            };
        }});
        this.#logcat=logcat;
    }
}

let logcat:Logcat;
let logsole:LogcatConsole;
export default function setup(logPath){
    if(logcat&&logsole){
        logcat=new Logcat(logPath);
        logsole=new LogcatConsole(logcat);
    }
    return [logcat,logsole];
}