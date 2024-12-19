const lib = Deno.dlopen(
    "./target/debug/tls.dll", // Adjust path if necessary
    {
      upgrade_to_tls: {
        parameters: ["i32", "pointer", "usize", "pointer", "usize"], // Correct parameter types
        result: "i32", // Correct return type
      },
    },
  );
  
  // Extract the function
  const { upgrade_to_tls: upgradeToTLS } = lib.symbols;
  
  // Example usage
  (async () => {
    const server = Deno.listen({ port: 1234 });
    console.log("Listening on port 1234");
  
    for await (const conn of server) {
      const tcpRid = conn.rid;
  
      const cert = await Deno.readFile("D:\\fullchain.pem"); // Read certificate as a Uint8Array
      const key = await Deno.readFile("D:\\privkey.pem"); // Read key as a Uint8Array
  
      const certBuffer = Deno.UnsafePointer.of(cert.buffer);
      const keyBuffer = Deno.UnsafePointer.of(key.buffer);
  
      const tlsRid = upgradeToTLS(
        tcpRid,
        certBuffer,
        cert.byteLength,
        keyBuffer,
        key.byteLength,
      );
  
      if (tlsRid < 0) {
        console.error("TLS upgrade failed");
      } else {
        console.log("Connection upgraded to TLS:", tlsRid);
        const tlsConn = new Deno.Conn(tlsRid);
        // Proceed with your secure connection
      }
    }
  })();
  