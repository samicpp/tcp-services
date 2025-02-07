const [selected,text,send,rst,sel,res,list]=document.querySelectorAll(`.side span,textarea,button,div.res,ul`),
url=m=>`wss://cppdev.dev//ollama/ws?m=${m}`,
models=["deepseek-r1:1.5b","llama3.2","deepseek-r1:7b"],
ws=new StableWS(url(models[0])),
message=()=>new Promise(r=>ws.onmessage=r);

let model=models[0];
let mMenu=null;
//ws.onmessage=console.log
//ws.onopen=console.log
//ws.onerror=console.log
//ws.onclose=console.log

!async function(){
    while(true){
        const msg=await message();
        let text=msg.data.replaceAll(/.*<\/think>/gs,"").trim();
        createElement("li",{class:"assistent"},{text,parent:list});
        createElement("li",{class:"spacer"},{parent:list});
        console.log(msg);
    };
}();

send.addEventListener("click",async function(click){
    createElement("li",{class:"user"},{text:text.value,parent:list});
    createElement("li",{class:"spacer"},{parent:list});
    ws.send(text.value);
});

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