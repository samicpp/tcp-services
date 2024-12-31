socket.setHeader("content-type", "image/png");

const canvas = imports.canvas.createCanvas(180,180);
const ctx = canvas.getContext("2d");


ctx.beginPath();
ctx.arc(90, 90, 90, 0, Math.PI * 2, false);
ctx.fillStyle = "white";
ctx.fill();
ctx.closePath();

ctx.beginPath();
ctx.arc(90, 90, 50, 0, Math.PI * 2, false);
ctx.fillStyle = "#350000";
ctx.fill();
ctx.closePath();

ctx.beginPath();
ctx.arc(90, 90, 30, 0, Math.PI * 2, false);
ctx.fillStyle = "black";
ctx.fill();
ctx.closePath();

ctx.fillStyle = "black";
ctx.font = "17px Arial";
ctx.fillText(socket.client.address.hostname, 1, 179);

// Save the canvas as an image
const imageBuffer = canvas.toBuffer("image/png");
socket.close(imageBuffer);

console.log("canvas.deno.ts Image generated", imageBuffer.length);