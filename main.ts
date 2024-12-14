import Engine from './engine.ts';
import * as http from './http-server.ts';
import docs from "./docs.d.ts";


const tcp: Engine=new Engine();
tcp.start();
tcp.on("connect",http.listener);

console.log('pid: ',Deno.pid);
await Deno.writeTextFile("last-pid.txt", Deno.pid);