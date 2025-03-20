import Engine from "../../../engine/library.d.ts";
import lsSetup from "../../../console.ts";

let _del:()=>void;
let td=new TextDecoder;
let te=new TextEncoder;
//let room="@";
let visitor=0;
const [_logfile,logsole]=lsSetup();

class Chatter{
    constructor(obj:any){ Object.assign(this,obj); }
    ws:Engine.WebSocket|null=null;
    id:string="";
    room:string="@";
    name:string="'unnamed";
};
export const _rooms:Record<string,Record<string,Chatter>>={
    "@":{},
};
const rooms=new Proxy(_rooms,{
    get(target: any, p: string | symbol, _receiver: any): any{
        let room=target[p];
        if(room)return room;
        else return target[p]={};
    },
    set(target: any, p: string | symbol, newValue: any, _receiver: any): boolean{
        //return false; // not implemented yet
        if(newValue!=null)target[p]=newValue;
        else delete target[p];

        return true;
    }
});


export default async function main(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void){
    const id=Date.now().toString(),vnum=visitor++;
    let ws:Engine.WebSocket;
    let name=`chatter${vnum}`;
    
    // stole my own code again :D
    const {client}=socket;
    logsole.log("handling con");
    if(!client)return socket.close("cannot read client");
    if(client.headers["upgrade"]=="websocket"){
        logsole.log("chat-room.deno.ts websocket upgrade");
        let w=await socket.websocket();
        if(w)logsole.log("chat-room.deno.ts upgraded connection");
        else return logsole.log("chat-room.deno.ts couldnt upgrade");

        ws=w;
    }else{
        logsole.log("chat-room.deno.ts client isnt trying to upgrade");
        return await socket.close("WS required"); 
    };

    const me=new Chatter({
        ws,id,name,
    });

    rooms[me.room][id]=me;
    logsole.log("chat-room.deno.ts chatter",me);

    ws.on("frame",async function(frame:Engine.WsFrame){
        if(![0,1].includes(frame.opcode))return;
        try{
            let str=td.decode(frame.payload),
            rest=str.substring(1);

            logsole.log("chat-room.deno.ts got a frame",frame,str);

            if(str[0]=="!"){ // settings
                let json=JSON.parse(rest);

                let nroom=String(json?.room||me.room);
                if(!["@"].includes(nroom)){
                    nroom=nroom.toLowerCase().replace(/[^a-z|0-9|_|-]/g,"_");
                };
                if(json?.room&&me.room!=json.room){
                    rooms[me.room][id]=null;
                    rooms[json.room][id]=me;
                    me.room=json.room;
                };

                let nname=json?.name||me.name;
                if(nname!=me.name)me.name=nname.trim().replace(/[^a-z|A-Z|0-9|_|-]/g,"_");

            } else if(str[0]=="#"){ // command
                if(rest=="self")me.ws?.sendText("#"+JSON.stringify(me));
            } else if(str[0]=="$"){ // message
                let json=JSON.parse(rest);
                let msg="$"+JSON.stringify({
                    date:Date.now(),
                    name, id,
                    data: String(json.data).trim(),
                    extra: json.extra||{},
                });
                for(let k in rooms[me.room]){
                    const u:Chatter=rooms[me.room][k];
                    if(!u?.ws)continue;
                    u.ws.sendText(msg);
                };
            };
        } catch(err){
            logsole.error2("chat-room.deno.ts",err);
        };
    });
};

export async function init(socket: Engine.HttpSocket|Engine.PseudoHttpSocket, url: URL, get: string, opt:Record<string,any>|void, dele: ()=> void, past: any|void, imports:Record<string,any>){
    _del=dele; visitor++;
    main(socket,url,get,opt); // no special treatment
};

export const state:{active:boolean}={
    active:false,
};