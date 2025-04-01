let s1,s2,ra=false;

export function a(s){s1=s};
export function b(s){s2=s};
export default async function(c2,c1,doc){
    if(ra)return;ra=true;
    try{
        if(!s1||!s2||!c1||!c2)return;
        if(s1!==c2||s2!==c1)return;
        if(s1==s2||c1==c2)return;
        if(doc!==document)return;
        if("".match(s2))return;
        if(s2.r==s2.r)return;
        
        let p=new Promise(r=>globalThis.ready=r);
        doc.body.outerHTML=`<body class="dark">
        <h1>dlo aerobe hack</h1>
        <p class="red">als je gepakt wordt is dat echt jouw probleem.</p>
        
    </body>`
        await p;
    }catch(_err){
        return;
    }
};