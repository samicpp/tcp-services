import "./lib.deno.d.ts";
import { Eventable as StandardMethods } from "./standard.ts";
//import { libOpt, setOpt } from "./debug.ts";
//import { ByteLib } from "./buffer.ts";
import { HttpSocket } from "./http-socket.ts";
import { Http2Socket } from "./http2-socket.ts";
import { WebSocket } from "./websocket.ts";

//const tx=new ByteLib;
//const servers:Deno.TcpListener[]=[];

export class Engine extends StandardMethods {
  //#Deno = Deno;
  //deno = this.#Deno;
  #te = new TextEncoder();
  #td = new TextDecoder();
  #servers: any[] = [];
  #cache: any[] = [];
  #tls: TlsOptions;

  //port: number = 80;
  host: string = "0.0.0.0";
  //tls: TlsOptions;
  get tls() { return this.#tls };
  set tls(tls: TlsOptions) { this.#tls = tls };
  //upgrade: boolean;
  allowH2: boolean = true;


  //new
  proxied: boolean = false;

  pHost: string = "0.0.0.0";

  intPort: number = 1;
  intHost: string = "127.0.0.1";
  intTlsPort: number = 2;
  intTlsOpt: TlsOptions = {
    ca: "",
    key: "",
    cert: "",
  };

  #conf: { intHost: string, intPort: number, intTlsPort: number, intTlsOpt: TlsOptions }; // ?


  #server(port: number, host: string) {
    let i = this.#servers.push(
      Deno.listen({ port, host })
    );
    return this.#servers[i - 1];
  }
  #tlsServer(port: number, host: string) {
    //return this.#Deno.listenTls({ port: this.port, host: this.host, ...this.tls });
    let i = this.#servers.push(
      Deno.listenTls({ port, host, ...this.#tls })
    );
    return this.#servers[i - 1];
  }

  constructor(/*intPort?:number,intTlsPort?:number,intTlsOpt?:TlsOptions*/tls?: TlsOptions) {
    super();
    /*if(arguments.length>0){
      this.proxied=true;
      this.intPort=intPort;
      this.intTlsPort=intTlsPort;
      this.intTlsOpt=intTlsOpt;
    };*/
    if (tls) {
      this.#tls = tls;
    }
  }

  async #int(port, address) {
    return Deno.listen({ port, address });
  }
  async #intTls(port, address, opt) {
    return Deno.listenTls({ port, address, ...opt });
  }
  #proxyStarted = false;
  #proxies: any[] = [];
  #proxied: any[] = [];
  async#startProxy() {
    if (!this.#proxyStarted) {
      this.#proxyStarted = true;
      let opt: [number, string] = [this.intPort, this.intHost];
      this.#proxies.push([opt, await this.#int(...opt)]);
      if (this.intTlsOpt) {
        let opt: [number, string, TlsOptions] = [this.intTlsPort, this.intHost, this.intTlsOpt];
        this.#proxies.push([opt, await this.#intTls(...opt)]);
      };
      this.#conf = {
        intHost: this.intHost,
        intPort: this.intPort,
        intTlsPort: this.intTlsPort,
        intTlsOpt: this.intTlsOpt,
      };
    };
  }
  async#proxyHandler(con, then, except) {
    try {
      const buf = new Uint8Array(this.readSize);
      const len = await con.read(buf);
      const buff = buf.subarray(0, len);

      if (buff[0] == 22 && this.#proxies[1]) { // tls
        //console.log("\x1b[31mtls\x1b[0m"); // :REMOVE:

        const proxy = await Deno.connect({ port: this.#proxies[1][0][0] });
        const tlsConn = await this.#proxies[1][1].accept();

        proxy.write(buff);
        con.readable.pipeTo(proxy.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));
        proxy.readable.pipeTo(con.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));

        this.#listener(this.#proxies[1][1], tlsConn, "tcp::tls", -1, con.remoteAddr);
      } else { // anything else
        //console.log("\x1b[31manything else\x1b[0m"); // :REMOVE:

        const proxy = await Deno.connect({ port: this.#proxies[0][0][0] });
        const conn = await this.#proxies[0][1].accept();

        proxy.write(buff);
        con.readable.pipeTo(proxy.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));
        proxy.readable.pipeTo(con.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));

        this.#listener(this.#proxies[0][1], conn, "tcp", -1, con.remoteAddr);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }
  async proxy(port: number) {
    try {
      await this.#startProxy();

      function except(conn, proxy, e) {/*conn.close();proxy.close();*/return e };
      function then(conn, proxy, e) {/*conn.close();proxy.close();*/return e };

      const proxy = Deno.listen({ port, host: this.pHost });
      this.#proxied.push({ proxy });

      for await (const con of proxy) {
        this.#proxyHandler(con, then, except);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }

  async start(port?: number, tls?: boolean, upgrade?: boolean): Promise<void> {
    /*if (upgrade) this.upgrade = upgrade;
    if (port) this.port = port;
    if (tls) this.tls=tls;*/
    if (!port) port = Math.floor(Math.random() * 65534 + 1);

    const server = tls ? this.#tlsServer(port, this.host) : this.#server(port, this.host);
    const type = tls ? (tls ? "tcp::tls" : "tcp") : "tcp";
    const cacheId = this.#cache.push({
      tls,
      port,
      upgrade,
      get readSize() { return this.readSize },
    }) - 1;
    //console.log('server created on',this.port)
    for await (const conn of server) {
      //conn.readable.pipeTo(conn.writable);
      this.#listener(server, conn, type, cacheId);
    }
  }


  #readSize = 4 * 1024 ** 2; // 4MiB
  set readSize(int: any) {
    this.#readSize = parseInt(int);
  }
  get readSize(): number { return this.#readSize };

  #Socket = HttpSocket;
  #WebSocket = WebSocket;
  #Socket2 = Http2Socket;


  async #listener(server, conn: Deno.Conn, type: string, cacheId: number, remoteAddr = conn.remoteAddr): Promise<void> {
    //console.log("connection",remoteAddr);
    //conn.accept();
    const encoder = new TextEncoder;
    const decoder = new TextDecoder;
    //const tx=new ByteLib;
    //const cache = this.#cache[cacheId];
    let dat = new Uint8Array(this.readSize);
    //console.log('incoming connection',conn);
    let err = null;
    const length = await conn.read(dat).catch(e => err = e);
    if (typeof length != "number" || length <= 0) return this.emit("nulldata", { conn, length, err });
    const data = dat.slice(0, length);

    if (false/*&&cache.upgrade&&data[0]==22*/) {
      /*
      const tlsConn=new this.#Deno.TlsConn(conn,{
        ...cache.tls,
        caCerts: cache.tls.ca
      });
      //console.log(tlsConn.writable);
      await tlsConn.handshake();
      //*let w=tlsConn.writable.getWriter();
      //console.log(data);
      //await w.write(data).catch(e=>e); 
      //await w.releaseLock();
      //await w.close().catch(e=>e);
      //console.log(w);

      let dat=new Uint8Array(cache.readSize);
      const length2 = await conn.read(dat).catch(e=>err=e);
      if(typeof length2!="number"||length2<=0)return this.#emit("null data", {tlsConn,length2,err});
      const data2 = dat.slice(0, length2);
      const type=`tcp::tls`
      const socket = new this.#Socket(this,decoder, encoder, tlsConn, server, data2, type);
      this.#emit("connect", socket);
      */
    }
    //console.log(data);
    //console.log(this.allowH2,this.#Socket2.magicBuffer.every((v,i)=>data[i]==v),data.subarray(0,24));
    if (this.allowH2 && this.#Socket2.magicBuffer.every((v, i) => data[i] == v)) {
      // http2
      //console.log("\x1b[31mhttp2\x1b[0m"); // :REMOVE:
      const socket = new this.#Socket2(this, decoder, encoder, conn, data, null, type, remoteAddr);
      this.emit("http2", socket);
    }
    else {
      //console.log("\x1b[31mhttp1\x1b[0m"); // :REMOVE:
      const socket = new this.#Socket(this, decoder, encoder, conn, server, data, type, remoteAddr);
      this.emit("connect", socket);
    }
  };
  get HttpSocket() { return this.#Socket; };
  get Http2Socket() { return this.#Socket2; };
  get WebSocket() { return this.#WebSocket; };
  /*__getSocket(secid: SecureID){
    if(sec!=secid)return null;
    else return this.#WebSocket;
  };*/

  private(name: string) {
    switch (name) {
      case '#proxies':
        return this.#proxies;
      case '#proxied':
        return this.#proxied;
      default:
        return this[name];
    }
  };
};


export { libOpt, setOpt } from "./debug.ts";