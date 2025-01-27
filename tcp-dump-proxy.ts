const deno=Deno;
const host="localhost";
const port=80;
const lport=8080;

const ser=deno.listen({port:lport});
console.log(ser);

for await(const conn of ser){
    const cl=await deno.connect({host,port});
    console.log(conn,cl);
    async function cs(){
        const buffer=new Uint8Array(0.125*1024**2);
        async function read():Promise<Uint8Array>{ try{return new Uint8Array([...buffer.subarray(0,await cl.read(buffer))])}catch(err){throw console.error(err)}; };
        let b:Uint8Array=await read().catch(e=>new Uint8Array);
        console.log("client -> server",b);
        while(b.length!=0){
            console.log("client -> server",b);
            conn.write(b);
            b=await read().catch(e=>new Uint8Array);
        };
    };
    async function sc(){
        const buffer=new Uint8Array(0.125*1024**2);
        async function read():Promise<Uint8Array>{ try{return new Uint8Array([...buffer.subarray(0,await cl.read(buffer))])}catch(err){throw console.error(err)}; };
        let b:Uint8Array=await read().catch(e=>new Uint8Array);
        console.log("server -> client",b);
        while(b.length!=0){
            console.log("server -> client",b);
            cl.write(b);
            b=await read().catch(e=>new Uint8Array);
        };
    };
    cs();sc();
}

export{};