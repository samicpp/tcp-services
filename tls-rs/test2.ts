const listener = Deno.listen({ port: 8080 }); // Plain TCP listener

for await (const conn of listener) {
  console.log("Plain connection received");
  
  const secureConn = await Deno.startTls(conn, {
    hostname: "localhost", // Server name for TLS certificate validation
    certFile: "D:\\fullchain.pem", // Path to server certificate
    keyFile: "D:\\privkey.pem",   // Path to server private key
  });

  console.log("Connection upgraded to TLS");
  secureConn.write(new TextEncoder().encode("Welcome to TLS\n"));
  secureConn.close();
}
