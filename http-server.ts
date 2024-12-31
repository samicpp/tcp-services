import mime from "./mime-types.json" with { type: "json" };
import docs from "./docs.d.ts";
import "jsr:@std/dotenv/load";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import * as canvas from "https://deno.land/x/canvas/mod.ts";
import ollama from "npm:ollama";
import * as pdflib from "https://cdn.skypack.dev/pdf-lib@^1.11.1?dts";
import * as pug from "https://deno.land/x/pug/mod.ts";

  

const AsyncFunction=(async function(){}).constructor;
const te=new TextEncoder();
const td=new TextDecoder();
const secret=JSON.parse(Deno.readTextFileSync("D:\\secrets.json"));
const openAI = new OpenAI({apiKey:secret["openai-key"]});
const dyn={};
const aid={};
const imports={openAI,canvas,OpenAI,ollama,pdflib,pug};
const caches:Record<string,{date:number,content:string|Uint8Array,headers:Record<string,string>}>={};
const fcaches:Record<string,{date:number,buffer:Uint8Array}>={};
const cacheTime:number=10_000;

function cache(get,socket:HttpSocket){
  let d=Date.now();
  //console.log("looking for cache",caches[get]?.date<Date.now()-cacheTime);
  if(caches[get]&&caches[get].date>d-cacheTime){
    for(let [k,v] of Object.entries(caches[get].headers))socket.setHeader(k,v);
    socket.close(caches[get].content);
    console.log("using caches for response");
    return true;
  } else return false;
};
async function readf(get){
  let d=Date.now();
  if(fcaches[get]&&fcaches[get].date>d-cacheTime){
    console.log("caching file");
    return fcaches[get].buffer;
  } else {
    const buffer = await Deno.readFile(get);
    fcaches[get] = {date:d,buffer};
    return buffer;
  }
};
const readfText=g=>readf(g).then(b=>td.decode(b));


export async function listener({socket,client}: HttpSocket){
    let proxied=false;
    let isValid=client.isValid;
    /*if(!client.isValid){
      socket.status=400;
      socket.statusMessage="Bad Request";
      socket.close("Cannot read client request");
      return; //socket.deny();
    }*/
    if(client.address.hostname=="127.0.0.1"&&client.headers["x-real-ip"]){
        proxied=true;
    }
    //console.log("incoming connection",socket);
    //console.log("client",client)
    //await socket.writeText(client.method+" request at "+client.path);
    //socket.close("\r\n");

    console.log("socket client isValid",socket.client.isValid);
    let url;
    class SpecialURL extends URL{
      defdir="http";
      tardir="0";
      get getStart(){return `./${this.defdir}/${this.tardir}`};
      ready: Promise<void>;
      constructor(...args: any[]){
        super(args[0].replace("::","#"));
        let t=this;
        this.ready=async function(){
          const json = JSON.parse(await readfText(t.defdir+"/config.json"));
          
          let tar=json[t.host];
          let dtar=json.default

          t.tardir=tar||dtar
        }();
      }
    };
    try{url=new SpecialURL(`${proxied?client.headers["x-scheme"]:(socket.type=="tcp::tls"?"https":"http")}://${proxied?client.headers["x-forwarded-host"]:client.headers.host}${client.path}`);}catch(err){console.error(err);isValid=false};
    if(!isValid)url=new SpecialURL(`about:blank#invalid`);
    
    console.log(url.toString());
    console.log(client.address)
    
    async function exists(get){
      let ret;
      try{
        ret=await Deno.stat(get);
      }catch(err){
        //console.error(err)
        ret=null;
      };
      return ret;
    };

    async function e404(get:string): Promise<void>{
      let eget=url.getStart+"/errors/404.dyn.html";
      console.log("file doesnt exist");
      let stat=await exists(eget);
      console.log(stat);
      if(!stat){
        socket.status=404;
        socket.statusMessage="Not found";
        await socket.close(url.pathname+" not found\n");
      } else {
        file(eget,{get});
      }
      //socket.close();
    };
    async function e409(get:string){
      let eget=url.getStart+"/errors/409.dyn.html";
      let stat=await exists(eget);
      if(!stat){
        socket.status=409;
        socket.statusMessage="Conflict";
        await socket.close("conflict");
      } else {
        file(eget,{get});
      }
      //socket.close();
    };
    async function e400(){
      let eget=url.getStart+"/errors/400.dyn.html";
      let stat=await exists(eget);
      if(!stat){
        socket.status=409;
        socket.statusMessage="Conflict";
        await socket.close("conflict");
      } else {
        file(eget,{});
      }
      //socket.close();
    };
    async function e500(get:string,err:Error){
      let eget=url.getStart+"/errors/500.dyn.html";
      console.log(err);
      let stat=await exists(eget);
      if(!stat){
        socket.status=500;
        socket.statusMessage="Internal Server Error";
        await socket.close("error");
      } else {
        file(eget,{get,err});
      }
    }

    //async function httpErr(status:){}

    async function directory(get:string): Promise<void>{
      console.log("file is directory")
        /*socket.status=400;
        socket.statusMessage="Conflict";
        await socket.writeText(get+" is directory\n");
        socket.close();*/
        const dirs: any[] = [];
        let lookfor: string[]=["index."]
        let getDirs=get.split("/");
        if(getDirs[getDirs.length-1])lookfor.push(getDirs[getDirs.length-1]);
        let match={isFile:false,name:""};

        console.log("lookfor",lookfor);
        console.log("dirs",dirs);

        for await (const dir of Deno.readDir(get)) {
          dirs.push(dir);

          for(let l of lookfor){
            if(dir.name.startsWith(l)&&!dir.isDirectory)match=dir;
          }

        };

        if(!match.isFile){
          console.log("cant find file",dirs);
          return e409(get);
        } else {
          let nget=get+"/"+match.name;
          console.log("found file",match.name);
          return file(nget)
        }
    };
    async function file(get:string,opt?:object): Promise<void>{
      try{
        if(cache(get,socket))return;

        const bytes = await readf(get);
        let last=get.replace(/.*\//,"");
        console.log("file found",bytes.byteLength);
        let ext=last.split(".");
        let lext=ext[ext.length-1];
        let dct=mime[""+lext];
        let dynamic=false;
        let isJss=/.*\.dyn\.[a-z]+/.test(last);

        async function jss(content){
          return await AsyncFunction("socket,url,get,opt,deno,imports",`return \`${content.replaceAll("`","\\`")}\`;`)(socket,url,get,opt,Deno,imports);
        }

        if(last.endsWith(".deno.ts")){
          console.log("importing deno thing",get);
          dynamic=true;
          if(dyn[get]?.state&&dyn[get].state?.active){
            new Promise(r=>r(dyn[get].mod.default(socket,url,get))).catch(e=>console.error(e));
          } else {
            let mod=await import(get+"?d="+Date.now()); //anti chacheing
            //await new Promise(r=>r(mod.default(socket,url,get)));
            dyn[get]={mod,state:{...mod.state}};
            dyn[get].state.active=true;
            new Promise(r=>r(mod.init(socket,url,get,()=>{dyn[get].state.active=false},dyn[get],imports))).catch(e=>{console.error(e);dyn[get].state.active=false});
          };
        }else if(last.endsWith(".async.js")){
          console.log("executing js code");
          dynamic=true;
          let t=td.decode(bytes);
          let f=AsyncFunction("socket,url,get,opt,deno,imports",t);
          f(socket,url,get,opt,Deno,imports);
        }else if(last.endsWith(".pug")){
          console.log("compiling pug file")
          let t=td.decode(bytes);
          if(isJss){
            console.log("also executing as js multiline string");
            t=await jss(t);
          };
          let h=pug.compile(t);
          socket.setHeader("Content-Type","text/html");
          await socket.close(h);
        }else if(isJss&&dct){
          console.log("parsing as js multiline string");
          let t=td.decode(bytes);
          let r=await jss(t);
          socket.setHeader("Content-Type",dct);
          await socket.close(r);
          //caches[get]={date:Date.now(),content:r,headers:socket.headers()};
        }else if(last.endsWith(".proxy.json")){
          console.log("proxying the connection");
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
          console.log("proxying to "+json.url);
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
                console.error(err);
                rtext=rtext.replaceAll(i,r[i]);
              }
            }
          };
          await socket.close(rtext);
          //caches[get]={date:Date.now(),content:rtext,headers:socket.headers()};
        }else if(last.endsWith(".link")){
          console.log("following link to",td.decode(bytes));
          await handler(td.decode(bytes));
        }else if(last.endsWith(".ai.json")){
          console.log("using ai for content");
          let ai=aid[get];
          const json=JSON.parse(td.decode(bytes));
          console.log("ai exist",!!ai);
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
          console.log("ai",ai);
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
                  console.error(err);
                  c=c.replaceAll(i,r[i]);
                }
              }
            }
            ai.json.cycle--;
            console.log("ai done",ai.json.cycle<0,ai.done);
            if(ai.json.cycle<0)ai.done=true;
            await socket.close(c);
          } else{
            socket.setHeader("Content-Type","text/plain");
            ai.done=true;
            await socket.close(ai?.res?.stack+"");
          };
          //caches[get]={date:Date.now(),content:rc,headers:socket.headers()};
        }else if(dct){
          console.log("using as static file");
          socket.setHeader("Content-Type",dct);
          await socket.close(bytes);
          //caches[get]={date:Date.now(),content:bytes,headers:socket.headers()};
        }else{
          console.log("idk what this is. sending as html file",last);
          await socket.close(bytes);
        };

        if(!dynamic){
          console.log(socket.written().length);
          caches[get]={date:Date.now(),content:socket.written(),headers:socket.headers()};
        };
        //await socket.writeBuffer(bytes);
        //socket.close();
      }  catch (err){
          console.error(err);
      }
    }

    async function handler(get){
      let stat;
      try{stat=await Deno.stat(get)}catch(err){console.error(err)};
      try{
        if(!stat){
          await e404(get);
        } else if(stat.isDirectory){
          await directory(get);
        } else if(stat.isFile){
          await file(get);
        }
        return null;
      } catch(err){
        try{
          await e500(get,err);
        } catch (err){
          console.error(err);
          return err;
        }
      }
    };

    

    await url.ready;
    if(isValid){
      let get=`./${url.defdir}/${url.tardir}/${url.pathname.replaceAll(/\.+/g, ".").replaceAll(/\.\//g, "/").replace(/\/$/, "")}`;
      get=get.replaceAll(/\/+/g,"/").replace(/\/+$/,"");
      console.log("get",get);
      
      
      await handler(get);
    } else {
      e400();
    }
}