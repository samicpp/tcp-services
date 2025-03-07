@external("env","close")
export declare function close(s: i32[]): void;

@external("env","write")
export declare function write(s: i32[]): void;

@external("env","getClientData")
export declare function getClientData(property:i32[]): u8[];

export function exec():void{
    let p:string=getClientData("path".split("").map((s:string)=>s.charCodeAt(0))).map((i:u8)=>String.fromCharCode(i)).join("");
    write(("welcome to "+p).split("").map((s:string)=>s.charCodeAt(0)));
    close("\r\n".split("").map((s:string)=>s.charCodeAt(0)));
}
