import "./lib.deno.d.ts";
import "./lib.engine.d.ts";
import { Eventable as StandardMethods } from "./standard.ts";
import { libOpt } from "./debug.ts";
import { ByteLib } from "./buffer.ts";

import * as compress from "jsr:@deno-library/compress";
//import { encode as base64Encode } from "https://deno.land/std@0.97.0/encoding/base64.ts";
//import { createHash } from "https://deno.land/std@0.97.0/hash/mod.ts";
import * as streams from "https://deno.land/std@0.153.0/streams/mod.ts";
import HPACK from "npm:hpack";
import * as hpackd from "./dancrumb-hpack/mod.ts";
import hpackjs from "npm:hpack.js";

const { readableStreamFromIterable } = streams;
const bytelib = new ByteLib;

export class Http2Socket extends StandardMethods {
    #engine: EngineReplacer; #tcp: Deno.TcpConn; #ra: Deno.NetAddr;
    #td: TextDecoder; #te: TextEncoder; #data: Uint8Array; #type: string;
    #socket: HttpSocket | null; #ready: Promise<boolean>; #client1: Client | void | null;

    #readSize = 1024 * 10;
    set readSize(int: any) {
        this.#readSize = parseInt(int);
    };
    get readSize(): number { return this.#readSize };

    get type(): string { return this.#type };


    constructor(engine: any, td: TextDecoder, te: TextEncoder, tcp: Deno.TcpConn, data: Uint8Array, socket: HttpSocket | null, type: string, remoteAddr: Deno.NetAddr) {
        super();

        this.#td = td;
        this.#te = te;
        this.#tcp = tcp;
        this.#data = data;
        this.#type = type;
        this.#engine = engine;
        this.#socket = socket;
        this.#ra = remoteAddr;
        this.#client1 = socket?.client;

        this.#readSize = engine.readSize;
        this.updateSize();
        this.#ready = this.#init(socket ? null : data);

        //try{}catch(err){this.#emit("error",err);};
    };

    get ready(): Promise<boolean> { return this.#ready };

    #buffer = new Uint8Array(0);
    async#read(): Promise<Uint8Array> { return new Uint8Array([...this.#buffer.subarray(0, (await this.#tcp.read(this.#buffer))||0)]); };
    updateSize(size?: number): void { this.#buffer = new Uint8Array(this.#readSize = size || this.#readSize); };
    //async init(){} // not applicable
    #magic = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
    static get magic() { return "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n" };
    static get magicBuffer() { return new Uint8Array([80, 82, 73, 32, 42, 32, 72, 84, 84, 80, 47, 50, 46, 48, 13, 10, 13, 10, 83, 77, 13, 10, 13, 10]) };
    //#magicBuffer=new Uint8Array([80,82,73,32,42,32,72,84,84,80,47,50,46,48,13,10,13,10,83,77,13,10,13,10]);
    #magicASCII = "80,82,73,32,42,32,72,84,84,80,47,50,46,48,13,10,13,10,83,77,13,10,13,10";
    async#init(firstData?: Uint8Array | null) {
        try {

            /*let upgd=client.headers["upgrade"]?.trim();
            //if(!upgd)throw new Error("client does not wanna upgrade");
            let settH=client.headers["http2-settings"]?.trim(); // can be ignored as client will send them again.
  
  
            let res=`HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: h2c\r\n\r\n`;
  
            await this.#tcp.write(this.#te.encode(res)).catch(e=>e);*/


            let valid = false;
            let first, ifr;
            try {
                first = firstData || await this.#read();
                //if(first.length==0)first=await this.#read();
                const mc = first.subarray(0, this.#magic.length);
                ifr = first.subarray(this.#magic.length);
                if (mc == this.#magicASCII) valid = true;
                //console.log("beginning is magic?",mc,this.#magicASCII,mc==this.#magicASCII,first,firstData); // :REMOVE:
            } catch (err) {
                this.emit("error", err);
            };



            if (valid) this.#listener(new Uint8Array([...ifr]));
            else throw new Error("invalid magic character(s)");

            return true;

        } catch (err) {
            //console.log("error during h2 init",err); // :REMOVE:
            this.emit("error", err);
            return false;
        }
    };

    get ownSettings() { return this.#ownSettings } // only to make sure you only modify properties and not the object itself
    #ownSettings: Record<string | number, number> = { initial_window_size: 1048576, max_header_list_size: 16384 };
    async sendSettings(): Promise<void> {
        try {
            const settFrame = await this.#frame(0, "settings", { flags: [], settings: this.ownSettings });
            await this.#tcp.write(settFrame.buffer);
            //return true;
        } catch (err) {
            this.emit("error", err);
            //return false;
        }
    }

    get pushEnabled(): boolean { return !!this.#setting[2] };
    //get#pushEnabled():boolean{return !!this.#setting[2]};

    #setting = { 1: 4096, 2: 0, 3: 0xff_ff_ff_ff, 4: 65535, 5: 16384, 6: -1 };
    get mainIntSettings() { return { ...this.#setting } };
    getIntSettings(sid: number) { return { ...this.#settings[sid] } };
    #settings: Record<number, Record<number, number>> = {};
    #flow: Record<number, number> = {};
    #usedSids: number[] = [0];
    async#listener(first: Uint8Array) {
        try {
            const settings = this.#settings;
            const setting = this.#setting;
            const flow: Record<number, number> = this.#flow;

            const fframes: Http2Frame[] = [];
            for await (let f of this.#packet(first)) fframes.push(f);
            const headers: Record<number, Record<string, string>> = {};
            const headersBuff: Record<number, number[]> = {};
            const bodies: Record<number, number[] | Uint8Array> = {};
            //const pack=await this.#read();
            //const frames=[...this.#packet(pack)];
            /*for(let f of fframes){
              if(f.raw.type==4){
                settings.push(f);
                if(f.streamId==0)for(let si in f.settings.int)this.#setting[si]=f.settings.int[si];
                if(f.settings.int[4])this.#flow[f.streamId]=f.settings.int[4];
              };
            };*/

            this.sendSettings();


            let frames: Http2Frame[] = fframes;
            let usedSocket = false;
            loop:while (true) {
                try {
                    for (const fr of frames) {
                        //console.log(fr.type, fr); // :REMOVE:
                        if(!fr||!fr?.raw){
                            this.emit("error",[new Error("no frame data"),fr]);
                            continue;
                            if(false)break loop;
                        };
                        if (libOpt.debug) console.log(fr.type, fr);
                        if (!this.#usedSids.includes(fr.streamId)) this.#usedSids.push(fr.streamId);
                        if (fr.streamId != 0 && !flow[fr.streamId]) this.#flowInit(fr.streamId);//flow[fr.streamId]=setting[4];
                        if (fr.raw.type == 4 && fr.raw.flags == 0) {
                            //settings.push(fr);
                            if (fr.streamId == 0) for (let si in fr.settings.int) this.#setting[si] = fr.settings.int[si];
                            else for (let si in fr.settings.int) {
                                if (!settings[fr.streamId]) settings[fr.streamId] = { ...setting, ...fr.settings.int };
                                else for (let si in fr.settings.int) settings[fr.streamId][si] = fr.settings.int[si];
                            };
                            if (fr.settings.int[4]) flow[fr.streamId] = fr.settings.int[4];
                            const nf = await this.#frame(fr.streamId, 4, { flags: ["ack"] });
                            //console.log("setting acknowledgement",nf); // :REMOVE:
                            let r = await this.#tcp.write(nf.buffer).catch(e => e);
                            //console.log("write result",r); // :REMOVE:
                        } else if (fr.raw.type == 8) {
                            let wu = fr.buffer;
                            //if(!flow[fr.streamId])flow[fr.streamId]=flow[0];
                            let awu = [...wu];
                            this.#flow[fr.streamId] += parseInt(awu.map(v => ("00" + v.toString(16)).substring(v.toString(16).length)).join(''), 16);
                        } else if (fr.raw.type == 1) {
                            if (!headersBuff[fr.streamId]) headersBuff[fr.streamId] = [];
                            if (!headers[fr.streamId]) headers[fr.streamId] = {};
                            headers[fr.streamId] = { ...headers[fr.streamId], ...fr.headers };
                            headersBuff[fr.streamId].push(...fr.raw.payload);

                            if (fr.flags.includes("end_stream")) {
                                this.#respond(fr.streamId, headers, bodies, headersBuff);
                            }
                        } else if (fr.raw.type == 0) {
                            if (!bodies[fr.streamId]) bodies[fr.streamId] = [];
                            bodies[fr.streamId].push(...fr.buffer);

                            if (fr.flags.includes("end_stream")) {
                                this.#respond(fr.streamId, headers, bodies, headersBuff);
                            }
                        } else if (fr.raw.type == 7) {
                            await this.#tcp.write((await this.#frame(fr.streamId, 7, { flags: ["ack"] })).buffer).catch(e => e);
                            this.emit("close", fr);
                            this.#tcp.close();
                        } else if (fr.raw.type == 3) {
                            flow[fr.streamId] = flow[0];
                            this.#usedSids.splice(this.#usedSids.indexOf(fr.streamId), 1);
                        } else if (fr.raw.type == 6) {
                            await this.#tcp.write((await this.#frame(fr.streamId, 6, { flags: ["ack"], data: fr.buffer })).buffer).catch(e => e);
                        };
                    };

                    if (!usedSocket && this.#socket && this.#client1) {
                        // means http2 upgrade took place
                        //console.log("using data from old http1 connection"); // :REMOVE:
                        const socket: HttpSocket = this.#socket;
                        const client: Client = this.#client1;
                        headers[1] = {};
                        headers[1][":path"] = client.path;
                        headers[1][":method"] = client.method;
                        headers[1][":authority"] = client.headers.host;
                        headers[1][":scheme"] = this.type == "tcp::tls" ? "https" : "http";
                        for (let [k, v] of Object.entries(client.headers)) headers[1][k] = v;
                        bodies[1] = this.#te.encode(client.data);
                        this.#respond(1, headers, bodies, headersBuff);
                        usedSocket = true;
                    }
                    // handle streams 


                    // loop back
                    //console.log("loop back, reading tcp again"); // :REMOVE:
                    const pack = await this.#read().catch(e => new Uint8Array);
                    frames.length = 0;
                    for await (let f of this.#packet(pack)) frames.push(f);
                    //frames=[...this.#packet(pack)];
                    if (pack.length == 0) {
                        this.emit("close", this);
                        break;
                    };
                } catch (err) {
                    this.emit("error", err);
                };
            }
        } catch (err) {
            this.emit("error", err);
        };
    };
    async#respond(sid, headers, bodies, headersBuff) {
        //console.log(sid,headers,bodies);
        let headEntr = await this.hpackDecode(headersBuff, 0, 1, 2);
        const head = Object.fromEntries(headEntr);
        const hand = await this.#handler(sid, { ...headers[sid], ...head }, bodies[sid]);
        headers[sid] = {};
        bodies[sid] = [];
        //console.log("new stream handler",hand);
        this.emit("stream", hand);
    };
    #flowInit(sid: number) {
        this.#flow[sid] = this.#setting[4];
    };
    async#handler(sid, headers, body): Promise<Http2Stream> {
        const frame = (sid, type, opt) => this.#frame(sid, type, opt);
        const flowInit = (sid: number) => this.#flowInit(sid);
        const setting = this.#setting;
        const settings = this.#settings;
        const flow = this.#flow;
        const td = this.#td;
        const te = this.#te;
        const tcp = this.#tcp;
        const hpack = this.#hpack;
        const remoteAddr = this.#ra;
        const http2: Http2Socket = this;
        const usedSids = this.#usedSids;
        const type = this.#type;

        const hand = new StreamHandler(frame, flowInit, flow, td, te, tcp, remoteAddr, http2, usedSids, type, sid, headers, body);
        return hand;
    };

    get #hpack() { return new HPACK };

    async#danEncode(h: string[][]) {
        /*let hs:string="";
        if(typeof h=="string")hs=h;
        else if(typeof h=="object")hs=h.join("\n").replaceAll(",",": ");
        else hs=String(h);*/
        let hs: string = h.join("\n").replaceAll(",", ": ");

        const estr = new hpackd.HPackEncoderStream(this.#hpackdContext.encode);

        const b: number[] = [];
        const enc = await readableStreamFromIterable(hs).pipeThrough(estr);
        for await (let l of enc) b.push(...l);
        return b;
    }
    async#danDecode(hbuff: number[]) {
        const dstr = new hpackd.HPackDecoderStream(this.#hpackdContext.decode);
        const dec = await readableStreamFromIterable([hbuff]).pipeThrough(dstr);
        const te: string[][] = [];
        try {
            for await (let e of dec) {
                let s = e.split(": ");
                te.push([s[0], s[1]]);
            };
        } catch (err) { this.emit("error", err) }
        return te;
    }
    #hpackdContext = {
        encode: new hpackd.EncodingContext(),
        decode: new hpackd.DecodingContext(),
    };

    #hpackTableSize = 4 * 1024 ** 2; //4kb
    get hpackTableSize() { return this.#hpackTableSize };
    set hpackTableSize(s: number) { if (s >= 0) this.#hpackTableSize = parseInt(s.toString()) };
    async#hpackDecode(buff: Uint8Array, method = 0): Promise<string[][]> {
        if (libOpt.debug) console.log(buff, method);
        if (method == 0) {
            //hpack
            return new HPACK().decode(buff);
        } else if (method == 1) {
            // hpack.js
            let entr: string[][] = [];
            const dec = hpackjs.decompressor.create({ table: { size: this.#hpackTableSize } });
            dec.write(buff);
            dec.execute();
            let last = dec.read();
            let arr = [last];
            while ((last = dec.read()) != null) try { arr.push(last) } catch (err) { };
            for (let { name, value } of arr) entr.push([name, value]);
            return entr;
        } else if (method == 2) {
            // dancrumb
            const entr = await this.#danDecode([...buff]);
            return entr;
        } else {
            return [];
        }
    };
    async#hpackEncode(entr: string[][], method = 0): Promise<Uint8Array> {
        if (method == 0) {
            // hpack
            return new HPACK().encode(entr);
        } else if (method == 1) {
            // hpack.js
            let arr: { name: string, value: string }[] = [];
            const com = hpackjs.compressor.create({ table: { size: this.#hpackTableSize } });
            for (let [k, v] of entr) arr.push({ name: k, value: v });
            com.write(arr);
            return com.read();
        } else if (method == 2) {
            // dancrumb
            const b = await this.#danEncode(entr);
            return new Uint8Array(b);
        } else {
            return new Uint8Array;
        }
    };
    async hpackDecode(buff: Uint8Array, ...methods: number[]): Promise<string[][]> {
        let res: string[][] = [], lerr = null, s = false;
        for (let i = 0; i < methods.length; i++) {
            try { res.push(...await this.#hpackDecode(buff, methods[i])); s = true } catch (err) { this.emit("error", err); lerr = err };
        };
        //if(!s)throw new Error("couldn't decode hpack");
        return res;
    };
    async hpackEncode(entr: string[][], method = 0, tries = 3): Promise<Uint8Array> {
        let res: Uint8Array = new Uint8Array, lerr: Error | null = null, s = false;
        for (let i = 0; i < tries; i++) {
            try { res = await this.#hpackEncode(entr, method); s = true } catch (err) { this.emit("error", err); lerr = err };
        };
        if (!s) throw new Error("couldn't encode hpack " + lerr?.stack);
        return res;
    };
    #frameTypes = {
        int: {
            0: "data",
            1: "headers",
            2: "priority",
            3: "rst_stream",
            4: "settings",
            5: "push_promise",
            6: "ping",
            7: "goaway",
            8: "window_update",
            9: "continuation",
        },
        str: {
            data: 0,
            headers: 1,
            priority: 2,
            rst_stream: 3,
            settings: 4,
            push_promise: 5,
            ping: 6,
            goaway: 7,
            window_update: 8,
            continuation: 9,
        },
    };
    #frameFlags = { ack: 1, end_stream: 1, end_headers: 4, padded: 8, priority: 32 };
    //#settingsList={1:"settings_header_table_size",2:"settings_enable_push",3:"settings_max_concurrent_streams",4:"settings_initial_window_size",5:"settings_max+frame_size",6:"settings_max_header_list_size"};
    #settingsList = { 1: "header_table_size", 2: "enable_push", 3: "max_concurrent_streams", 4: "initial_window_size", 5: "max_frame_size", 6: "max_header_list_size" };
    #settingsList2 = { "header_table_size": 1, "enable_push": 2, "max_concurrent_streams": 3, "initial_window_size": 4, "max_frame_size": 5, "max_header_list_size": 6 };
    #frameBuffer(streamId: number, type: number, flags: number, payload: Uint8Array): Uint8Array {
        if (payload.length > 0xffffff) throw new Error("payload size too big");
        if (flags > 0xff) throw new Error("flags too big");

        //console.log(arguments);
        const frameBuffer = new Uint8Array(9 + payload.length);

        let flagByte = parseInt(flags.toString());
        let typeByte = parseInt(type.toString());

        /*if(typeof type!="number"&&Array.isArray(flags)){
          for(let f of flags)flagByte+=this.#frameTypes[f];
        };*/
        //if(typeof type=="string")typeByte=this.#frameTypes.str[type];

        /*let hl=payload.length.toString(16);
        let hlfa=("000000"+hl).substring(hl.length).split("");
        let hll="";
        let hlb:number[]=[];
        for(let i in hlfa)i%2?hlb.push(parseInt(hll+hlfa[i],16)):hll=hlfa[i];*/
        //let hlb=(payload.length.toString(16).padStart(6,"0").match(/.{1,2}/g)||[]).map(v=>parseInt(v,16));
        let hlb = bytelib.cap(bytelib.decInt(payload.length), 3);

        /*let hsi=streamId.toString(16);
        let hsifa=("00000000"+hsi).substring(hsi.length).split("");
        let hsil="";
        let hsib:number[]=[];
        for(let i in hsifa)i%2?hsib.push(parseInt(hsil+hsifa[i],16)):hsil=hsifa[i];*/
        //let hsib=(streamId.toString(16).padStart(8,"0").match(/.{1,2}/g)||[]).map(v=>parseInt(v,16));
        let hsib = bytelib.cap(bytelib.decInt(streamId), 4);

        const part = new Uint8Array([...hlb, typeByte, flagByte, ...hsib]);
        frameBuffer.set(part);
        frameBuffer.set(payload, 9);

        //console.log("frame buffer",frameBuffer); // :REMOVE:

        return frameBuffer
    };
    async#frame(streamId: number, type: number | string, options?: { flags?: number | string[], data?: string | Uint8Array, headers?: Record<string, string>, settings?: Record<string | number, number>, error?: { code: number, lastStreamID?: number, message?: Uint8Array | string }, targetStreamId?: number }) {
        if (!options) options = {};

        if (libOpt.debug) console.log("make frame", streamId, type, options);
        //console.log("resframe", type, streamId, options); // :REMOVE:

        let flags = options?.flags || 0;
        let data = options?.data || new Uint8Array;
        let headers = options?.headers || {};
        let settings = options?.settings || {};
        let errno = options?.error?.code || 0;
        let errmsg = options?.error?.message || new Uint8Array;
        let errsid = options?.error?.lastStreamID || 0;
        let tarsid = options?.targetStreamId || Math.floor(Math.random() * 0xffff);

        let flagByte = parseInt(flags.toString());
        let typeByte = parseInt(type.toString());
        let heh: Uint8Array = await this.hpackEncode(Object.entries(headers), 1);
        let settList: number[] = [];
        let settBuff: Uint8Array = new Uint8Array;
        let errBuff: Uint8Array = new Uint8Array;
        let tsidBuff: number[] = (tarsid.toString(16).padStart(8, "0").match(/.{1,2}/g) || []).map(v => parseInt(v, 16));
        //let pushBuff=new Uint8Array;

        if (typeof flags != "number" && Array.isArray(flags)) {
            flagByte = 0;
            for (let f of flags) flagByte += this.#frameFlags[f];
        };
        if (typeof type == "string") typeByte = this.#frameTypes.str[type];
        if (typeof data == "string") data = this.#te.encode(data);
        if (typeof errmsg == "string") errmsg = this.#te.encode(errmsg);
        if (typeByte == 4) for (let s in settings) {
            let i: number, sv: number, v: string[], v2: number[] = [], o: string[], o2: number[] = [];
            sv = parseInt(settings[s].toString());
            if (typeof s == "number") i = s;
            else i = this.#settingsList2[s];
            if (!i) continue;
            v = ("0000" + i.toString(16)).substring(i.toString(16).length).match(/.{1,2}/g) || [];
            o = ("00000000" + sv.toString(16)).substring(sv.toString(16).length).match(/.{1,2}/g) || [];
            for (let t of v) v2.push(parseInt(t, 16));
            for (let t of o) o2.push(parseInt(t, 16));
            settList.push(...[...v2, ...o2]);
        };
        //if(typeByte==7)errBuff=new Uint8Array([...(errsid.toString(16).padStart(8,"0").match(/.{1,2}/g)||[]).map(v=>parseInt(v,16)),...(errno.toString(16).padStart(2,"0").match(/.{1,2}/g)||[]).map(v=>parseInt(v,16)),...errmsg]);
        if (typeByte == 7) errBuff = new Uint8Array([...bytelib.cap(bytelib.decInt(errsid), 4), ...bytelib.cap(bytelib.decInt(errsid), 2), ...errmsg]);

        settBuff = new Uint8Array(settList);

        if (typeof typeByte != "number") throw new Error("invalid type or flags");
        if (typeof streamId != "number") throw new Error("invalid streamId");

        switch (typeByte) {
            case 1:
                return {
                    buffer: this.#frameBuffer(streamId, typeByte, flagByte, heh),
                };

            case 3:
                return {
                    buffer: this.#frameBuffer(streamId, typeByte, flagByte, new Uint8Array([...tsidBuff, ...heh])),
                };

            case 4:
                return {
                    buffer: this.#frameBuffer(streamId, typeByte, flagByte, settBuff),
                };

            case 7:
                return {
                    buffer: this.#frameBuffer(streamId, typeByte, flagByte, errBuff),
                };


            default:
                return {
                    buffer: this.#frameBuffer(streamId, typeByte, flagByte, data),
                };
        }

    };
    async*#packet(buff: Uint8Array) {
        try {
            // frame types cheat sheet
            const types = this.#frameTypes;
            const flags = this.#frameFlags;
            const settingsList = this.#settingsList;
            //const hpack=()=>this.#hpack;
            const th = this;
            //const dancrumb=(b:Uint8Array)=>this.#dancrumb(b);
            if (libOpt.debug) console.log("packet arg", buff);

            // deno-lint-ignore no-inner-declarations
            async function frame(buff:Uint8Array[]): Promise<Http2Frame | object> {

                if (buff.length < 9) return [new Http2Frame, new Uint8Array()];
                const length = [...buff.subarray(0, 3)];
                const stream = [...buff.subarray(5, 9)];
                const lenInt = Number(bytelib.encInt(length));
                //const lenInt=parseInt(length.map(v=>v.toString(16).padStart(2,"0")).join(''),16);
                const streamId = Number(bytelib.encInt(stream));
                //const streamId=parseInt(stream.map(v=>v.toString(16).padStart(2,"0")).join(''),16);
                const extraLen = [0, 1].includes(buff[3]) ? (buff[4] & 0x08 ? 1 : (buff[4] & 0x20 ? 5 : 0)) : 0;
                const padLength = [0, 1].includes(buff[3]) ? (buff[4] & 0x08 ? buff[9] : 0) : 0

                const svkl: Record<string, number> = {};
                const nvkl: Record<number, number> = {};
                const frame: Http2Frame = new Http2Frame({
                    raw: {
                        length: length,
                        type: buff[3],
                        flags: buff[4],
                        stream: stream,
                        payload: [...buff.subarray(9 + extraLen, 9 + lenInt - padLength)],
                        extraPayload: [...buff.subarray(9, 9 + extraLen)],
                        padding: [...buff.subarray(9 + lenInt + extraLen - padLength, 9 + lenInt + extraLen + padLength)],
                    },
                    type: types.int[buff[3]],

                    flags: [],
                    length: lenInt - extraLen - padLength,
                    streamId: streamId,

                    buffer: new Uint8Array,
                    headers: {},

                    error: {
                        code: 0,
                        streamId: 0,
                        message: new Uint8Array,
                    },

                    //_settingsRaw:[],
                    settings: { str: svkl, int: nvkl },

                    //extraLength:extraLen,
                    readSuccess: true,
                });

                if ([0, 1].includes(frame.raw.type)) {
                    if (frame.raw.flags & 0x01) frame.flags.push("end_stream");
                    if (frame.raw.flags & 0x04) frame.flags.push("end_headers");
                    if (frame.raw.flags & 0x08) frame.flags.push("padded");
                    if (frame.raw.flags & 0x20) frame.flags.push("priority");
                } else if ([4, 6].includes(frame.raw.type) && frame.raw.flags == 1) frame.flags.push("ack");


                frame.buffer = new Uint8Array(frame.raw.payload);

                if (libOpt.debug) console.log("preframe", frame);

                if (frame.raw.type == 1 && frame.buffer.length > 0) {
                    let entr: string[][] = [];
                    try {
                        entr = await th.hpackDecode(frame.buffer, 0, 1, 2);
                    } catch (err) {
                        th.emit("error", err);
                    };
                    /*try{
                      entr.push(...th.hpackDecode(frame.buffer,1,1));
                    }catch(err){
                      th.emit("error",err);
                    };*/
                    if (libOpt.debug) console.log("header entries", entr);
                    for (let [k, v] of entr) frame.headers[k] = v;
                }
                else if (frame.raw.type == 4) {
                    let u: number[] = frame.raw.payload;
                    let set: number[][] = [];
                    let lset: number[] = [];
                    for (let i in u) {
                        //console.log(i,i%6,i%6!=5);
                        if (i % 6 != 5) {
                            lset.push(u[i]);
                        }
                        else {
                            lset.push(u[i]);
                            set.push(lset);
                            lset = [];
                        };
                    };

                    //let hvs={};
                    for (let s of set) {
                        let nam = s.slice(0, 2);
                        let val = s.slice(2);

                        let name = parseInt(nam.map(v => ("00" + v.toString(16)).substring(v.toString(16).length)).join(''), 16);
                        let value = parseInt(val.map(v => ("00" + v.toString(16)).substring(v.toString(16).length)).join(''), 16);

                        nvkl[name] = value;
                        svkl[settingsList[name]] = value;
                    }
                }
                else if (frame.raw.type == 7) {
                    let lastsidr = [...frame.buffer.subarray(0, 4)];
                    let errnor = [...frame.buffer.subarray(4, 8)];
                    let msg = [...frame.buffer.subarray(8)];

                    let lastsid = parseInt(lastsidr.map(v => v.toString(16).padStart(2, "0")).join(''), 16);
                    let errno = parseInt(errnor.map(v => v.toString(16).padStart(2, "0")).join(''), 16);

                    frame.error.code = errno;
                    frame.error.streamId = lastsid;
                    frame.error.message = new Uint8Array([...msg]);
                }
                else if (frame.raw.type == 3) {
                    frame.error.code = parseInt(frame.raw.payload.map(v => v.toString(16).padStart(2, "0")).join(''), 16);
                };

                //console.log("frame", frame.type, frame.streamId, frame); // :REMOVE:

                let remain = buff.subarray(9 + lenInt);
                return [frame, remain];
            };

            let last = await frame(buff);
            yield last[0];
            if (!last[1].length) return;

            try {
                while ((last = await frame(last[1]))[1].length) yield last[0];
            } catch (err) {
                this.emit("error", err);
                //console.log(last);
                //throw err;
            }
            yield last[0];
        } catch (err) { this.emit("error", err); };
    };


    // all internal methods and objects/arrays. use at own risk.
    get _packet(){return this.#packet};
    get _frame(){return this.#frame};
    get _frameBuffer(){return this.#frameBuffer};
    get _settingsList2(){return this.#settingsList2};
    get _settingsList(){return this.#settingsList};
    get _frameFlags(){return this.#frameFlags};
    get _frameTypes(){return this.#frameTypes};
    get _hpackEncode(){return this.#hpackEncode};
    get _hpackDecode(){return this.#hpackDecode};
    get _hpackdContext(){return this.#hpackdContext};
    get _danDecode(){return this.#danDecode};
    get _danEncode(){return this.#danEncode};
    get _hpack(){return this.#hpack};
    get _handler(){return this.#handler};
    get _flowInit(){return this.#flowInit};
    get _respond(){return this.#respond};
    get _listener(){return this.#listener};
    get _usedSids(){return this.#usedSids};
    get _flow(){return this.#flow};
    get _settings(){return this.#settings};
    get _setting(){return this.#setting};
    get _read(){return this.#read};
};

export class StreamHandler extends StandardMethods {
    #frame: (streamId: number, type: number | string, options?: any) => Promise<{ buffer: Uint8Array }>; #flowInit: (sid: number) => void;
    #flow: Record<number, number>; #td: TextDecoder; #te: TextEncoder; #tcp: Deno.TcpConn;
    #ra: Deno.NetAddr; #http2: Http2Socket; #type: string; #usedSids: number[];
    #sid: number; #cheaders: Record<string, string>; #body: Uint8Array;
    constructor(frame, flowInit, flow, td, te, tcp, remoteAddr, http2, usedSids, type, sid, headers, body) {
        super();
        //const frame = (...a) => this.#frame(...a);
        //const flowInit = (sid: number) => this.#flowInit(sid);
        this.#frame = frame;
        this.#flowInit = flowInit;
        //const setting = this.#setting;
        //const settings = this.#settings;
        //const hpack = this.#hpack;
        this.#flow = flow;
        this.#td = td;
        this.#te = te;
        this.#tcp = tcp;
        this.#ra = remoteAddr;
        this.#http2 = http2;
        this.#usedSids = usedSids;
        this.#type = type;

        this.#sid = sid;
        this.#cheaders = headers;
        this.#body = body;

        this.#client = { body: new Uint8Array(body), headers, remoteAddr };
    }


    #client: Client2;// = { body: new Uint8Array(body), headers, remoteAddr };
    #closed = false;

    get client(): Client2 { return this.#client };
    get closed(): boolean { return this.#closed };

    get type(): string { return this.#type };

    get compress(): boolean { return false };
    #compress(t, b): Uint8Array | void {
        if (t == "gzip") return compress.gzip(b);
    };

    #headers: Record<string, string> = {};
    #sysHeaders: Record<string, string> = { ":status": "200" };
    #sentHead = false;
    get status(): number { return parseInt(this.#sysHeaders[":status"]) };
    set status(status: number) { this.#sysHeaders[":status"] = status.toString() };
    setHeader(name: string, value: string): void {
        let no = ["connection"], nam = name.toString().toLowerCase();
        if (!no.includes(nam)) this.#headers[nam] = value.toString();
    };
    removeHeader(name: string): boolean { return delete this.#headers[name.toLowerCase()] };
    headers(): Record<string, string> { return { ...this.#headers, ...this.#sysHeaders } };
    async reset(): Promise<boolean> {
        let suc = await this.#tcp.write(await this.#frame(this.#sid, 3, { data: "\x00\x00\x00\x00" }).then(f => f.buffer))//.then(r=>r?this.#closed=true:false)
        if (suc) {
            this.#closed = true;
            this.#usedSids.splice(this.#usedSids.indexOf(this.#sid), 1);
            return true;
        } else return false
    };
    #write(buff: Uint8Array): Promise<boolean> { return this.#tcp.write(buff).then(r => true).catch(e => false); };
    #getHeadBuff(end: boolean) {
        this.#sysHeaders.date = new Date().toGMTString();
        this.#sysHeaders.vary = "Accept-Encoding";
        let head;
        if (!end) head = this.#frame(this.#sid, 1, { headers: { ":status": this.#sysHeaders[":status"], ...this.#headers, ...this.#sysHeaders }, flags: ["end_headers"] });  // sys headers last to overule any simulated user headers such as `:status`
        else head = this.#frame(this.#sid, 1, { headers: { ":status": this.#sysHeaders[":status"], ...this.#headers, ...this.#sysHeaders }, flags: ["end_headers", "end_stream"] });
        return head;
    }
    async#sendHead(end?: boolean) {
        if (!this.#sentHead) {
            const head = await this.#getHeadBuff(!!end);
            this.#sentHead = true;
            return await this.#write(head.buffer);
        } else return false;
    };

    get sizeLeft() { return this.#flow[this.#sid] };
    #flowSize(len: number, stid: number = this.#sid): boolean {
        if (!this.#flow[stid]) this.#flowInit(stid);
        return this.#flow[stid] - len > 0 && this.#flow[0] - len > 0;
    }
    #flowPass(len: number, stid: number = 0): boolean {
        if (this.#flowSize(len, stid)) {
            this.#flow[stid] -= len; this.#flow[0] -= len;
            return true;
        } else return false;
    }

    async write(data: string | Uint8Array) {
        if (this.#closed) return false;
        await this.#sendHead();
        if (!this.#flowSize(data.length)) throw new Error("window size too small");
        const dataFrame = await this.#frame(this.#sid, "data", { data });
        this.#flowPass(data.length);
        return await this.#write(dataFrame.buffer);
    };

    async close(data?: string | Uint8Array) {
        if (this.#closed) return false;
        if (data && !this.#flowSize(data.length)) throw new Error("window size too small");
        if (data) this.#flowPass(data.length);
        if (!data) return await this.#sendHead(true);
        //else await this.#sendHead();
        else if (!this.#sentHead) {
            this.#sysHeaders["content-length"] = data.length.toString();
            const h = await this.#getHeadBuff(false).then(f => f.buffer);
            const dat = await this.#frame(this.#sid, "data", { flags: ["end_stream"], data }).then(f => f.buffer);
            return await this.#write(new Uint8Array([...h, ...dat]));
        } else {
            const dat = await this.#frame(this.#sid, "data", { flags: ["end_stream"], data });
            return await this.#write(dat.buffer);
        }
    };

    async push(req: Record<string, string>, headers: Record<string, string>, data: string | Uint8Array): Promise<boolean> {
        if (!this.#http2.pushEnabled) return false;
        //if(flow[0]-data.length<0)throw new Error("window size too small");
        let max = this.#http2.mainIntSettings[3];
        if (max > 300) max = 300;
        let nsid: number = -1;
        for (let i = 0, rsid = Math.round(Math.random() * max); i < 5; i++) {
            if (!this.#usedSids.includes(rsid)) {
                nsid = rsid;
                break;
            }
        };
        if (nsid == -1) return false;
        this.#flowInit(nsid);
        if (!this.#flowSize(data.length, nsid)) throw new Error("window size too small");
        //let sidb=(nsid.toString(16).padStart(8,"0").match(/.{1,2}/g)||[]).map(v=>parseInt(v,16));
        let pf = await this.#frame(this.#sid, 5, { targetStreamId: nsid, headers: req }).then(f => f.buffer);
        let hf = await this.#frame(nsid, 1, { flags: ["end_headers"], headers }).then(f => f.buffer);
        let df = await this.#frame(nsid, 0, { flags: ["end_stream"], data }).then(f => f.buffer);
        //if(flow[0]-data.length>0)df=frame(nsid,0,{flags:["end_stream"],data}).buffer;
        //else throw new Error("window size too small");
        let jf = new Uint8Array([...pf, ...hf, ...df]);
        let suc = await this.#write(jf);
        return suc;
    };

    pseudo(): PseudoHttpSocket { // future
        const th = this;
        const oc = th.client;
        const written: number[] = [];
        const psock = new PseudoHttpSocket(th, this.#http2, oc, written, this.#td, this.#te);
        return psock;
    };
};
type Http2Stream = StreamHandler;
export { StreamHandler as Http2Stream };

export class PseudoHttpSocket extends StandardMethods {
    #th: Http2Stream; #oc: Client2; #written;
    #td: TextDecoder; #te: TextEncoder; #http2: Http2Socket;
    constructor(th, http2, oc, written, td, te) {
        super();
        this.#th = th;
        this.#oc = oc;
        this.#written = written;
        this.#td = td;
        this.#te = te;
        this.#http2 = http2;
    }

    get socket(): PseudoHttpSocket { return this };
    get client(): PseudoClient {
        const client: PseudoClient = new PseudoClient;
        client.method = this.#oc.headers[":method"];
        client.address = this.#oc.remoteAddr
        client.path = this.#oc.headers[":path"]
        for (let h in this.#oc.headers) {
            let v = this.#oc.headers[h];
            if (h[0] != ":") client.headers[h] = v;
            else if (h == ":authority") client.headers.host = v;
        };

        return client;
    };
    get isWebSocket(): boolean { return false };
    get type(): string { return this.#http2.type };
    get enabled(): boolean { return this.#th.closed };
    get status() { return this.#th.status };
    set status(s) { this.#th.status = s };
    statusMessage = "";
    get compress() { return this.#th.compress };
    setHeader(name: string, value: string): boolean { this.#th.setHeader(name, value); return true };
    removeHeader(name: string): boolean { return this.#th.removeHeader(name) };
    writeHead(status?: number, statusMessage?: string, headers?: Record<string, string>): boolean {
        if (status) this.#th.status = status;
        if (headers) for (let [h, v] of Object.entries(headers)) this.#th.setHeader(h, v);
        return true;
    };
    headers(): Record<string, string> { return this.#th.headers() };
    async writeText(str: string): Promise<void> { const b = this.#te.encode(str); this.#written.push(...b); await this.#th.write(b) };
    async writeBuffer(b: Uint8Array): Promise<void> { this.#written.push(...b); await this.#th.write(b) };
    async close(d?: Uint8Array | string): Promise<void> { if (d) { let b = d; if (typeof d == "string") b = this.#te.encode(d); this.#written.push(...b) }; await this.#th.close(d) };
    written(): Uint8Array { return new Uint8Array(this.#written) };
    deny() { this.#th.reset() };
    async websocket(): Promise<WebSocket | void> { return undefined };
    async http2(): Promise<Http2Socket | void> { return this.#http2 };
};

export class PseudoClient {
    isValid = true;
    err = undefined;
    headers: Record<string, string> = {};
    method: string;// = oc.headers[":method"];
    address: Deno.NetAddr// = oc.remoteAddr;
    path: string;// = oc.headers[":path"];
    httpVersion:"HTTP/2" = "HTTP/2";
    data: string;// = td.decode(oc.body);
};

export class Http2Frame {
    constructor(obj = {}) {
        Object.assign(this, obj);
    };

    raw: {
        length: number[],
        type: number,
        flags: number,
        stream: number[],
        payload: number[],
        extraPayload: number[],
        padding: number[],
    } = {
        length: [],
        type: -1,
        flags: -1,
        stream: [],
        payload: [],
        extraPayload: [],
        padding: [],
    };
    type: string = "";

    flags: string[] = [];
    length: number = -1;
    streamId: number = -1;

    buffer: Uint8Array = new Uint8Array;
    headers: Record<string, string> = {};

    error: {
        code: number,
        streamId: number,
        message: Uint8Array,
    } = {
        code: -1,
        streamId: -1,
        message: new Uint8Array,
    };

    //_settingsRaw:[],
    settings: { 
        str: Record<string, number>, 
        int: Record<number, number>, 
    } = {
        str: {},
        int: {},
    };
    //extraLength:extraLen,

    readSuccess: boolean = false;
    lock(): void{
        Object.freeze(this);
        Object.seal(this);
    };
};