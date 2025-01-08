//import { createCanvas } from "https://deno.land/x/canvas/mod.ts";

let createCanvas;
let del:Function;
let visits=0;
let maxvisits=3;
async function main(socket:HttpSocket){
    socket.setHeader("content-type","image/png");

    // Create a canvas
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background color
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, width, height);

    // Draw a rectangle
    ctx.fillStyle = "green";
    ctx.fillRect(100, 100, 200, 100);

    // Draw a circle
    ctx.beginPath();
    ctx.arc(400, 300, 50, 0, Math.PI * 2, false);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();

    // Add text
    ctx.fillStyle = "black";
    ctx.font = "17px Arial";
    ctx.fillText("Hello, "+new Date(), 10, 550);

    // Save the canvas as an image
    const imageBuffer = canvas.toBuffer("image/png");
    socket.close(imageBuffer);

    console.log("canvas.deno.ts Image generated",imageBuffer.length);

}
export default async function(socket, url, get, opt){
    await main(socket).catch(e=>e);
    visits++;
    if(visits>maxvisits)del();
}
export async function init(socket, url, get, opt, dele,self,imports){
    del=dele;
    await main(socket).catch(e=>e);
    createCanvas=imports.canvas.createCanvas;
    imports.logsole.log("canvas.deno.ts",createCanvas);
}