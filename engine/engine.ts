import "./lib.deno.d.ts";
import { Eventable } from "./standard.ts";
//import { libOpt, setOpt } from "./debug.ts";
//import { ByteLib } from "./buffer.ts";
import { HttpSocket as Socket } from "./http-socket.ts";
import { Http2Socket as Socket2 } from "./http2-socket.ts";
//import { WebSocket } from "./websocket.ts";

//const tx=new ByteLib;
//const servers:Deno.TcpListener[]=[];
export type AnyListener = Deno.TcpListener | Deno.TlsListener;
export interface TlsOptions{
    cert: string,
    key: string,
    ca?: string,
    alpnProtocols?: string[],
}

//export const _eventTarget: Eventable=new Eventable;
export const _servers: Array<Deno.TcpListener | Deno.TlsListener> = [];
export const _cache: any[] = [];
export const _tls: TlsOptions = {
    cert: "",
    key: "",
    ca: "",
    alpnProtocols: [""],
};
export const _proxies: [[number, string, TlsOptions?], AnyListener][] = [];
export const _proxied: {proxy:Deno.TcpListener}[] = [];

export function setTls(obj: TlsOptions | any) {
    _tls.cert = obj?.cert || _tls.cert;
    _tls.key = obj?.key || _tls.key;
    _tls.ca = obj?.ca || _tls.ca;
    _tls.alpnProtocols = obj?.alpnProtocols || _tls.alpnProtocols;
};

export var host: string = "0.0.0.0";
export var allowH2: boolean = true;

export var _proxyStarted = false;
export var pHost: string = "0.0.0.0";
export var pPort: number = 1;
export var pPort2: number = 2;

export const _this: Eventable = new class EngineReplacer extends Eventable{} 


export function _server(port: number, host: string) {
    let i = _servers.push(
        Deno.listen({ port, host })
    );
    return _servers[i - 1];
};
export function _tlsServer(port: number, host: string) {
    //return this.#Deno.listenTls({ port: this.port, host: this.host, ...this.tls });
    let i = _servers.push(
        Deno.listenTls({ port, host, ..._tls })
    );
    return _servers[i - 1];
};
export function _int(port:number, address:string) {
    return Deno.listen({ port, address });
};
export function _intTls(port: number, address: string, opt: TlsOptions) {
    return Deno.listenTls({ port, address, ...opt });
}


export async function _startProxy() {
    if (!_proxyStarted) {
        _proxyStarted = true;
        let opt: [number, string] = [pPort, pHost];
        _proxies.push([opt, await _int(...opt)]);
        if (_tls) {
            let opt: [number, string, TlsOptions] = [pPort2, pHost, _tls];
            _proxies.push([opt, await _intTls(...opt)]);
        };
        /*this.#conf = {
            intHost: this.intHost,
            intPort: this.intPort,
            intTlsPort: this.intTlsPort,
            intTlsOpt: this.intTlsOpt,
        };*/
    };
}
export async function _proxyHandler(con, then, except) {
    try {
        const buf = new Uint8Array(_readSize);
        const len = await con.read(buf);
        const buff = buf.subarray(0, len);

        if (buff[0] == 22 && _proxies[1]) { // tls
            //console.log("\x1b[31mtls\x1b[0m"); // :REMOVE:

            const proxy = await Deno.connect({ port: _proxies[1][0][0] });
            const tlsConn = await _proxies[1][1].accept();

            proxy.write(buff);
            con.readable.pipeTo(proxy.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));
            proxy.readable.pipeTo(con.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));

            _listener(_proxies[1][1], tlsConn, "tcp::tls", -1, con.remoteAddr);
        } else { // anything else
            //console.log("\x1b[31manything else\x1b[0m"); // :REMOVE:

            const proxy = await Deno.connect({ port: _proxies[0][0][0] });
            const conn = await _proxies[0][1].accept();

            proxy.write(buff);
            con.readable.pipeTo(proxy.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));
            proxy.readable.pipeTo(con.writable).then(then.bind(null, con, proxy)).catch(except.bind(null, con, proxy));

            _listener(_proxies[0][1], conn, "tcp", -1, con.remoteAddr);
        }
    } catch (err) {
        _emit("error", err);
    }
}
export async function proxy(port: number) {
    try {
        await _startProxy();

        function except(conn, proxy, e) {/*conn.close();proxy.close();*/return e };
        function then(conn, proxy, e) {/*conn.close();proxy.close();*/return e };

        const proxy = Deno.listen({ port, host: pHost });
        _proxied.push({ proxy });

        for await (const con of proxy) {
            _proxyHandler(con, then, except);
        }
    } catch (err) {
        _emit("error", err);
    }
}

export async function start(port?: number, tls?: boolean, upgrade?: boolean): Promise<void> {
    /*if (upgrade) this.upgrade = upgrade;
    if (port) this.port = port;
    if (tls) this.tls=tls;*/
    if (!port) port = Math.floor(Math.random() * 65534 + 1);

    const server = tls ? _tlsServer(port, host) : _server(port, host);
    const type = tls ? (tls ? "tcp::tls" : "tcp") : "tcp";
    const cacheId = _cache.push({
        tls,
        port,
        upgrade,
        get readSize() { return _readSize },
    }) - 1;
    //console.log('server created on',this.port)
    for await (const conn of server) {
        //conn.readable.pipeTo(conn.writable);
        _listener(server, conn, type, cacheId);
    }
}


export var _readSize = 4 * 1024 ** 2; // 4MiB
export function setReadSize(int: any) {
    _readSize = parseInt(int);
}
//get readSize(): number { return this.#readSize };


export async function _listener(server, conn: Deno.TcpConn, type: string, cacheId: number, remoteAddr = conn.remoteAddr): Promise<void> {
    //console.log("connection",remoteAddr);
    //conn.accept();
    const encoder = new TextEncoder;
    const decoder = new TextDecoder;
    //const tx=new ByteLib;
    //const cache = this.#cache[cacheId];
    let dat = new Uint8Array(_readSize);
    //console.log('incoming connection',conn);
    let err = null;
    const length = await conn.read(dat).catch(e => err = e);
    if (typeof length != "number" || length <= 0) return _emit("nulldata", { conn, length, err });
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
    if (allowH2 && Socket2.magicBuffer.every((v, i) => data[i] == v)) {
        // http2
        //console.log("\x1b[31mhttp2\x1b[0m"); // :REMOVE:
        const socket = new Socket2(_this, decoder, encoder, conn, data, null, type, remoteAddr);
        _emit("http2", socket);
    }
    else {
        //console.log("\x1b[31mhttp1\x1b[0m"); // :REMOVE:
        const socket = new Socket(_this, decoder, encoder, conn, server, data, type, remoteAddr);
        _emit("connect", socket);
    }
};

export function on(eventName: string, listener: (event: any) => void | Promise<void>){ return _this.on(eventName, listener) };
export function _emit(eventName: string, obj: any){ return _this.emit(eventName, obj) };


//export { libOpt, setOpt } from "./debug.ts";