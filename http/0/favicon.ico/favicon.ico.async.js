socket.setHeader("Content-Type", "image/png");
//console.log("header set succesfull",res);

const canvas = imports.canvas.createCanvas(256,256);
const ctx = canvas.getContext("2d");


ctx.beginPath();
ctx.arc(128, 128, 115, 0, Math.PI * 2, false);
ctx.fillStyle = "black";
ctx.fill();
ctx.closePath();

ctx.beginPath();
ctx.arc(128, 128, 92, 0, Math.PI * 2, false);
ctx.fillStyle = "#ff1900"; // light red ig
ctx.fill();
ctx.closePath();

ctx.beginPath();
ctx.arc(128, 128, 88, 0, Math.PI * 2, false);
ctx.fillStyle = "black";
ctx.fill();
ctx.closePath();

ctx.fillStyle = "black";
ctx.font = "17px Arial";
ctx.fillText(socket.client.address.hostname, 1, 250);

// Save the canvas as an image
const imageBuffer = canvas.toBuffer("image/png");
socket.close(imageBuffer);

console.log("canvas.deno.ts Image generated", imageBuffer.length);