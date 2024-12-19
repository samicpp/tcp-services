const encoder = new TextEncoder();
const decoder = new TextDecoder();

const certFile = "D:\\fullchain.pem";
const keyFile = "D:\\privkey.pem";
const caFile = "D:\\chain.pem";
const tls = Deno.listenTls({
  port: 8443,
  certFile,
  keyFile,
  caFile,
});


const listener = Deno.listen({ port: 8080 });

console.log("listening on 0.0.0.0:8080");
for await (const conn of listener) {
 
  const buf = new Uint8Array(1024);
  const len = await conn.read(buf);  
  const buff = buf.subarray(0,len);
  if(buff[0]==22){
    const proxy=await Deno.connect({port: 8443});
    const tlsConn=await tls.accept();

    proxy.write(buff);
    conn.readable.pipeTo(proxy.writable);
    proxy.readable.pipeTo(conn.writable);

    tlsConn.readable.pipeTo(tlsConn.writable);
  } else {
    conn.readable.pipeTo(conn.writable);
    //await conn.write(encoder.encode('pong')); 
    conn.close();
  }
}