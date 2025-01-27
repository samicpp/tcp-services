// engine.ts

/**
 * Some standard methods for classes.
 */
interface StandardMethods{
    /**
     * Listens to a specific event.
     * 
     * @param name Name of the event.
     * @param listener Function that listens to the event.
     */
    on(name:string,listener:(event:HttpSocket|Http2Stream|Http2Socket|WsFrame|Error|any)=>void|Promise<void>):void;

    /**
     * Emits an event.
     * Heres a list of possible events:
     * 
     * @param name Event name.
     * @param object Event object wich listeners will be invoked with.
     * 
     * @event error Event which will be triggered when anything went wrong. Dispatched with `Error`.
     * @event nulldata Unique to Engine. Triggered when client didn't send any data.
     * @event frame Unique to WebSocket. Triggered when client sends a web socket frame. Dispatched with `WsFrame`.
     * @event connection Unique to Engine. Triggered when a client sends a HTTP request. Dispatched with `HttpSocket`.
     * @event stream Unique to Http2Socket. Triggered when a client has sent sufficient frames for a server response. Dispatched with `Http2Stream`.
     * @event close Unique to Http2Socket. Triggered when a client has sent a goaway frame. Dispatched with `Http2Frame`.
     * @event closed Unique to Http2Socket. Triggered when connection has closed. Dispatched with `Http2Socket`.
     * @event http2 Unique to Engine. Triggered when a client sends a http2 request without a http1 upgrade request first. Dispatched with `Http2Socket`.
     */
    emit(name:string,object:HttpSocket|Http2Stream|Http2Socket|Http2Frame|WsFrame|Error|any):void;
}

/**
 * Engine: The main server interface for managing TCP, HTTP, and WebSocket connections.
 * 
 * Note: Properties or methods marked as `should not be used` are intended 
 * only for internal API use or modifications and should be avoided in normal scenarios.
 */
interface Engine extends StandardMethods{
    /**
     * The address the server will listen on (e.g., `0.0.0.0` for all available interfaces).
     */
    host: string;

    /**
     * The port the server will listen on (e.g., `8080`).
     */
    port: number;

    /**
     * The maximum number of bytes read from the client per operation.
     */
    readSize: number;

    /**
     * Internal TCP listener instance.
     * @internal This property should not be accessed directly.
     */
    readonly server: Deno.TcpListener;

    /**
     * Starts the server on the specified or preconfigured port.
     * Can be invoked multiple times for restarting the server.
     * 
     * @param port Optional. Port to start the server on. Defaults to `Engine.port` if not provided.
     */
    start(port?: number, tls?: TlsOptions): Promise<void>;
    
    /**
     * Starts a proxy on the specified port. 
     * The proxy does not interfere with the ip address unless it forwards to external services.
     * Can be invoked multiple times.
     * 
     * @param port Port to start the proxy on.
     */
    proxy(port: number): Promise<void>;

    /**
     * Attaches an event listener for server events.
     * 
     * Supported events:
     * - `connection`: Triggered when a new client connects. Provides a `HTTPSocket` instance.
     * - `null data`: Triggered when a new client doesn't send any data. Provides a `TcpConn` instance.
     * - `error`: Triggered when an error was caught in a function. Provides an `Error` instance.
     * 
     * @param event The name of the event to listen for.
     * @param listener The callback function to invoke with event data.
     * 
     * on(event: 'connection', listener: (data: HttpSocket | any) => void): void;
     */
    

    /**
     * Internal HTTPSocket class reference.
     * @internal This property should not be accessed directly.
     */
    readonly Socket: HttpSocket;

    /**
     * Internal WebSocket class reference.
     * @internal This property should not be accessed directly.
     */
    readonly WebSocket: WebSocket;
}

/**
 * TlsOptions: In here there are properties needed to make a tls server
 * 
 * @property cert The tls certificate
 * @property key The tls certificate key
 */
interface TlsOptions{
    cert: string,
    key: string,
    ca?: string,
    alpnProtocols?: string[],
}

/**
 * HTTPSocket: Represents a single client connection, providing HTTP request and response handling.
 */
interface HttpSocket extends StandardMethods {
    /**
     * Internal TCP connection for the client.
     * @internal This property should not be accessed directly.
     */
    readonly tcpSocket: Deno.TcpConn;

    /**
     * Raw TCP data received from the client.
     * @internal This property should not be accessed directly.
     */
    readonly tcpData: ArrayBuffer;

    /**
     * A self-reference to this HTTPSocket instance for destructuring purposes.
     * Typically used in `{ socket, client }` patterns.
     */
    readonly socket: HttpSocket;

    /**
     * Metadata about the client making the request.
     */
    readonly client: Client;

    /**
     * Indicates if the current connection has been upgraded to a WebSocket.
     */
    readonly isWebSocket: boolean;

    /**
     * Indicates if the current connection is over tls or plain tcp.
     * @value tcp Plain tcp.
     * @value tcp::tls Tls over tcp.
     */
    readonly type: string;

    /**
     * Indicates if this object is still being used for a response.
     */
    readonly enabled: boolean;

    

    /**
     * HTTP response status code (e.g., 200 for success).
     */
    status: number;

    /**
     * HTTP response status message (e.g., `OK` for 200).
     */
    statusMessage: string;

    /**
     * Enables response compression. Should always be `true`.
     */
    compress: boolean;

    /**
     * Encoding type for the response. Currently non-functional and marked for removal.
     * @deprecated This property will be removed in future versions.
     */
    encoding: string;

    /**
     * Sets a single HTTP header for the response.
     * 
     * @param name The name of the header.
     * @param value The value of the header.
     * @returns `true` if the header was successfully set, `false` otherwise.
     */
    setHeader(name: string, value: string): boolean;

    /**
     * Removes a single HTTP header from the response.
     * 
     * @param name The name of the header.
     * @returns `true` if the header was successfully removed, `false` otherwise.
     */
    removeHeader(name: string): boolean;

    /**
     * Sets multiple HTTP headers and optionally the status code and message.
     * 
     * @param status Optional. HTTP status code.
     * @param statusMessage Optional. HTTP status message.
     * @param headers Optional. Key-value pairs of headers to set.
     * @returns `true` if headers were successfully set, `false` otherwise.
     */
    writeHead(status?: number, statusMessage?: string, headers?: object): boolean;

    /**
     * Returns all headers as an object
     */
    headers(): Record<string,string>;

    /**
     * Sends a plain text response to the client and finalizes the headers.
     * 
     * @param text The text content to send.
     */
    writeText(text: string): Promise<void>;

    /**
     * Sends a binary response to the client and finalizes the headers.
     * 
     * @param buff The binary data to send.
     */
    writeBuffer(buff: ArrayBuffer): Promise<void>;

    /**
     * Closes the connection with an optional final message or data.
     * 
     * @param data Optional. Data to send before closing the connection.
     */
    close(data?: ArrayBuffer | string): Promise<void>;

    /**
     * Returns the written response body as buffer.
     */
    written(): Uint8Array;

    /**
     * Immediately terminates the connection without sending additional data.
     * This is equivalent to forcefully dropping the TCP connection.
     */
    deny(): void;

    /**
     * Upgrades the current HTTP connection to a WebSocket.
     * 
     * @returns A `WebSocket` instance if successful, otherwise `void`.
     */
    websocket(): Promise<WebSocket | void>;

    /**
     * Upgrade the current connection to HTTP2
     * 
     * @returns A `Http2Socket` instance if successful, otherwise `void`.
     */
    http2(): Promise<Http2Socket | void>;
}

/**
 * Client: Represents metadata about the client making the request.
 */
interface Client {
    /**
     * Indicates whether the client data could be parsed successfully.
     */
    readonly isValid: boolean;

    /**
     * Contains error details if the client data could not be parsed.
     */
    readonly err: void | object;

    /**
     * A map of client headers, with all header names in lowercase.
     */
    readonly headers: Record<string, string>;

    /**
     * The HTTP method used by the client (e.g., `GET`, `POST`).
     */
    readonly method: string;

    /**
     * Network address information of the client.
     */
    readonly address: Deno.NetAddr;

    /**
     * The requested path from the client (e.g., `/index.html`).
     */
    readonly path: string;

    /**
     * The HTTP version used by the client (e.g., `HTTP/1.1`).
     */
    readonly httpVersion: string;

    /**
     * The body data sent by the client.
     * Note: This will be populated even for `GET` requests.
     */
    readonly data: string;
}

/**
 * WebSocket: Represents a WebSocket connection.
 */
interface WebSocket extends StandardMethods{
    /**
     * Indicates whether the WebSocket connection is ready for use.
     */
    readonly isReady: boolean;

    /**
     * A promise that resolves when the WebSocket is ready for use.
     */
    readonly ready: Promise<boolean>;

    /**
     * Indicates if the WebSocket is actively listening for incoming messages.
     */
    readonly listening: boolean;

    /**
     * The maximum number of bytes read per WebSocket frame.
     */
    readSize: number;

    /**
     * Initializes the websocket and attempts upgrade if not `none` specified.
     * @param type The type of conenction it was before. Is either `http1`, `http2`, `http3` or `none`.
     */
    init(type: string): Promise<boolean>;

    /**
     * Sends a text frame to the WebSocket client.
     * 
     * @param data The text or binary data to send.
     */
    sendText(data: string | Uint8Array): Promise<void>;

    /**
     * Sends a binary frame to the WebSocket client.
     * 
     * @param data The binary data to send.
     */
    sendBinary(data: string | Uint8Array): Promise<void>;

    /**
     * Sends a ping frame to the WebSocket client.
     * 
     * @param data The optional data to include in the ping frame.
     */
    ping(data: string | Uint8Array): Promise<void>;

    /**
     * Sends a pong frame to the WebSocket client.
     * 
     * @param data The optional data to include in the pong frame.
     */
    pong(data: string | Uint8Array): Promise<void>;

    /**
     * Closes the WebSocket connection.
     * 
     * @param code The code that will be sent in the close frame.
     * @param message The data for the human readable reason for closing.
     */
    close(code?: number, message?: string|Uint8Array): Promise<void>;

    /**
     * Kills the tcp connection.
     * Will also invoke WebSocket.close if not invoked already.
     */
    end(): Promise<void>;

    /**
     * Attaches an event listener for WebSocket events.
     * 
     * Supported events:
     * - `frame`: Triggered when a new WebSocket frame is received. Provides a `WsFrame` instance.
     * - `error`: Triggered when the listener stops due to an error. Provides an `Error` instance.
     * - `emit-err`: Triggered when the internal emit function couldn't invoke a listener. Provides an `Error` instance.
     * 
     * @param event The name of the event to listen for.
     * @param listener The callback function to invoke with event data.
     * on(event: string, listener: (data: WsFrame | Error | any) => void): void;
     */
    
}

/**
 * WsFrame: Represents a single WebSocket frame.
 */
interface WsFrame {
    /**
     * Indicates if this frame is the final frame in a sequence.
     */
    readonly fin: boolean;

    /**
     * The opcode of the frame (e.g., 1 for text, 2 for binary).
     */
    readonly opcode: number;

    /**
     * The payload data of the frame.
     */
    readonly payload: Uint8Array;

    /**
     * The textual name of the frame's opcode.
     */
    readonly opname: string;

    /**
     * The property containing closing information.
     * 
     * @property Code contains the closing code.
     * @property Message contains the closing message.
     */
    readonly close: { readonly code:number, readonly message:Uint8Array};
}

/**
 * Used for HTTP2
 */
interface Http2Socket extends StandardMethods{
    /**
     * The maximum number of bytes to read per tcp packet.
     */
    readSize: number;

    /**
     * Update the readsize after its been modified
     */
    updateSize(size?: number): void;

    /**
     * Returns a promise which will be fullfilled when the socket is ready. Will be fullfilled with false if anything went wrong.
     */
    readonly ready:Promise<boolean>;

    /**
     * In here you can set and modify the settings for the whole connection of the server.
     */
    ownSettings:Record<string|number,number>;

    /**
     * Sends the servers settings for the whole connection. Returns true if succesful
     */
    sendSettings():Promise<void>;

    /**
     * Is true when client allows server push (aka PROMISE_PUSH).
     */
    readonly pushEnabled:boolean;

    /**
     * Indicates if the current connection is over tls or plain tcp.
     * @value tcp Plain tcp.
     * @value tcp::tls Tls over tcp.
     */
    readonly type: string;

    /**
     * Listens for a specific event
     * 
     * Used events:
     *  - `error`: If anything goes wrong this is invoked.
     * on(event: string, listener: (event:any|unknown)=>void|Promise<void>);
     */
    
    /**
     * Containts the HTTP2 preface
     * static readonly magic:string;
     */
}

/**
 * Used for HTTP2
 */
interface Http2Frame{
    /**
     * A collection of properties used for processing. Under normal circumstances shouldn't be used.
     */
    readonly raw:{
        readonly length: number[],
        readonly type: number,
        readonly flags: number,
        readonly stream: number[],
        readonly payload: number[],
    },

    /**
     * The type of the frame stored as string
     */
    readonly type: string,

    /**
     * The frame flags as strings.
     */
    readonly flags: string[],

    /**
     * The payload length
     */
    readonly length: number,

    /**
     * The frame's stream ID.
     */
    readonly streamId: number,

    /**
     * The frames payload as buffer. When the frame is of type settings or headers it shouldn't be used.
     */
    readonly buffer:Uint8Array,

    /**
     * The headers sent by the frame if applicable.
     */
    readonly headers:Record<string,string>,

    /**
     * Containts the error code, target stream ID and optional message if applicable
     */
    readonly error:{
        readonly streamId:number;
        readonly code:number;
        readonly message:Uint8Array;
    };

    /**
     * The settings sent by the frame if applicable.
     * 
     * @property str An object with the settings where the property is the string form of the setting.
     * @property int An object with the settings where the property is the integer form of the setting.
     */
    readonly settings:{readonly str:Record<string,number>,readonly int:Record<number,number>},
}

/**
 * HTTP2
 */
interface Http2Stream extends StandardMethods{
    /**
     * Status to be sent.
     */
    status:number;

    /**
     * Sets a single header.
     */
    setHeader(name:string,value:string):void;

    /**
     * Removes a single header.
     */
    removeHeader(name:string,value:string):void;

    /**
     * Indicates the window size, so how much data can still be written. Used for flow control.
     */
    readonly sizeLeft:number;

    /**
     * Sends a data frame to the client and sends the headers.
     */
    write(data:string|Uint8Array):Promise<boolean>;

    /**
     * Sends a data frame to the client with an end stream flag and sends the headers.
     */
    close(data:string|Uint8Array):Promise<boolean>;

    /**
     * Performs a PUSH_PROMISE. Resolves with true if successful. If not, false.
     * @param requestHeaders The request headers needed for PUSH_PROMISE
     * @param headers The response headers of the server push
     * @param data The content in the server push
     */
    push(requestHeaders:Record<string,string>,headers:Record<string,string>,data:string|Uint8Array):Promise<boolean>;

    /**
     * Resets the stream. Resolves with true if successful.
     */
    reset():Promise<boolean>;

    /**
     * Returns object with similar methods to HttpSocket. Used for backwards compatibility.
     */
    pseudo():PseudoHttpSocket;

    /**
     * Indicates wether the response will be compressed. 
     */
    readonly compress: boolean;
}

/**
 * HTTP2
 */
interface PseudoHttpSocket extends StandardMethods{
    /**
     * A self-reference to this HTTPSocket instance for destructuring purposes.
     * Typically used in `{ socket, client }` patterns.
     */
    readonly socket: PseudoHttpSocket;

    /**
     * Metadata about the client making the request.
     */
    readonly client: PseudoClient;

    /**
     * Indicates if the current connection has been upgraded to a WebSocket.
     * @value Will always be false.
     */
    readonly isWebSocket: boolean;

    /**
     * Indicates if the current connection is over tls or plain tcp.
     * @value tcp Plain tcp.
     * @value tcp::tls Tls over tcp.
     */
    readonly type: string;

    /**
     * Indicates if this object is still being used for a response.
     */
    readonly enabled: boolean;

    /**
     * HTTP response status code (e.g., 200 for success).
     */
    status: number;

    /**
     * Only here for backwards compatibility.
     */
    statusMessage: string;

    /**
     * Indicates wether the response will be compressed. 
     */
    readonly compress: boolean;

    /**
     * Sets a single HTTP header for the response.
     * 
     * @param name The name of the header.
     * @param value The value of the header.
     * @returns `true` if the header was successfully set, `false` otherwise.
     */
    setHeader(name: string, value: string): boolean;

    /**
     * Removes a single HTTP header from the response.
     * 
     * @param name The name of the header.
     * @returns `true` if the header was successfully removed, `false` otherwise.
     */
    removeHeader(name: string): boolean;

    /**
     * Sets multiple HTTP headers and optionally the status code and message.
     * 
     * @param status Optional. HTTP status code.
     * @param statusMessage Optional. HTTP status message.
     * @param headers Optional. Key-value pairs of headers to set.
     * @returns `true` if headers were successfully set, `false` otherwise.
     */
    writeHead(status?: number, statusMessage?: string, headers?: object): boolean;

    /**
     * Returns all headers as an object
     */
    headers(): Record<string,string>;

    /**
     * Sends a plain text response to the client and finalizes the headers.
     * 
     * @param text The text content to send.
     */
    writeText(text: string): Promise<void>;

    /**
     * Sends a binary response to the client and finalizes the headers.
     * 
     * @param buff The binary data to send.
     */
    writeBuffer(buff: ArrayBuffer): Promise<void>;

    /**
     * Closes the connection with an optional final message or data.
     * 
     * @param data Optional. Data to send before closing the connection.
     */
    close(data?: ArrayBuffer | string): Promise<void>;

    /**
     * Returns the written response body as buffer.
     */
    written(): Uint8Array;

    /**
     * Resets stream.
     */
    deny(): void;

    /**
     * Upgrades the current HTTP connection to a WebSocket.
     * 
     * @returns A `WebSocket` instance if successful, otherwise `void`.
     */
    websocket(): Promise<WebSocket | void>;

    /**
     * Returns the HTTP2 socket
     */
    http2(): Promise<Http2Socket | void>;
}

/**
 * HTTP2
 */
interface Client2{
    /**
     * Contains the request body if applicable.
     */
    readonly body:Uint8Array;

    /**
     * Contains the request headers.
     */
    readonly headers:Record<string,string>;

    /**
     * IP information about the client.
     */
    readonly remoteAddr:Deno.NetAddr;
}

/**
 * HTTP2
 */
interface PseudoClient{
    /**
     * Only here for backwards compat.
     * @value Is always true.
     */
    readonly isValid:boolean;

    /**
     * Will always be void.
     */
    readonly err: void;

    /**
     * A map of client headers, with all header names in lowercase.
     */
    readonly headers: Record<string, string>;

    /**
     * The HTTP method used by the client (e.g., `GET`, `POST`).
     */
    readonly method: string;

    /**
     * Network address information of the client.
     */
    readonly address: Deno.NetAddr;

    /**
     * The requested path from the client (e.g., `/index.html`).
     */
    readonly path: string;

    /**
     * The HTTP version used by the client (e.g., `HTTP/1.1`).
     * @value Is always `HTTP/2`.
     */
    readonly httpVersion: string;

    /**
     * The body data sent by the client.
     * Note: This will be populated even for `GET` requests.
     */
    readonly data: string;
}

/**
 * An example for using this framework is located in example.ts
 */

/*

import Engine from "./engine.ts";

const engine: Engine=new Engine();
engine.port=80;
engine.host="0.0.0.0";
engine.on("connection",async function({socket,client}: HTTPSocket): Promise<void>{
    if(client.isValid){
        socket.status=400;
        socket.statusMessage="Bad Request";
        socket.close("Cannot read client request");
    } else {
        if(client.path=="/"){
            socket.close("hello");
        }
    }
});

*/

// http-server.ts
interface SpecialURL extends URL{
    /**
     * In here is the directory in which it will look for files
     */
    readonly tardir: string;
}