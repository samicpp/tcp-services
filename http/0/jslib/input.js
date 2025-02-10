class Keyboard{
    key={};
    //keyint={};
    async await(keycode,flags="s"){
        let reg;
        if(keycode instanceof RegExp)reg=keycode;
        else if(typeof keycode=="string")reg=new RegExp(keycode,flags);
        else reg=/(:?)/s;
        let r,p=new Promise(re=>r=re);
        let f=e=>{
            if(reg.test(e.code))r(e);
        };
        addEventListener("keydown",f);
        let e=await p;
        removeEventListener("keydown",f);
        return e;
    };
    constructor(){
        const th=this;
        addEventListener("keydown",function(key){th.key[key.code]=key;th.key[key.keyCde]=key});
        addEventListener("keyup",function(key){th.key[key.code]=null;th.key[key.keyCde]=null});
    };
};
class Mouse{
    x=0;
    y=0;
    move=null;
    lastClick=null;
    down=null;
    #que=[];
    click(){return new Promise(r=>addEventListener("click",r,{once:true}))};
    get once(){return this.#que.splice(0,1)[0]};
    constructor(){
        const th=this;
        addEventListener("mousemove",e=>{th.x=e.x;th.y=e.y;th.move=e});
        addEventListener("click",e=>this.lastClick=e);
        addEventListener("click",e=>this.#que.push(e));

        addEventListener("mousedown",e=>this.down=e);
        addEventListener("mouseup",e=>this.down=null);
    };
};