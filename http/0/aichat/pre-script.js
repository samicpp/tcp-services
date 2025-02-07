function overlay(html,options={}) {
    const div = document.createElement("div");
    const divbg = document.createElement("div");
    const sett = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#222",
        padding: "20px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        textAlign: "center",
        //fontFamily: "Arial, sans-serif",
        //fontSize: "18px",
        zIndex: "1001",
        minWidth: "200px",
        maxWidth: "80%",
        maxHeight: "80%"
    };
    Object.assign(div.style, sett);
    Object.assign(divbg.style, sett, {width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.1)", zIndex:"1000", maxWidth: "100%", maxHeight: "100%"});
    div.innerHTML=html;
    div.classList.add("overlay");
    divbg.classList.add("overlay", "background");
    document.body.appendChild(divbg);
    divbg.appendChild(div);

    addEventListener("keydown",async function(keydown){
        if(!options.noEscape&&keydown.code=="Escape")divbg.style.display="none";
    });
    divbg.addEventListener("click",async function(click){
        if(!options.noEscape&&click.target==divbg)divbg.style.display="none";
    });

    return divbg;
};

class StableWS extends EventTarget{
    #ws; #url;
    constructor(url){
        super();
        this.#url=url;
        this.#start();
    };
    #start(){
        const ws=this.#ws=new WebSocket(this.#url),th=this,start=()=>this.#start();
        function forward(e){
            let ne=new e.constructor(e.type,e);
            let res=th.dispatchEvent(ne);
            //console.log("got event",e,res,ne);
        };
        ws.onerror=forward;
        ws.onclose=function(e){
            forward(e);
            start();
        };
        ws.onmessage=forward;
        ws.onopen=forward;
    };
    restart(url=this.#url){
        this.#url=url;
        this.#ws.close();
        this.#start();
    };

    send(...e){this.#ws.send(...e)};
    
    set onerror(l){this.addEventListener("error",l)};
    set onclose(l){this.addEventListener("close",l)};
    set onmessage(l){this.addEventListener("message",l)};
    set onopen(l){this.addEventListener("open",l)};
}

function createElement(nodeName="div",attributes={},options={}){
    const el=document.createElement(nodeName);
    for(let [a,v] of Object.entries(attributes))el.setAttribute(a,v);
    for(let [p,v] of Object.entries(options)){
        switch(p.toLowerCase()){
            case"html":
            case"innerhtml":
            case"htmlcontent":
                el.innerHTML=v;
                break;
            
            case"text":
            case"content":
            case"textcontent":
                el.innerText=v;
                break;

            case"parent":
                v.appendChild(el);
                break;

            case"style":
                Object.assign(el.style,v);
                break;

            default:
                break;
        };
    };
    return el;
}