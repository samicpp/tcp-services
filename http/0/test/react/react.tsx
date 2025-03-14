import React from "npm:react";
import { Inp } from "./field.tsx";
import { Style } from "./style.tsx";

export function Main(){
    return (
        <div>
          <h1>Hello from React in Deno!</h1>
          <p>This page was rendered server-side.</p>
          <Inp/>
        </div>
      );
};


export default function(){
  //console.log("react.tsx",Style());
  return <>
  <html>
    <head><Style></Style></head>
    <body><Main></Main></body>
  </html>
  </>;
};