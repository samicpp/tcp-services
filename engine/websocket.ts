import "./lib.deno.d.ts";
import { StandardMethods } from "./std-methods.ts";
import { libOpt } from "./debug.ts";
import { ByteLib } from "./buffer.ts";

import { encode as base64Encode } from "https://deno.land/std@0.97.0/encoding/base64.ts";
import { createHash } from "https://deno.land/std@0.97.0/hash/mod.ts";

export class WebSocket extends StandardMethods {
    #engine; #tcp;
    #td; #te; #data;
    #socket; #isReady = false;
    #ready; #readyPro; #err = null;

    get err(): Error | null {
        return this.#err;
    };

    get ready(): Promise<boolean> {
        return this.#readyPro;
    };
    get isReady(): boolean {
        return this.#isReady;
    }

    #readSize = 1024 * 10;
    set readSize(int: any) {
        this.#readSize = parseInt(int);
    }
    get readSize(): number { return this.#readSize };

    constructor(engine, td, te, tcp, data, socket) {
        super();

        this.#td = td;
        this.#te = te;
        this.#tcp = tcp;
        this.#data = data;
        this.#engine = engine;
        this.#socket = socket;

        //let resolve;
        //this.#readyPro=new Promise(r=>resolve=r);
        //this.#ready=resolve;

        this.readSize = engine.readSize;

        //this.#init();
    }



    async init(type: string) {
        if (!this.#readyPro) return this.#readyPro = this.#init(type);
        else return await this.#readyPro
    }
    get #magicString() { return "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" }
    async#init(type: string) {
        try {
            let client: Client = this.#socket.client;
            if (client.isValid) {
                if (type == "none") {
                    this.#listener();
                    return this.#isReady = true;
                } else if (type == "http1") {
                    let key = client.headers["sec-websocket-key"].trim();
                    if (!key) throw new Error("client has no websocket key");

                    const sha1 = createHash("sha1");
                    sha1.update(key + this.#magicString);
                    const wsKey = base64Encode(sha1.digest());

                    let res = [
                        "HTTP/1.1 101 Switching Protocols",
                        "Upgrade: websocket",
                        "Connection: Upgrade",
                        `Sec-WebSocket-Accept: ${wsKey}`,
                        "\r\n",
                    ].join("\r\n");

                    await this.#tcp.write(new TextEncoder().encode(res)).catch(e => e);


                    this.#listener();

                    return this.#isReady = true;
                } else if (type == "http2") {
                    // soon
                    return this.#isReady = false;
                } else if (type == "http3") {
                    // maybe in the future
                    return this.#isReady = false;
                } else {
                    return this.#isReady = false;
                };
            } else {
                throw new Error("client is not valid");
            }
        } catch (err) {
            this.#err = err;
            return false;
        }

    }

    #listening = false;
    get listening(): boolean { return this.#listening };
    async#listener() {
        this.#listening = true;
        try {
            const buff = new Uint8Array(this.readSize);
            while (this.#listening) {
                const read = await this.#tcp.read(buff);
                if (!read) throw new Error("could not read frame");

                const frameBuff = buff.subarray(0, read);
                const frame = this.#parseFrame(frameBuff);
                if (!frame) throw new Error("could not parse frame data");

                this.emit("frame", frame);
            }
        } catch (err) {
            this.#err = err;
            this.emit("error", err);
        }
        this.#listening = false;
    }
    #parseFrame(data: Uint8Array): WsFrame | null {
        if (data.length < 2) return null;

        const fin = (data[0] & 0x80) !== 0; // Extract FIN bit
        const opcode = data[0] & 0x0F; // Extract opcode
        const mask = (data[1] & 0x80) !== 0; // Extract MASK bit
        let payloadLength = data[1] & 0x7F; // Extract initial payload length
        let offset = 2; // Offset to read further

        // Handle extended payload lengths
        if (payloadLength === 126) {
            if (data.length < offset + 2) return null; // Ensure we have 2 bytes
            payloadLength = (data[offset] << 8) | data[offset + 1];
            offset += 2;
        } else if (payloadLength === 127) {
            if (data.length < offset + 8) return null; // Ensure we have 8 bytes
            payloadLength = Number(
                (BigInt(data[offset]) << 56n) |
                (BigInt(data[offset + 1]) << 48n) |
                (BigInt(data[offset + 2]) << 40n) |
                (BigInt(data[offset + 3]) << 32n) |
                (BigInt(data[offset + 4]) << 24n) |
                (BigInt(data[offset + 5]) << 16n) |
                (BigInt(data[offset + 6]) << 8n) |
                BigInt(data[offset + 7])
            );
            offset += 8;
        }

        // Ensure the data length includes masking key and payload
        const maskLength = mask ? 4 : 0;
        if (data.length < offset + maskLength + payloadLength) return null;

        // Extract masking key if present
        let maskingKey: Uint8Array | undefined;
        if (mask) {
            maskingKey = data.subarray(offset, offset + 4);
            offset += 4;
        }

        // Extract and unmask the payload
        let payload = data.subarray(offset, offset + payloadLength);
        if (mask && maskingKey) {
            payload = payload.map((byte, index) => byte ^ maskingKey![index % 4]);
        }

        const frame = { fin, opcode, payload, opname: "unkown", close: { code: -1, message: new Uint8Array } };

        frame.opname = ({
            0x1: "text",
            0x2: "binary",
            0x8: "close",
            0x9: "ping",
            0xA: "pong",
        })[opcode] || frame.opname;

        if (opcode == 0x8 && payload.length >= 2) {
            let c = payload.subarray(0, 2);
            frame.close.code = parseInt(c[0].toString(16) + c[1].toString(16), 16);
            if (payload.length > 2) frame.close.message = payload.slice(2);
        }


        Object.freeze(frame);
        Object.seal(frame);
        return frame;
    }
    async#sendFrame(opcode: number, payload = new Uint8Array()) {
        let header: Uint8Array;
        const payloadLength = payload.byteLength;

        if (payloadLength <= 125) {
            header = new Uint8Array(2);
            header[1] = payloadLength;
        } else if (payloadLength <= 0xffff) {
            header = new Uint8Array(4);
            header[1] = 126;
            header[2] = (payloadLength >> 8) & 0xff;
            header[3] = payloadLength & 0xff;
        } else {
            header = new Uint8Array(10);
            header[1] = 127;
            const length = BigInt(payloadLength);
            for (let i = 0; i < 8; i++) {
                header[9 - i] = Number((length >> (BigInt(i) * 8n)) & 0xffn);
            }
        }

        header[0] = 0x80 | opcode;

        const frame = new Uint8Array(header.length + payload.byteLength);
        frame.set(header);
        frame.set(payload, header.length);

        return await this.#tcp.write(frame).catch(e => e);
    }
    #uint(data: any): Uint8Array {
        let ret: Uint8Array;
        if (typeof data == "string") ret = this.#te.encode(data);
        else if (typeof data == "number") ret = this.#te.encode(data.toString());
        //else if(typeof data=="object"&&!(data instanceof Uint8Array)&&data instanceof ArrayBuffer)this.#te.encode(this.#td.decode(data));
        else if (typeof data == "object" && !(data instanceof Uint8Array)) ret = this.#te.encode(data.toString());
        else ret = data;
        return ret;
    }

    #closing = false;

    async end() {
        if (!this.#closing) await this.close(1001);
        this.#tcp.close();
    };
    async sendText(data: Uint8Array | string) {
        let opcode = 0x1;
        let payload = this.#uint(data);
        await this.#sendFrame(opcode, payload);
    };
    async sendBinary(data: Uint8Array | string) {
        let opcode = 0x2;
        let payload = this.#uint(data);
        await this.#sendFrame(opcode, payload);
    };
    async ping(data: Uint8Array | string) {
        let opcode = 0x9;
        let payload = this.#uint(data);
        await this.#sendFrame(opcode, payload);
    };
    async pong(data: Uint8Array | string) {
        let opcode = 0xA;
        let payload = this.#uint(data);
        await this.#sendFrame(opcode, payload);
    };
    async close(code: number = 1001, message: Uint8Array | string = new Uint8Array) {
        let opcode = 0x8;
        let hex = code.toString(16);
        let nhex = ("0000" + hex).substring(hex.length);
        let cb1 = nhex.substring(0, 2);
        let cb2 = nhex.substring(2);
        let cbs = [parseInt(cb1, 16), parseInt(cb2, 16)];

        const frame = new Uint8Array(2 + message.length);
        frame.set(cbs);
        frame.set(this.#uint(message), 2)

        await this.#sendFrame(opcode, frame);
        this.#closing = true;
        this.#listening = false;
    };
};
