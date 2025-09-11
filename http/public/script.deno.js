// import * from "sys:bootstrap";

Deno.core.print("took too much pain :(\n");
//Deno.core.ops.http_close(new TextEncoder().encode("but i guess it works, maybe?"));

const k=Object.keys(Deno.core.ops);
Deno.core.print(`keys of Deno.core.ops: ${k}\n`);

console.log("hello from console.log")
console.log(`what about ${console} ${console.clear} ${console.assert}`,Object.getOwnPropertyDescriptors(console));
console.log(`global = ${Object.keys(Object.getOwnPropertyDescriptors(globalThis))}`);
console.log(`http object exist?`)

// Deno.core.ops.http_close("not as much fun writing this");

!async function(){
    const strap=await import("sys:bootstrap");
    const {http}=strap;
    console.log("called from within async",strap,http);
    http.close("yay");
}()