const [selected,text,send,rst,sel,res,list]=document.querySelectorAll(`.side span,textarea,button,div.res,ul`),
url=m=>`wss://cppdev.dev//ollama/ws?m=${m}`,
models=["deepseek-r1:1.5b","llama3.2","deepseek-r1:7b"],
ws=new StableWS(url(models[0])),
message=()=>new Promise(r=>ws.onmessage=r),
msglog=[];

let model=models[0];
let mMenu=null;
let mi=-1;
//ws.onmessage=console.log
ws.onopen=e=>send.disabled=false;
ws.onerror=console.log
ws.onclose=e=>send.disabled=true;

!async function(){
    while(true){
        const msg=await message();
        let text=msg.data.replaceAll(/.*<\/think>/gs,"").trim();
        createElement("li",{class:"assistent"},{text,parent:list});
        createElement("li",{class:"spacer"},{parent:list});
        console.log(msg);
    };
}();

async function sendmsg(msg){
    mi=msglog.push(msg)-1;
    createElement("li",{class:"user"},{text:msg,parent:list});
    createElement("li",{class:"spacer"},{parent:list});
    ws.send(msg);
};

send.addEventListener("click",e=>{sendmsg(text.value);text.value=""});
text.addEventListener("keydown",async function(key){
    if(key.code=="Enter"&&!key.shiftKey){key.preventDefault();sendmsg(text.value);text.value=""}
    else if(key.code=="ArrowUp"&&(key.altKey||text.value=="")){text.value=msglog[mi--]}
    else if(key.code=="ArrowDown"&&(key.altKey||text.value=="")){text.value=msglog[mi++]}
})

rst.onclick=e=>ws.restart();

sel.addEventListener("click",click=>{
    if(!mMenu){
        mMenu=overlay(`<span class="select-text">which model would you like to use?</span><br/><br/>`);
        for(let m of models){
            let btn=createElement("button",{class:"select-model",id:models.indexOf(m)},{text:m,parent:mMenu.childNodes[0]});
            createElement("br",{},{parent:mMenu.childNodes[0]});
            btn.onclick=e=>{
                model=m;
                mMenu.style.display="none";
                update();
            };
        };
    } else mMenu.style.display="block";
});

function update(){
    selected.innerText=model;
    location.hash=model;
    ws.restart(url(model));
};

if(location.hash.length>1){
    let m=location.hash.replace('#',"");
    if(models.includes(m)){
        model=m;
        update();
    };
}