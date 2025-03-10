//import { max, sizeof } from "assemblyscript/std/assembly/builtins.js";

/*export class Uint8Codex {
    //#utf8=["\u0000","\u0001","\u0002","\u0003","\u0004","\u0005","\u0006","\u0007","\u0008","\u0009","\u000a","\u000b","\u000c","\u000d","\u000e","\u000f","\u0010","\u0011","\u0012","\u0013","\u0014","\u0015","\u0016","\u0017","\u0018","\u0019","\u001a","\u001b","\u001c","\u001d","\u001e","\u001f","\u0020","\u0021","\u0022","\u0023","\u0024","\u0025","\u0026","\u0027","\u0028","\u0029","\u002a","\u002b","\u002c","\u002d","\u002e","\u002f","\u0030","\u0031","\u0032","\u0033","\u0034","\u0035","\u0036","\u0037","\u0038","\u0039","\u003a","\u003b","\u003c","\u003d","\u003e","\u003f","\u0040","\u0041","\u0042","\u0043","\u0044","\u0045","\u0046","\u0047","\u0048","\u0049","\u004a","\u004b","\u004c","\u004d","\u004e","\u004f","\u0050","\u0051","\u0052","\u0053","\u0054","\u0055","\u0056","\u0057","\u0058","\u0059","\u005a","\u005b","\u005c","\u005d","\u005e","\u005f","\u0060","\u0061","\u0062","\u0063","\u0064","\u0065","\u0066","\u0067","\u0068","\u0069","\u006a","\u006b","\u006c","\u006d","\u006e","\u006f","\u0070","\u0071","\u0072","\u0073","\u0074","\u0075","\u0076","\u0077","\u0078","\u0079","\u007a","\u007b","\u007c","\u007d","\u007e","\u007f","\u0080","\u0081","\u0082","\u0083","\u0084","\u0085","\u0086","\u0087","\u0088","\u0089","\u008a","\u008b","\u008c","\u008d","\u008e","\u008f","\u0090","\u0091","\u0092","\u0093","\u0094","\u0095","\u0096","\u0097","\u0098","\u0099","\u009a","\u009b","\u009c","\u009d","\u009e","\u009f","\u00a0","\u00a1","\u00a2","\u00a3","\u00a4","\u00a5","\u00a6","\u00a7","\u00a8","\u00a9","\u00aa","\u00ab","\u00ac","\u00ad","\u00ae","\u00af","\u00b0","\u00b1","\u00b2","\u00b3","\u00b4","\u00b5","\u00b6","\u00b7","\u00b8","\u00b9","\u00ba","\u00bb","\u00bc","\u00bd","\u00be","\u00bf","\u00c0","\u00c1","\u00c2","\u00c3","\u00c4","\u00c5","\u00c6","\u00c7","\u00c8","\u00c9","\u00ca","\u00cb","\u00cc","\u00cd","\u00ce","\u00cf","\u00d0","\u00d1","\u00d2","\u00d3","\u00d4","\u00d5","\u00d6","\u00d7","\u00d8","\u00d9","\u00da","\u00db","\u00dc","\u00dd","\u00de","\u00df","\u00e0","\u00e1","\u00e2","\u00e3","\u00e4","\u00e5","\u00e6","\u00e7","\u00e8","\u00e9","\u00ea","\u00eb","\u00ec","\u00ed","\u00ee","\u00ef","\u00f0","\u00f1","\u00f2","\u00f3","\u00f4","\u00f5","\u00f6","\u00f7","\u00f8","\u00f9","\u00fa","\u00fb","\u00fc","\u00fd","\u00fe"];
    bytes(num: number): number {
        let m = 0, s = 0, x = parseInt(String(num)) || 0;
        if (x >= 0xff_ff_ff_ff) throw Error("number too big");
        if (x < 0) throw Error("number cant be negative");
        if(0x1_00_00_00&x)return 4;
        while (true) {
            if ((x >>> s)<=0) break; m++; s += 8;
        }
        return m;
    };

    
    sEnc(s: string): number[] { return String(s).split("").map(s => 0xff & s.charCodeAt(0)) };
    sDec(a: number[] | Uint8Array): string { return [...a].map(i => String.fromCharCode(i)).join(""); };

    #decInt(x: number, a: number): number[] {
        let buff: number[] = [], s = 0;
        for (let i = a - 1; 0 <= i; i--) {
            s = i * 8
            buff.push((0xff * 0x100 ** i & x) >>> s);
        };
        return buff;
    };
    decInt(num: number): number[] {
        let x=parseInt(String(num))||0;
        return this.#decInt(x,this.bytes(x));
        // let x = parseInt(String(num)) || 0;
        // let a = this.bytes(x), buff: number[] = [], s = 0;
        // for (let i = a - 1; 0 <= i; i--) {
        //     s = i * 8
        //     buff.push((0xff * 0x100 ** i & x) >>> s);
        // };
        // return buff;
    };
    encInt(buff: number[]|Uint8Array): number{
        let r=0;
        [...buff].reverse().forEach((e,i)=>r+=e*0x100**i);
        return r;
    };

    hexcap(num:number,cap:number=4):string{
        let x=parseInt(String(num))||0;
        let at=parseInt(String(cap))||0;
        let mask=2**(4*at);
        return (mask+((mask-1)&x)).toString(16).substring(1,1+cap);
    };

    correct(buff:number[]|Uint8Array):number[]{
        let arr=[...buff],nb:number[]=[];
        for(let i of arr){
            let x=parseInt(String(i))||0;
            if(x<0)x*=-1;
            x=x&0xff_ff_ff_ff;
            let b=this.bytes(x);
            if(b==1||b==0)nb.push(x);
            else if(b>1){
                nb.push(...this.#decInt(x,b));
            };
        };
        return nb;
    }
}*/

//type TX=ByteLib;
export class ByteLib {
    //#utf8=["\u0000","\u0001","\u0002","\u0003","\u0004","\u0005","\u0006","\u0007","\u0008","\u0009","\u000a","\u000b","\u000c","\u000d","\u000e","\u000f","\u0010","\u0011","\u0012","\u0013","\u0014","\u0015","\u0016","\u0017","\u0018","\u0019","\u001a","\u001b","\u001c","\u001d","\u001e","\u001f","\u0020","\u0021","\u0022","\u0023","\u0024","\u0025","\u0026","\u0027","\u0028","\u0029","\u002a","\u002b","\u002c","\u002d","\u002e","\u002f","\u0030","\u0031","\u0032","\u0033","\u0034","\u0035","\u0036","\u0037","\u0038","\u0039","\u003a","\u003b","\u003c","\u003d","\u003e","\u003f","\u0040","\u0041","\u0042","\u0043","\u0044","\u0045","\u0046","\u0047","\u0048","\u0049","\u004a","\u004b","\u004c","\u004d","\u004e","\u004f","\u0050","\u0051","\u0052","\u0053","\u0054","\u0055","\u0056","\u0057","\u0058","\u0059","\u005a","\u005b","\u005c","\u005d","\u005e","\u005f","\u0060","\u0061","\u0062","\u0063","\u0064","\u0065","\u0066","\u0067","\u0068","\u0069","\u006a","\u006b","\u006c","\u006d","\u006e","\u006f","\u0070","\u0071","\u0072","\u0073","\u0074","\u0075","\u0076","\u0077","\u0078","\u0079","\u007a","\u007b","\u007c","\u007d","\u007e","\u007f","\u0080","\u0081","\u0082","\u0083","\u0084","\u0085","\u0086","\u0087","\u0088","\u0089","\u008a","\u008b","\u008c","\u008d","\u008e","\u008f","\u0090","\u0091","\u0092","\u0093","\u0094","\u0095","\u0096","\u0097","\u0098","\u0099","\u009a","\u009b","\u009c","\u009d","\u009e","\u009f","\u00a0","\u00a1","\u00a2","\u00a3","\u00a4","\u00a5","\u00a6","\u00a7","\u00a8","\u00a9","\u00aa","\u00ab","\u00ac","\u00ad","\u00ae","\u00af","\u00b0","\u00b1","\u00b2","\u00b3","\u00b4","\u00b5","\u00b6","\u00b7","\u00b8","\u00b9","\u00ba","\u00bb","\u00bc","\u00bd","\u00be","\u00bf","\u00c0","\u00c1","\u00c2","\u00c3","\u00c4","\u00c5","\u00c6","\u00c7","\u00c8","\u00c9","\u00ca","\u00cb","\u00cc","\u00cd","\u00ce","\u00cf","\u00d0","\u00d1","\u00d2","\u00d3","\u00d4","\u00d5","\u00d6","\u00d7","\u00d8","\u00d9","\u00da","\u00db","\u00dc","\u00dd","\u00de","\u00df","\u00e0","\u00e1","\u00e2","\u00e3","\u00e4","\u00e5","\u00e6","\u00e7","\u00e8","\u00e9","\u00ea","\u00eb","\u00ec","\u00ed","\u00ee","\u00ef","\u00f0","\u00f1","\u00f2","\u00f3","\u00f4","\u00f5","\u00f6","\u00f7","\u00f8","\u00f9","\u00fa","\u00fb","\u00fc","\u00fd","\u00fe"];
    bytes(num: number | bigint): number {
        let m = 0, s = 0n, x = 0n;
        if (typeof num == "bigint") x = num;
        else x = BigInt(parseInt(String(num)) || 0);
        //if (x >= 0xff_ff_ff_ff) throw Error("number too big");
        if (x < 0) throw Error("number cant be negative");
        //if(0x1_00_00_00n&x)return 4;
        while (true) {
            if ((x >> s) <= 0) break; m++; s += 8n;
        }
        return m;
    };


    #te = new TextEncoder;
    #td = new TextDecoder;
    te(input?: string): Uint8Array { return this.#te.encode(input) };
    td(input?: BufferSource, options?: TextDecodeOptions): String { return this.#td.decode(input, options) };
    sEnc(s: string): number[] { return String(s).split("").map(s => 0xff & s.charCodeAt(0)); };
    sDec(a: number[] | Uint8Array): string { return [...a].map(i => String.fromCharCode(i)).join(""); };

    #decInt(x: bigint, a: number): bigint[] {
        let buff: bigint[] = [], s = 0n;
        for (let i = BigInt(a - 1); 0 <= i; i--) {
            s = i * 8n
            buff.push((0xffn * 0x100n ** i & x) >> s);
        };
        return buff;
    };
    decInt(num: number | bigint): number[] {
        let /*z=parseInt(String(num))||0,*/x = 0n;
        if (typeof num == "bigint") x = num;
        else x = BigInt(parseInt(String(num)) || 0);
        return this.#decInt(x, this.bytes(x)).map(e => Number(e));
        /*let x = parseInt(String(num)) || 0;
        let a = this.bytes(x), buff: number[] = [], s = 0;
        for (let i = a - 1; 0 <= i; i--) {
            s = i * 8
            buff.push((0xff * 0x100 ** i & x) >>> s);
        };
        return buff;*/
    };
    encInt(buff: number[] | Uint8Array): bigint {
        let r = 0n;
        [...buff].toReversed().forEach((e, i) => r += BigInt(e) * 0x100n ** BigInt(i));
        return r;
    };

    cap(buff: number[], at: number = 4) {
        let rm = parseInt(String(at)) - buff.length;
        let c = [...buff].toReversed();
        c.length += rm;
        c = c.toReversed();
        return c.map(e => e || 0);
    };

    toHex(buff: number[], len: number = 0): string {
        let hs = this.encInt(buff).toString(16), rs = hs;
        if (len) rs = ('0'.repeat(len) + hs).substring(hs.length);
        return rs;
    };
    hexcap(num: number | bigint, cap = 4) {
        let hs = num.toString(16);
        return ('0'.repeat(cap) + hs).substring(hs.length);
    };
    /*hexcap(num:number,cap:number=4):string{
        let x=BigInt(parseInt(String(num))||0);
        let at=BigInt(parseInt(String(cap))||0);
        let mask=2n**(4n*at);
        return (mask+((mask-1n)&x)).toString(16).substring(1,1+cap);
    };*/

    uint8Correct(buff: number[] | Uint8Array): number[] {
        let arr = [...buff], nb: number[] = [];
        for (let i of arr) {
            let x = parseInt(String(i)) || 0;
            if (x < 0) x *= -1;
            //x=x&0xff_ff_ff_ff;
            let b = this.bytes(x);
            if (b == 1 || b == 0) nb.push(x);
            else if (b > 1) {
                nb.push(...this.decInt(BigInt(x)));
            };
        };
        return nb;
    };

    strToInt(str: string): bigint { return this.encInt(this.sEnc(str)); };
    intToStr(int: bigint | number) { return this.sDec(this.decInt(int)); };
}


export class Memory {
    #td = new TextDecoder;
    #te = new TextEncoder;

    #type = "u8"; #tx: ByteLib;
    #arraybuffer: ArrayBuffer | ArrayBufferLike;
    #buff: DataView;
    constructor(size: number | Uint8Array | ArrayBuffer = 0, { maxByteLength = size, type = "u8" } = {}, tx = new ByteLib) {
        maxByteLength = parseInt(String(maxByteLength)) || 0;
        if (typeof size == "object" && size instanceof ArrayBuffer) this.#arraybuffer = size;
        else if (typeof size == "object") this.#arraybuffer = size?.buffer;
        else if (this.#arraybuffer == null) this.#arraybuffer = new ArrayBuffer(parseInt(String(size)) || 0, { maxByteLength });
        this.#buff = new DataView(this.#arraybuffer);
        this.#type = type;
        this.#tx = tx;
    };

    get #bits() { return parseInt(this.#type.substring(1)) };
    get #length() { return this.#buff.byteLength / (this.#bits / 8) };
    #get(pos, littleEndian?: boolean, type = this.#type): number {
        switch (type) {
            case "u8": return this.#buff.getUint8(pos);
            case "u16": return this.#buff.getUint16(pos, littleEndian);
            case "u32": return this.#buff.getUint32(pos, littleEndian);

            case "i8": return this.#buff.getInt8(pos);
            case "i16": return this.#buff.getInt16(pos, littleEndian);
            case "i32": return this.#buff.getInt32(pos, littleEndian);

            case "f32": return this.#buff.getFloat32(pos, littleEndian);
            case "f64": return this.#buff.getFloat64(pos, littleEndian);

            default: return 0;
        };
    };
    #set(pos, byte, littleEndian?: boolean, type = this.#type) {
        switch (type) {
            case "u8": return this.#buff.setUint8(pos, byte);
            case "u16": return this.#buff.setUint16(pos, byte, littleEndian);
            case "u32": return this.#buff.setUint32(pos, byte, littleEndian);

            case "i8": return this.#buff.setInt8(pos, byte);
            case "i16": return this.#buff.setInt16(pos, byte, littleEndian);
            case "i32": return this.#buff.setInt32(pos, byte, littleEndian);

            case "f32": return this.#buff.setFloat32(pos, byte, littleEndian);
            case "f64": return this.#buff.setFloat64(pos, byte, littleEndian);

            default: return;
        };
    };

    write(start: number, data: number[] | string) {
        let buff: number[] = [], j = this.#bits / 8;
        if (typeof data == "string") buff = [...this.#te.encode(data)];
        else buff = data;
        if (start + data.length > this.#length) throw new Error("data exceeds buffer limit");
        for (let i = 0; i < buff.length; i++) {
            this.#set(start + (i * j), buff[i]);
        };
    };
    map(start: number = 0, end?: number): number[] {
        if (end == null) end = this.#length;
        if (start >= end) return [this.#get(start)];
        let r: number[] = [];
        for (let i = start; i < end; i++)r.push(this.#get(i));
        return r;
    };

    toUint8Array() {
        let r: number[] = [];
        for (let i = 0; i < this.#buff.byteLength; i++)r.push(this.#get(i, undefined, "u8"));
        return new Uint8Array(r);
    };

    toString() {
        return this.#td.decode(this.toUint8Array());
    }
}

/*export class Radix{
    static arrShift(arr:number[],radix:number):string[]{
        return arr.map(i=>i.toString(radix));
    }
}*/