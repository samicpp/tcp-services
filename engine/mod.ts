export * from "./mixer.ts";
export * as EngineLib from "./mixer.ts";

// type defs

/// <reference lib="deno.ns" />

// Basic event interface used by EngineReplacer.
interface Eventable {
    on(name: string, listener: (obj: any) => void | Promise<void>): void;
    emit(name: string, obj: any): void;
}

// A union of listener types.
export type AnyListener = Deno.TcpListener | Deno.TlsListener;

// TLS configuration options.
export interface TlsOptions {
    cert: string;
    key: string;
    ca?: string;
    alpnProtocols?: string[];
}

export namespace Engine {
    // EngineReplacer is an Eventable that exposes the networking classes.
    export interface EngineReplacer extends Eventable {
        readonly WebSocket: typeof import("./websocket.ts").WebSocket;
        readonly HttpSocket: typeof import("./http-socket.ts").HttpSocket;
        readonly Http2Socket: typeof import("./http2-socket.ts").Http2Socket;
        readonly readSize: number;
    }

    // Internal caches and server collections.
    export const _cache: any[];
    export const _servers: Array<Deno.TcpListener | Deno.TlsListener>;
    export const _proxied: { proxy: Deno.TcpListener }[];
    export const _proxies: [[number, string, TlsOptions?], AnyListener][];

    // TLS configuration object.
    export const _tls: TlsOptions;

    // Proxy-related flags.
    export const _proxyStarted: boolean;

    // Read size (default: 4 MiB).
    export const _readSize: number;

    // The engine instance, based on EngineReplacer.
    export const _this: Eventable;

    // General server settings.
    export const allowH2: boolean;
    export const host: string;
    export const pHost: string;
    export const pPort: number;
    export const pPort2: number;

    // Functions to update configuration.
    export function setTls(obj: TlsOptions | any): void;
    export function setReadSize(int: any): void;

    // Event emitter functions.
    export function _emit(eventName: string, obj: any): void;
    export function on(eventName: string, listener: (event: any) => void | Promise<void>): void;

    // Internal server creation functions.
    export function _int(port: number, address: string): Deno.TcpListener;
    export function _intTls(port: number, address: string, opt: TlsOptions): Deno.TlsListener;
    export function _server(port: number, host: string): Deno.TcpListener;
    export function _tlsServer(port: number, host: string): Deno.TlsListener;

    // Listener that handles new connections.
    export function _listener(
        server: AnyListener,
        conn: Deno.TcpConn,
        type: string,
        cacheId: number,
        remoteAddr: Deno.NetAddr
    ): Promise<void>;

    // Proxy handler functions.
    export function _proxyHandler(
        con: Deno.Conn,
        then: (conn: Deno.Conn, proxy: Deno.Conn) => void,
        except: (conn: Deno.Conn, proxy: Deno.Conn, e: any) => void
    ): Promise<void>;
    export function _startProxy(): Promise<void>;
    export function proxy(port: number): Promise<void>;

    // Main server startup function.
    export function start(port?: number, tls?: boolean, upgrade?: boolean): Promise<void>;


    // debug.ts
    export const libOpt: {
        debug: boolean,
        eventDbg: boolean,
    };
    export function setOpt(name: string, value: any): boolean;
}

//export = Engine;
