import "./lib.deno.d.ts";
import { StandardMethods } from "./std-methods.ts";
import { libOpt } from "./debug.ts";
import { ByteLib } from "./buffer.ts";

import * as compress from "jsr:@deno-library/compress";

const tx = new ByteLib;

export class HttpSocket extends StandardMethods {
  #engine; #tcp; #ra;
  #td; #te; #data;
  #server; #type;

  #closed = false;
  #upgraded = false;
  #isWebsocket = false;

  get enabled(): boolean { return !this.#isWebsocket && !this.#upgraded; };



  get tcpSocket() {
    if (!this.enabled) return this.#tcp;
  }
  get tcpData() {
    if (!this.enabled) return this.#data;
  }

  get engine() { return this.engine; }
  get socket() { return this; }
  get type() { return this.#type; }
  constructor(engine, td, te, tcp, server, data, type, remoteAddr) {
    super();

    this.#td = td;
    this.#te = te;
    this.#tcp = tcp;
    this.#data = data;
    this.#type = type;
    this.#ra = remoteAddr;
    this.#server = server;
    this.#engine = engine;

    //console.log(server);
    //console.log(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(server)));


    let encodings = this.client?.headers["accept-encoding"];
    //console.log("encodings",encodings,encodings&&encodings.includes("gzip"))
    if (encodings && encodings.includes("gzip")) this.compress = true; //CHANGE LATER
  }
  #client;
  get client(): Client | null {
    if (!this.enabled) return null;
    if (this.#client) return this.#client;
    let c = new class Client {
      isValid: boolean = false;
      err: void | object;
      headers: Record<string, string> = {};
      method: string;
      address: object;
      path: string;
      httpVersion: string;
      data: string;
      //proxied: boolean;
    }();
    c.address = this.#ra;

    try {
      let str = this.#td.decode(this.#data);
      let [h, cd] = str.split("\r\n\r\n");
      let [hd, ...hs] = h.split("\r\n");

      //console.log('engine h hd hs',h,hd,hs);
      for (let i of hs) {
        let hi = i.split(": ");
        c.headers[hi[0].toLowerCase()] = hi[1];
      }

      c.method = hd.split(" ")[0];
      c.path = hd.split(" ")[1];
      c.httpVersion = hd.split(" ")[2];
      c.data = cd;

      if (c.method && c.path && c.httpVersion) {
        if (c.path.startsWith("/") && c.httpVersion.startsWith("HTTP/")) {
          c.isValid = true;
        };
      };
    } catch (err) {
      c.err = err;
      this.emit("error", err);
    }

    Object.freeze(c);
    Object.seal(c);
    return this.#client = c;
  }
  status: number = 200;
  statusMessage: string = "OK";
  compress: boolean = false;
  encoding: string = "gzip";
  #sysHeaders: Record<string, string> = {
    "Connection": "close",
    "Keep-Alive": "timeout=5",
    "Date": new Date().toGMTString(),
  }
  #userHeaders: Record<string, string> = {
    "Content-Type": "text/html",
    //"Transfer-Encoding": "chunked",
    "Server": "TI-84 Plus CE-T Python Edition",
  };
  get #headers() { return { ...this.#userHeaders, ...this.#sysHeaders } };
  #headersSent = false;
  #headersPromise: Promise<void>;
  async #writeTcp(data) { if (libOpt.debug) console.log("write tcp", this.#td.decode(data), data)/*CHANGE LATER*/; return await this.#tcp.write(data).catch(e => e); };
  #headerString() {
    let headers: string[] = [];
    for (let k in this.#headers) {
      let v = this.#headers[k];
      headers.push(`${k}: ${v}`);
    }
    return `HTTP/1.1 ${this.status} ${this.statusMessage}\r\n${headers.join("\r\n")}\r\n\r\n`;
  }
  async #sendHeaders(length?: number): Promise<void> {
    if (!this.#headersSent) {
      let resolve;
      this.#headersPromise = new Promise(r => resolve = r);
      this.#headersSent = true;

      //this.#headers["Content-Length"]=length.toString();

      await this.#writeTcp(
        this.#te.encode(
          this.#headerString(),
        ),
      );
      resolve();
    } else {
      await this.#headersPromise;
    }
  }
  setHeader(a: string, b: string): boolean {
    if (!this.enabled) return false;
    if (this.#headersSent == true) return false;
    this.#userHeaders[a] = b;
    return true;
  }
  removeHeader(a: string): boolean {
    if (!this.enabled) return false;
    if (this.#headersSent == true) return false;
    if (this.#userHeaders[a]) return delete this.#userHeaders[a];
    return false;
  }
  writeHead(status?: number, statusMessage?: string, headers?: object): void {
    if (!this.enabled) return;
    if (this.#headersSent == true) return;
    if (status) this.status = status;
    if (statusMessage) this.statusMessage = statusMessage;
    if (headers) { for (let i in headers) this.#headers[i] = headers[i]; }
    //return this.#sendHeaders();
  }
  headers(): Record<string, string> { return { ...this.#headers }; }
  #written: number[] = [];
  async #writeChunk(buf: Uint8Array): Promise<void> {
    if (false && libOpt.debug) {
      console.log("chunk");
      console.log((buf.byteLength.toString(16) + "\r\n"));
      console.log(buf, this.#td.decode(buf));
      console.log("\r\n");
    };
    /*await this.#writeTcp(this.#te.encode(buf.byteLength.toString(16)+"\r\n"));
    await this.#writeTcp(buf);
    await this.#writeTcp(this.#te.encode("\r\n"));*/
    await this.#writeTcp(new Uint8Array([...this.#te.encode(buf.length.toString(16)), 13, 10, ...buf, 13, 10]));
  }
  async writeText(text: string): Promise<void> {
    if (!this.enabled) return;
    if (this.#closed) return;
    this.#sysHeaders["Transfer-Encoding"] = "chunked"//+this.compress?","+this.encoding:"";
    //this.#sysHeaders["Connection"]="keep-alive";
    let b = this.#te.encode(text);
    let w = b;
    this.#written.push(...b);
    if (false && this.compress && this.encoding == "gzip") {
      try {
        w = compress.gzip(b);
        this.#sysHeaders["Content-Encoding"] = "gzip";
        //this.setHeader("Content-Encoding", "gzip");
      } catch (err) {
        ;
      };
    }
    await this.#sendHeaders(w.length);
    await this.#writeChunk(w);
  }
  async writeBuffer(buffer: Uint8Array): Promise<void> {
    if (!this.enabled) return;
    if (this.#closed) return;
    this.#sysHeaders["Transfer-Encoding"] = "chunked";//+this.compress?","+this.encoding:"";
    //this.#sysHeaders["Connection"]="keep-alive";
    let b = buffer;
    let w = b;
    this.#written.push(...b);
    if (false && this.compress && this.encoding == "gzip") {
      try {
        w = compress.gzip(b);
        this.#sysHeaders["Content-Encoding"] = "gzip";
        //this.setHeader("Content-Encoding", "gzip");
      } catch (err) {
        ;
      };
    }
    await this.#sendHeaders(w.byteLength);
    await this.#writeChunk(w);
  }
  async close(data?: string | Uint8Array): Promise<void> {
    if (!this.enabled) return;
    if (this.#closed) return;
    //await this.#sendHeaders(0);
    let b = data;
    if (typeof b == "string") b = this.#te.encode(data);
    if (typeof b != "object") b = new Uint8Array();
    if (this.#headersSent) {
      if (b) await this.writeBuffer(b);
      await this.#writeTcp(new Uint8Array([48, 13, 10, 13, 10]));
    } else {
      let w = b;
      if (this.compress && this.encoding == "gzip") {
        try {
          w = compress.gzip(b);
          this.#sysHeaders["Content-Encoding"] = "gzip";
        } catch (err) {
          ;
        };
      };
      this.#sysHeaders["Content-Length"] = w.byteLength.toString();
      const head = this.#te.encode(this.#headerString());
      const pack = new Uint8Array(head.byteLength + w.byteLength);
      pack.set(head);
      pack.set(w, head.byteLength);

      await this.#writeTcp(pack);
    }
    if (b) this.#written.push(...b);
    this.#headersSent = true;
    if (false && this.#headers["Connection"] != "keep-alive") this.#tcp.close();
    this.#closed = true;
  }
  written(): Uint8Array { return new Uint8Array(this.#written); }
  deny(): void { if (!this.enabled) this.#tcp.close(); }

  #ws: WebSocket;
  async websocket(): Promise<WebSocket | null> {
    if (this.#closed) return null;
    if (this.#ws) return this.#ws;
    if (!this.enabled) return null;


    const args = [
      this.#engine,
      this.#td,
      this.#te,
      this.#tcp,
      this.#data,
      this,
    ];
    const ws: WebSocket = new this.#engine.WebSocket(...args)
    this.#ws = ws;
    let suc: boolean = await ws.init("http1");
    if (suc) {
      this.#isWebsocket = true;
      return ws;
    }
    else return null;
  };
  get isWebSocket() { return this.#isWebsocket };

  #http2: Http2Socket;
  async http2() {
    if (this.#closed) return null;
    if (this.#http2) return this.#http2;
    if (!this.enabled) return null;


    if (this.#client.isValid) {
      let upgd = this.#client.headers["upgrade"]?.trim();
      //if(!upgd)throw new Error("client does not wanna upgrade");
      let settH = this.#client.headers["http2-settings"]?.trim(); // can be ignored as client will send them again.


      let res = `HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: h2c\r\n\r\n`;

      await this.#tcp.write(this.#te.encode(res)).catch(e => e);


      const args = [
        this.#engine,
        this.#td,
        this.#te,
        this.#tcp,
        this.#data,
        this,
        this.#type,
        this.#ra,
      ];
      const http2: Http2Socket = new this.#engine.Http2Socket(...args);
      this.#http2 = http2;

      let suc: boolean = await http2.ready;
      if (suc) {
        this.#upgraded = true;
        return http2;
      }
      else return null;

    } else {
      this.emit("error", new Error("client is not valid"));
      return null
    }
    /*const args=[
      this.#engine,
      this.#td,
      this.#te,
      this.#tcp,
      this.#data,
      this,
      this.#ra,
    ];
    const http2:Http2Socket=new this.#engine.Http2Socket(...args);
    this.#http2=http2;
    //http2.on("error",e=>this.emit("error",e));
    let suc:boolean=await http2.ready;
    if(suc){
      this.#upgraded=true;
      return http2;
    }
    else return null;*/
  }
  //set isWebSocket(iws:boolean){if(iws)this.websocket();}
};