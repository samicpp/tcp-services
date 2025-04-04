import "./lib.deno.d.ts";
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
    async#init(logcatPath?:string){
        let err;
        const logfstream = await deno.open(logcatPath||"./logcat.log", {
            create: true,
            append: true,
        }).catch(e=>err=e);
        if(err){
            this.write=(...a)=>new Promise(r=>r(a));
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
export class LogcatConsole{
    #logcat:Logcat; allow:boolean=true;
    #proxy; levels:string[]=["debug","debug2","info","log","log2","log3","warn","warn2","error","error2"];
    constructor(logcat:Logcat){
        this.#logcat=logcat;
        const th=this;
        this.#proxy=new Proxy(console,{get(o,p){
            if((typeof o[p]!="function"||["Console"].includes(p.toString()))&&o[p]!=null)return o[p];
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
                    let sp=p.toString();
                    if(th.allow&&th.levels.includes(sp)){
                        if(console[p])console[p](...args);
                        else if(sp.startsWith("warn")){
                            console.warn(...args);
                        }else if(sp.startsWith("debug")){
                            console.debug(...args);
                        }else if(sp.startsWith("error")){
                            console.error(...args);
                        }else if(p=="fatal"){
                            console.error("Uncaught ",...args);
                        }else{
                            console.log(...args);
                        };
                    }
                }catch(err){
                    console.error("console invokation failed because",err);
                }
            };
        }});
    }


    get log(){return this.#proxy.log}
    get log2(){return this.#proxy.log2}
    get log3(){return this.#proxy.log3}
    get info(){return this.#proxy.info}
    get warn(){return this.#proxy.warn}
    get warn2(){return this.#proxy.warn2}
    get debug(){return this.#proxy.debug}
    get error(){return this.#proxy.error}
    get fatal(){return this.#proxy.fatal}
    get error2(){return this.#proxy.error2}
}

let logcat:Logcat;
let logsole:LogcatConsole;
export default function setup(logPath?:string):[Logcat,LogcatConsole]{
    if(!logcat&&!logsole){
        logcat=new Logcat(logPath);
        logsole=new LogcatConsole(logcat);
    }
    return [logcat,logsole];
}