import Engine from './engine.ts';
import * as http from './http-server.ts';
import docs from "./docs.d.ts";

let tlsopt: TlsOptions={
    key: Deno.readTextFileSync("D:\\privkey.pem"),
    cert: Deno.readTextFileSync("D:\\fullchain.pem"),
    ca: Deno.readTextFileSync("D:\\chain.pem"),
};

console.log(tlsopt);

const tcp: Engine=new Engine();
tcp.start(80);
tcp.start(443, tlsopt);
tcp.on("connect",http.listener);
tcp.on("null data",e=>console.log("no data"))

console.log('pid: ',Deno.pid);
await Deno.writeTextFile("last-pid.txt", Deno.pid);