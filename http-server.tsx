import mime from "./mime-types.json" with { type: "json" };
import "./engine/docs.d.ts";
import "./lib.deno.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import * as canvas from "https://deno.land/x/canvas/mod.ts";
import ollama from "npm:ollama";
import * as pdflib from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import * as pug from "https://deno.land/x/pug/mod.ts";
import LS from "./console.ts";
import React from "npm:react";
import ReactDOMServer from "npm:react-dom/server";
import jso from 'npm:javascript-obfuscator';
  

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
const dissallow:string[]=envget("dissallow","").split(";");

function cache(get:string,socket:HttpSocket|PseudoHttpSocket){
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
  socket.on("error",(...a)=>logsole.error(...a));
  let suc=await socket.ready;
  if(!suc)logsole.warn("http2 ready not successful",socket);
  logsole.debug("http2",socket);
  //console.log("http2",socket);
  socket.on("stream",async function(stream:Http2Stream){
    /*console.log(stream);

    //stream.status=200;
    stream.setHeader("content-type","text/plain");
    await stream.close("Hello, world!");*/
    logsole.debug(stream,stream.client);
    const ps=stream.pseudo();
    listener(ps);
  })
};
export async function listener({socket,client}: HttpSocket|PseudoHttpSocket){
    socket.on("error",(...a)=>logsole.error(...a));
    //console.log(socket.enabled);
    let proxied=false;
    let isValid=client.isValid;
    logsole.log(client);
    /*if(!client.isValid){
      socket.status=400;
      socket.statusMessage="Bad Request";
      socket.close("Cannot read client request");
      return; //socket.deny();
    }*/
    
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

    logsole.info("socket client isValid",socket.client.isValid);
    let url:SpecialURL;
    class SpecialURL extends URL{
      config: {
        host:string;
        regex:RegExp;
        conf:Record<string,string>;
        match:Array<string>;
      }={
        host:"about:blank",
        regex:/(?:)/,
        conf:{"dir":"."},
        match:[],
      };
      defdir="http";
      tardir="0";
      router;
      get getStart(){return `./${this.defdir}/${this.tardir}`};
      ready: Promise<void|Error>;
      constructor(...args: any[]){
        super(args[0].replace("::","#"));
        let t=this;
        this.ready=async function(){
          //const urlDisect=/^(http(s)?:\/\/)|([a-z|0-9|\-|\.]+)|(\/).*$/gs;
          const json = JSON.parse(await readfText(t.defdir+"/config.json").catch(e=>`[{"default":{"dir":".","error":${JSON.stringify(e.toString())}}}]`));
          
          let tar=json[0].default;
          let url=t.toString();
          for(let host in json[0]){
            if(host=="default")continue;
            try{
              //let r;
              let sv=host;
              if(host[0]!="^")sv='^'+host.replace(/[.*+?^${}()\|[\]\\:]/g, '\\$&');
              const r=new RegExp(sv);
              const m=url.match(r);
              logsole.debug(r);
              if(m){
                logsole.debug("match");
                tar=json[0][host];
                t.config={host,regex:r,conf:json[0][host],match:m};
                //tar.hostReg=r;
                break;
              };
            }catch(err){
              logsole.error("SpecialURL ",err);
            }
          }
          //let dtar=json[0].default;
          let utar=tar;

          logsole.log("utar",utar);
          t.tardir=utar.dir;
          //t.tar=utar;
          let rstat=await exists(`${t.defdir}/${utar.dir}/${utar.router}`);

          if(rstat){
            t.router=utar.router;
            logsole.debug("router present",t.router);
          };
        }().catch(e=>e);
      }
    };
    try{url=new SpecialURL(`${proxied?client.headers["x-scheme"]:(socket.type=="tcp::tls"?"https":"http")}://${(proxied?client.headers["x-forwarded-host"]:client.headers.host)||"unknown"}${client.path||"/"}`);}catch(err){logsole.error(err);isValid=false};
    if(!isValid||!url)url=new SpecialURL(`about:blank#invalid`);
    
    logsole.log2(url.toString());
    logsole.log2(client.address);

    /*if(url.hostname=="unkown"&&client.httpVersion=="HTTP/2"){
      socket.deny();
    }*/
    

    async function e403(get:string,err:Error){
      let eget=url.getStart+"/errors/403.dyn.html";
      logsole.warn2(err);
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
      logsole.warn("file doesnt exist");
      let stat=await exists(eget);
      logsole.debug(stat);
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
      logsole.warn2(err);
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
      logsole.log2("file is directory")
        /*socket.status=400;
        socket.statusMessage="Conflict";
        await socket.writeText(get+" is directory\n");
        socket.close();*/
        const dirs: any[] = [];
        let lookfor: string[]=["index."]
        let getDirs=get.split("/");
        if(getDirs[getDirs.length-1])lookfor.push(getDirs[getDirs.length-1]);
        let match={isFile:false,name:""};

        logsole.debug("lookfor",lookfor);
        logsole.debug("dirs",dirs);

        for await (const dir of Deno.readDir(get)) {
          dirs.push(dir);

          for(let l of lookfor){
            if(dir.name.startsWith(l)&&!dir.isDirectory)match=dir;
          }

        };

        if(!match?.isFile){
          logsole.warn("cant find file",dirs);
          return e409(get);
        } else {
          let nget=get+"/"+match.name;
          logsole.log3("found file",match.name);
          return file(nget)
        }
    };
    async function file(get:string,opt?:object): Promise<void>{
      async function jss(content:string,opt?:any|object): Promise<any>{
        return await AsyncFunction("socket,url,get,opt,deno,imports",`return \`${content.replaceAll("`","\\`")}\`;`)(socket,url,get,opt,Deno,imports);
      };

      try{
        if(cache(get,socket))return;

        const bytes = await readf(get);
        const last=get.replace(/.*\//,"");
        const ext=last.split(".");
        const lext=ext[ext.length-1];
        const dct=mime[""+lext];
        const isJss=/.*\.dyn\.[a-z]+/.test(last);
        let dynamic=false;
        let stop=false;

        logsole.debug("file found",bytes.byteLength);
        

        for(let d of dissallow){
          if(last.endsWith(d)){
            await e403(get,new Error("file not allowed"));
            stop=true;
            break;
          }
        };
        const fstr=await(async()=>{
          let fstr=td.decode(bytes);

          if(!stop&&isJss){
            logsole.debug("parsing as js multiline string");
            fstr=await jss(fstr,opt);
          };

          return fstr;
        })()

        if(stop){
          logsole.info("stop is true");
        }else if(last.endsWith(".tsx")||last.endsWith(".jsx")){
          const Mod=await import(get+"?d="+Date.now()).then(m=>m.default);
          let r=ReactDOMServer.renderToString(<Mod />);
          socket.setHeader("Content-Type","text/html");
          await socket.close(r);
        }else if(last.endsWith(".deno.ts")){
          logsole.debug("importing deno thing",get);
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
          //if(dyn[get].state?.allowCaching)
        }else if(last.endsWith(".async.js")){
          logsole.debug("executing js code");
          dynamic=true;
          let t=fstr;//td.decode(bytes);
          let f=AsyncFunction("socket,url,get,opt,deno,imports,console",t);
          await f(socket,url,get,opt,Deno,imports,logsole);//.catch(err=>logsole.error(err));
        }else if(last.endsWith(".pug")){
          logsole.debug("compiling pug file")
          // let t=td.decode(bytes);
          // if(isJss){
          //   logsole.debug("also executing as js multiline string");
          //   t=await jss(t,opt);
          // };
          let h=pug.render(fstr);
          socket.setHeader("Content-Type","text/html");
          await socket.close(h);
        }else if(/o([a-z])?\.js$/.test(last)){
          logsole.debug("obfuscating js file before sending");
          socket.setHeader("Content-Type","text/javascript");
          const vl=String(last.match(/o([a-z])?\.js$/)?.[0]); // typesafety to mitigate vscode warnings
          const l=vl.charAt(1);
          const jsoConfig={
            d:{"optionsPreset":"default"},//{"compact":true,"controlFlowFlattening":false,"deadCodeInjection":false,"debugProtection":false,"debugProtectionInterval":0,"disableConsoleOutput":false,"identifierNamesGenerator":"hexadecimal","log":false,"numbersToExpressions":false,"renameGlobals":false,"selfDefending":false,"simplify":true,"splitStrings":false,"stringArray":true,"stringArrayCallsTransform":false,"stringArrayCallsTransformThreshold":0.5,"stringArrayEncoding":[],"stringArrayIndexShift":true,"stringArrayRotate":true,"stringArrayShuffle":true,"stringArrayWrappersCount":1,"stringArrayWrappersChainedCalls":true,"stringArrayWrappersParametersMaxCount":2,"stringArrayWrappersType":"variable","stringArrayThreshold":0.75,"unicodeEscapeSequence":false},
            l:{"optionsPreset":"low-obfuscation"},//{"compact":true,"controlFlowFlattening":false,"deadCodeInjection":false,"debugProtection":false,"debugProtectionInterval":0,"disableConsoleOutput":true,"identifierNamesGenerator":"hexadecimal","log":false,"numbersToExpressions":false,"renameGlobals":false,"selfDefending":true,"simplify":true,"splitStrings":false,"stringArray":true,"stringArrayCallsTransform":false,"stringArrayEncoding":[],"stringArrayIndexShift":true,"stringArrayRotate":true,"stringArrayShuffle":true,"stringArrayWrappersCount":1,"stringArrayWrappersChainedCalls":true,"stringArrayWrappersParametersMaxCount":2,"stringArrayWrappersType":"variable","stringArrayThreshold":0.75,"unicodeEscapeSequence":false},
            m:{"optionsPreset":"medium-obfuscation"},//{"compact":true,"controlFlowFlattening":true,"controlFlowFlatteningThreshold":0.75,"deadCodeInjection":true,"deadCodeInjectionThreshold":0.4,"debugProtection":false,"debugProtectionInterval":0,"disableConsoleOutput":true,"identifierNamesGenerator":"hexadecimal","log":false,"numbersToExpressions":true,"renameGlobals":false,"selfDefending":true,"simplify":true,"splitStrings":true,"splitStringsChunkLength":10,"stringArray":true,"stringArrayCallsTransform":true,"stringArrayCallsTransformThreshold":0.75,"stringArrayEncoding":["base64"],"stringArrayIndexShift":true,"stringArrayRotate":true,"stringArrayShuffle":true,"stringArrayWrappersCount":2,"stringArrayWrappersChainedCalls":true,"stringArrayWrappersParametersMaxCount":4,"stringArrayWrappersType":"function","stringArrayThreshold":0.75,"transformObjectKeys":true,"unicodeEscapeSequence":false},
            h:{"optionsPreset":"high-obfuscation"},//{"compact":true,"controlFlowFlattening":true,"controlFlowFlatteningThreshold":1,"deadCodeInjection":true,"deadCodeInjectionThreshold":1,"debugProtection":true,"debugProtectionInterval":4000,"disableConsoleOutput":true,"identifierNamesGenerator":"hexadecimal","log":false,"numbersToExpressions":true,"renameGlobals":false,"selfDefending":true,"simplify":true,"splitStrings":true,"splitStringsChunkLength":5,"stringArray":true,"stringArrayCallsTransform":true,"stringArrayEncoding":["rc4"],"stringArrayIndexShift":true,"stringArrayRotate":true,"stringArrayShuffle":true,"stringArrayWrappersCount":5,"stringArrayWrappersChainedCalls":true,"stringArrayWrappersParametersMaxCount":5,"stringArrayWrappersType":"function","stringArrayThreshold":1,"transformObjectKeys":true,"unicodeEscapeSequence":false},

            e:{"optionsPreset":"high-obfuscation","compact":true,"selfDefending":true,"disableConsoleOutput":true,"debugProtection":true,"debugProtectionInterval":4000,"splitStrings":true,"splitStringsChunkLength":5,"splitStringsChunkLengthEnabled":false,"stringArray":true,"stringArrayRotate":true,"stringArrayRotateEnabled":true,"stringArrayShuffle":true,"stringArrayShuffleEnabled":true,"simplify":true,"stringArrayThreshold":1,"stringArrayThresholdEnabled":true,"stringArrayIndexesType":["hexadecimal-number"],"stringArrayIndexShift":true,"stringArrayCallsTransform":false,"stringArrayCallsTransformThreshold":1,"stringArrayEncoding":["none"],"stringArrayEncodingEnabled":true,"stringArrayWrappersCount":5,"stringArrayWrappersChainedCalls":true,"stringArrayWrappersParametersMaxCount":5,"stringArrayWrappersType":"function","numbersToExpressions":true,"sourceMap":false,"sourceMapMode":"separate","sourceMapBaseUrl":"","sourceMapFileName":"","domainLock":[],"domainLockRedirectUrl":"about:blank","domainLockEnabled":true,"forceTransformStrings":[],"reservedNames":[],"reservedStrings":[],"seed":0,"controlFlowFlatteningThreshold":1,"controlFlowFlattening":true,"deadCodeInjectionThreshold":1,"deadCodeInjection":true,"unicodeEscapeSequence":false,"renameGlobals":true,"renameProperties":true,"renamePropertiesMode":"unsafe","target":"browser-no-eval","identifierNamesGenerator":"hexadecimal","identifiersDictionary":[],"identifiersPrefix":"","transformObjectKeys":true,"ignoreImports":false,"config":"","exclude":[],"identifierNamesCache":null,"inputFileName":"","log":false,"sourceMapSourcesMode":"sources-content"},
            n:{"compact":false,"controlFlowFlattening":true,"controlFlowFlatteningThreshold":1,"numbersToExpressions":true,"simplify":true,"stringArrayShuffle":true,"splitStrings":true,"stringArrayThreshold":1},
            c:{"optionsPreset":"high-obfuscation","disableConsoleOutput":false,"renameGlobals":true,"renameProperties":false,"renamePropertiesMode":"unsafe","target":"browser-no-eval"},
          };
          const c=jsoConfig[l]||jsoConfig.d;
          const or=jso.obfuscate(fstr,c).getObfuscatedCode();

          logsole.log("obfuscation level",l,vl);
          logsole.log("obfuscated file length",or.length);
          await socket.close(or);
        }else if(last.endsWith(".proxy.json")){
          logsole.debug("proxying the connection");
          let json=JSON.parse(fstr);
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
          logsole.log2("proxying to "+json.url);
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
          logsole.debug("following link to",fstr);
          await handler(fstr);
        }else if(last.endsWith(".ai.json")){
          logsole.debug("using ai for content");
          let ai=aid[get];
          const json=JSON.parse(fstr);
          logsole.debug("ai exist",!!ai);
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
          logsole.debug("ai",ai);
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
            logsole.info("ai done",ai.json.cycle<0,ai.done);
            if(ai.json.cycle<0)ai.done=true;
            await socket.close(c);
          } else{
            socket.setHeader("Content-Type","text/plain");
            ai.done=true;
            await socket.close(ai?.res?.stack+"");
          };
          //caches[get]={date:Date.now(),content:rc,headers:socket.headers()};
        }else if(isJss&&dct){
          logsole.debug("file already parsed as js multiline string");
          //logsole.debug("parsing as js multiline string");
          //let t=td.decode(bytes);
          //let r=await jss(t,opt);
          socket.setHeader("Content-Type",dct);
          await socket.close(fstr);
          //caches[get]={date:Date.now(),content:r,headers:socket.headers()};
        }else if(dct){
          logsole.info("using as static file");
          socket.setHeader("Content-Type",dct);
          await socket.close(bytes);
          //caches[get]={date:Date.now(),content:bytes,headers:socket.headers()};
        }else{
          logsole.info("unknown. sending as html file",last);
          await socket.close(bytes);
        };

        if(!dynamic){
          let written=socket.written();
          logsole.debug("wrote",written.length);
          caches[get]={date:Date.now(),content:written,headers:socket.headers(),status:socket.status,statusMessage:socket.statusMessage};
        };
        //await socket.writeBuffer(bytes);
        //socket.close();
      }  catch (err){
          await e500(get,err);
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
          logsole.fatal(err);
          await e500(get,err);
        } catch (err2){
          logsole.fatal(err2);
          return err;
        }
      }
    };

    

    let r=await url.ready;
    if(r?.stack)logsole.error(r);
    if(isValid){
      //let ipath="^([a-z])+:\/\/[a-z|0-9|-|\.]+\/.+"
      let epath=url.config.match[0]?.match(/(?<=(?:https?:\/\/)?[^\/]+)(\/(?!\/).+)/s,"")||[""];
      let get=`./${url.defdir}/${url.tardir}/${(url.pathname.replace(epath[0],"")).replaceAll(/\.+/g, ".").replaceAll(/\.\//g, "/").replace(/\/$/, "")}`;
      get=get.replaceAll(/\/+/g,"/").replace(/\/+$/,"");
      let rget=`./${url.defdir}/${url.tardir}/${url.router}`;
      logsole.debug("get",get);
      logsole.debug("rget",rget);
      logsole.debug("extra path",epath,url.config.match);
      
      if(url.router)await handler(rget,{handler,file,directory,get,e400,e403,e404,e409,e500});
      else await handler(get);
    } else {
      e400();
    }
};
