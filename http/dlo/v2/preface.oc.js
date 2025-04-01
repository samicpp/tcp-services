addEventListener("DOMContentLoaded",async function(domcl){
    let lcm=0,tcm=0,e;

    addEventListener("keyup",ev=>{
        if(ev.code=="KeyM"&&ev.ctrlKey){
            lcm=Date.now();
            tcm++;
            e=ev;
        };
    });

    while(true){
        await new Promise(r=>setTimeout(r,1));

        let n=Date.now();
        if(n-lcm>170){
            tcm=0
            lcm=Date.now();
            //console.log("n-lcm>1000===true",n-lcm)
        };

        // window.tcm=tcm;
        // window.lcm=lcm;
        // window.n=n;
        // window.e=e;

        if(tcm>3){
            //console.log("tcm above 3",tcm);
            //alert("congrats");
            const mod=await import("/v2/load.oc.js");
            let a=/^$/gs,b={get r(){return Math.random()}};
            mod.a(b),mod.b(a);
            mod.default(a,b,document);
            await new Promise(r=>r); // disable while loop
            tcm=0;
        };
    };
});
/*(async function idle(){
    console.log("DOMContentLoaded",
        await new Promise(r=>addEventListener("DOMContentLoaded",r))
    );

    let lcm=0,tcm=0,e;

    addEventListener("keyup",ev=>{
        if(ev.code=="KeyM"&&ev.ctrlKey){
            lcm=Date.now();
            tcm++;
            e=ev;
        };
    });

    while(true){
        let n=Date.now();
        if(n-lcm>1000){
            tcm=0
            lcm=Date.now();
            console.log("n-lcm>1000===true",n-lcm)
        };

        // window.tcm=tcm;
        // window.lcm=lcm;
        // window.n=n;
        // window.e=e;

        if(tcm>3){
            console.log("tcm above 3",tcm);
            alert("congrats");
            tcm=0;
        };
    };
})();*/