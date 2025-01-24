import mime from "./mime-types.json" with { type: "json" };
import docs from "./docs.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import * as canvas from "https://deno.land/x/canvas/mod.ts";
import ollama from "npm:ollama";
import * as pdflib from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import * as pug from "https://deno.land/x/pug/mod.ts";
import LS from "./console.ts";

  

function envget(name:string,def:any=null):any{
  return Deno.env.has(name)?Deno.env.get(name):def;
}
const [logcat,logsole]=LS();
const AsyncFunction=(async function(){}).constructor;
const te=new TextEncoder();
const td=new TextDecoder();
const openAI = new OpenAI({apiKey:envget("openai_key")});
const dyn={};
const aid={};
const imports={openAI,canvas,OpenAI,ollama,pdflib,pug,LogSetup:LS,logsole,logcat};
const caches:Record<string,{date:number,content:string|Uint8Array,headers:Record<string,string>,status:number,statusMessage:string}>={};
const fcaches:Record<string,{date:number,buffer:Uint8Array}>={};
const cacheTime:number=10_000;
const dissallow:string[]=envget("dissallow",[]).split(";");

function cache(get,socket:HttpSocket){
  let d=Date.now();
  //logsole.log("looking for cache",caches[get]?.date<Date.now()-cacheTime);
  if(caches[get]&&caches[get].date>d-cacheTime){
    for(let [k,v] of Object.entries(caches[get].headers))socket.setHeader(k,v);
    socket.status=caches[get].status;
    socket.statusMessage=caches[get].statusMessage;
    socket.close(caches[get].content);
    logsole.log("using caches for response",caches[get].content.length);
    return true;
  } else return false;
};
async function readf(get){
  let d=Date.now();
  if(fcaches[get]&&fcaches[get].date>d-cacheTime){
    logsole.log("caching file");
    return fcaches[get].buffer;
  } else {
    const buffer = await Deno.readFile(get);
    fcaches[get] = {date:d,buffer};
    return buffer;
  }
};
const readfText=g=>readf(g).then(b=>td.decode(b));

export async function listener2(socket: Http2Socket){
  socket.on("error",console.error);
  let suc=await socket.ready;
  if(!suc)console.warn("ready not successful",socket);
  console.log("http2",socket);
  socket.on("stream",async function(stream:Http2Stream){
    console.log(stream);

    //stream.status=200;
    stream.setHeader("content-type","text/plain");
    await stream.close("Hello, world!");
  })
};
export async function listener({socket,client}: HttpSocket){
    socket.on("error",console.error);
    //console.log(socket.enabled);
    let proxied=false;
    let isValid=client.isValid;
    console.log(client);
    /*if(!client.isValid){
      socket.status=400;
      socket.statusMessage="Bad Request";
      socket.close("Cannot read client request");
      return; //socket.deny();
    }*/
    if(isValid&&client.headers.upgrade?.includes("h2c")){
      const h2c=await socket.http2();
      if(h2c){
        listener2(h2c);
        console.log("letting http2 handler take over");
        return;
      } else {
        console.log("couldn't upgrade");
        //socket.deny();
        return;
      }
    }
    if(client.address.hostname=="127.0.0.1"&&client.headers["x-real-ip"]){
        proxied=true;
    }
    //logsole.log("incoming connection",socket);
    //logsole.log("client",client)
    //await socket.writeText(client.method+" request at "+client.path);
    //socket.close("\r\n");

    async function exists(get){
      return await Deno.stat(get).catch(e=>null);
    };

    logsole.log("socket client isValid",socket.client.isValid);
    let url;
    class SpecialURL extends URL{
      defdir="http";
      tardir="0";
      router;
      get getStart(){return `./${this.defdir}/${this.tardir}`};
      ready: Promise<void>;
      constructor(...args: any[]){
        super(args[0].replace("::","#"));
        let t=this;
        this.ready=async function(){
          const json = JSON.parse(await readfText(t.defdir+"/config.json"));
          
          let tar=json[t.origin];
          let dtar=json.default;
          let utar=tar||dtar;

          logsole.log("utar",utar);
          t.tardir=utar.dir;
          let rstat=await exists(`${t.defdir}/${utar.dir}/${utar.router}`);

          if(rstat){
            t.router=utar.router;
            logsole.log("router present",t.router);
          };
        }().catch(e=>e);
      }
    };
    try{url=new SpecialURL(`${proxied?client.headers["x-scheme"]:(socket.type=="tcp::tls"?"https":"http")}://${proxied?client.headers["x-forwarded-host"]:client.headers.host}${client.path}`);}catch(err){logsole.error(err);isValid=false};
    if(!isValid)url=new SpecialURL(`about:blank#invalid`);
    
    logsole.log(url.toString());
    logsole.log(client.address)
    

    async function e403(get:string,err:Error){
      let eget=url.getStart+"/errors/403.dyn.html";
      logsole.log(err);
      let stat=await exists(eget);
      socket.status=403;
      socket.statusMessage="Permission Denied";
      if(!stat){
        await socket.close("error");
      } else {
        await file(eget,{get,err});
      }
    }
    async function e404(get:string): Promise<void>{
      let eget=url.getStart+"/errors/404.dyn.html";
      logsole.log("file doesnt exist");
      let stat=await exists(eget);
      logsole.log(stat);
      socket.status=404;
      socket.statusMessage="Not found";
      if(!stat){
        await socket.close(url.pathname+" not found\n");
      } else {
        await file(eget,{get});
      }
      //socket.close();
    };
    async function e409(get:string){
      let eget=url.getStart+"/errors/409.dyn.html";
      let stat=await exists(eget);
      socket.status=409;
      socket.statusMessage="Conflict";
      if(!stat){
        await socket.close("conflict");
      } else {
        await file(eget,{get});
      }
      //socket.close();
    };
    async function e400(){
      let eget=url.getStart+"/errors/400.dyn.html";
      let stat=await exists(eget);
      socket.status=409;
      socket.statusMessage="Conflict";
      if(!stat){
        await socket.close("conflict");
      } else {
        await file(eget,{});
      }
      //socket.close();
    };
    async function e500(get:string,err:Error){
      let eget=url.getStart+"/errors/500.dyn.html";
      logsole.log(err);
      let stat=await exists(eget);
      socket.status=500;
      socket.statusMessage="Internal Server Error";
      if(!stat){
        await socket.close("error");
      } else {
        await file(eget,{get,err});
      }
    }

    //async function httpErr(status:){}

    async function directory(get:string): Promise<void>{
      logsole.log("file is directory")
        /*socket.status=400;
        socket.statusMessage="Conflict";
        await socket.writeText(get+" is directory\n");
        socket.close();*/
        const dirs: any[] = [];
        let lookfor: string[]=["index."]
        let getDirs=get.split("/");
        if(getDirs[getDirs.length-1])lookfor.push(getDirs[getDirs.length-1]);
        let match={isFile:false,name:""};

        logsole.log("lookfor",lookfor);
        logsole.log("dirs",dirs);

        for await (const dir of Deno.readDir(get)) {
          dirs.push(dir);

          for(let l of lookfor){
            if(dir.name.startsWith(l)&&!dir.isDirectory)match=dir;
          }

        };

        if(!match?.isFile){
          logsole.log("cant find file",dirs);
          return e409(get);
        } else {
          let nget=get+"/"+match.name;
          logsole.log("found file",match.name);
          return file(nget)
        }
    };
    async function file(get:string,opt?:object): Promise<void>{
      try{
        if(cache(get,socket))return;

        const bytes = await readf(get);
        let last=get.replace(/.*\//,"");
        logsole.log("file found",bytes.byteLength);
        let ext=last.split(".");
        let lext=ext[ext.length-1];
        let dct=mime[""+lext];
        let dynamic=false;
        let isJss=/.*\.dyn\.[a-z]+/.test(last);
        let stop=false;

        async function jss(content,opt?){
          return await AsyncFunction("socket,url,get,opt,deno,imports",`return \`${content.replaceAll("`","\\`")}\`;`)(socket,url,get,opt,Deno,imports);
        }

        for(let d of dissallow){
          if(last.endsWith(d)){
            await e403(get,new Error("file not allowed"));
            stop=true;
            break;
          }
        }

        if(stop){
          logsole.log("stop is true");
        }else if(last.endsWith(".deno.ts")){
          logsole.log("importing deno thing",get);
          dynamic=true;
          if(dyn[get]?.state&&dyn[get].state?.active){
            new Promise(r=>r(dyn[get].mod.default(socket,url,get,opt))).catch(e=>logsole.error(e));
          } else {
            let mod=await import(get+"?d="+Date.now()); //anti chacheing
            //await new Promise(r=>r(mod.default(socket,url,get)));
            dyn[get]={mod,state:{...mod.state}};
            dyn[get].state.active=true;
            new Promise(r=>r(mod.init(socket,url,get,opt,()=>{dyn[get].state.active=false},dyn[get],imports))).catch(e=>{logsole.error(e);dyn[get].state.active=false});
          };
        }else if(last.endsWith(".async.js")){
          logsole.log("executing js code");
          dynamic=true;
          let t=td.decode(bytes);
          let f=AsyncFunction("socket,url,get,opt,deno,imports",t);
          f(socket,url,get,opt,Deno,imports);
        }else if(last.endsWith(".pug")){
          logsole.log("compiling pug file")
          let t=td.decode(bytes);
          if(isJss){
            logsole.log("also executing as js multiline string");
            t=await jss(t,opt);
          };
          let h=pug.compile(t);
          socket.setHeader("Content-Type","text/html");
          await socket.close(h);
        }else if(isJss&&dct){
          logsole.log("parsing as js multiline string");
          let t=td.decode(bytes);
          let r=await jss(t,opt);
          socket.setHeader("Content-Type",dct);
          await socket.close(r);
          //caches[get]={date:Date.now(),content:r,headers:socket.headers()};
        }else if(last.endsWith(".proxy.json")){
          logsole.log("proxying the connection");
          let json=JSON.parse(td.decode(bytes));
          let headers;
          let method;
          let body;
          if(json.request.proxied){
            headers=client.headers;
            method=client.method;
            body=client.data;
          } else {
            headers=json.request.headers||{};
            method=json.request.method||{};
            body=json.request.body||'';
          };
          logsole.log("proxying to "+json.url);
          let res=await fetch(json.url,{method,headers,body:(method=="GET"||method=="HEAD"?undefined:body)});
          let text=await res.clone().text();
          if(json.response.proxied){
            socket.status=res.status;
            res.headers.forEach(([v,n])=>socket.setHeader(v,n));
          } else {
            socket.status=json.status||200;
            let h=json.response.headers||{};
            for(let i in h)socket.setHeader(i,h[i]);
          };
          let rtext=text;
          if(json.response.replace){
            let r=json.response.replace||{};
            for(let i in r){
              try{
                let reg=new RegExp(i,"gs");
                rtext=rtext.replaceAll(reg,r[i]);
              } catch(err){
                logsole.error(err);
                rtext=rtext.replaceAll(i,r[i]);
              }
            }
          };
          await socket.close(rtext);
          //caches[get]={date:Date.now(),content:rtext,headers:socket.headers()};
        }else if(last.endsWith(".link")){
          logsole.log("following link to",td.decode(bytes));
          await handler(td.decode(bytes));
        }else if(last.endsWith(".ai.json")){
          logsole.log("using ai for content");
          let ai=aid[get];
          const json=JSON.parse(td.decode(bytes));
          logsole.log("ai exist",!!ai);
          if(!ai||ai.done){
            ai=aid[get]={};
            if(json.type=="openai"){
              const pro = openAI.chat.completions.create({
                messages: json.opt.messages,
                model: json.opt.model,
              }).catch(e=>e);
              ai.done=false;
              ai.ready=false;
              ai.pro=pro;
              const chat=await pro;
              ai.res=chat;
              ai.json=json;
              ai.ready=true;
              ai.content=chat.choices[0].message.content;
              //ai=aid[get]={res:chat,json,done:false,content:chat.choices[0].message.content};
            }else if(json.type=="ollama"){
              const pro = ollama.chat({
                model: json.opt.model,
                messages: json.opt.messages,
              }).catch(e=>e);
              ai.done=false;
              ai.ready=false;
              ai.pro=pro;
              const chat=await pro;
              ai.res=chat;
              ai.json=json;
              ai.ready=true;
              ai.content=chat.message.content;
              //ai=aid[get]={res:chat,json,done:false,content:chat.message.content};
            };
          };
          logsole.log("ai",ai);
          if(!ai.ready)await ai.pro;
          if(ai&&!ai.res.stack){
            for(let [k,v] of Object.entries(json.headers))socket.setHeader(k,v);
            let c=ai.content;
            let r=json.replace;
            if(json.replace){
              for(let i in r){
                try{
                  let reg=new RegExp(i,"gs");
                  c=c.replaceAll(reg,r[i]);
                } catch(err){
                  logsole.error(err);
                  c=c.replaceAll(i,r[i]);
                }
              }
            }
            ai.json.cycle--;
            logsole.log("ai done",ai.json.cycle<0,ai.done);
            if(ai.json.cycle<0)ai.done=true;
            await socket.close(c);
          } else{
            socket.setHeader("Content-Type","text/plain");
            ai.done=true;
            await socket.close(ai?.res?.stack+"");
          };
          //caches[get]={date:Date.now(),content:rc,headers:socket.headers()};
        }else if(dct){
          logsole.log("using as static file");
          socket.setHeader("Content-Type",dct);
          await socket.close(bytes);
          //caches[get]={date:Date.now(),content:bytes,headers:socket.headers()};
        }else{
          logsole.log("idk what this is. sending as html file",last);
          await socket.close(bytes);
        };

        if(!dynamic){
          logsole.log(socket.written().length);
          caches[get]={date:Date.now(),content:socket.written(),headers:socket.headers(),status:socket.status,statusMessage:socket.statusMessage};
        };
        //await socket.writeBuffer(bytes);
        //socket.close();
      }  catch (err){
          logsole.error(err);
      }
    }

    async function handler(get,opt?){
      let stat;
      try{stat=await Deno.stat(get)}catch(err){logsole.error(err)};
      try{
        if(!stat){
          await e404(get);
        } else if(stat.isDirectory){
          await directory(get);
        } else if(stat.isFile){
          await file(get,opt);
        }
        return null;
      } catch(err){
        try{
          await e500(get,err);
        } catch (err){
          logsole.error(err);
          return err;
        }
      }
    };

    

    let r=await url.ready;
    if(r?.stack)logsole.error(r);
    if(isValid){
      let get=`./${url.defdir}/${url.tardir}/${url.pathname.replaceAll(/\.+/g, ".").replaceAll(/\.\//g, "/").replace(/\/$/, "")}`;
      get=get.replaceAll(/\/+/g,"/").replace(/\/+$/,"");
      let rget=`./${url.defdir}/${url.tardir}/${url.router}`;
      logsole.log("get",get);
      logsole.log("rget",rget);
      
      if(url.router)await handler(rget,{handler,file,directory,get,e400,e403,e404,e409,e500});
      else await handler(get);
    } else {
      e400();
    }
};
