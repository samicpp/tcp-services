# Tcp Services
Currently I only have 1 service.
- HTTP

## HTTP
- `engine.ts`: HTTP connection handling.
- `http-server.ts`: Complex HTTP server using `engine.ts`.
- `main.ts`: responsible for setting up the HTTP server with `http-server.ts` and `engine.ts`

### engine.ts
Methods and use cases specified in `docs.ts`.
Responsible for handling the HTTP (or WebSocket) connections starting from the TCP/UDP level with or without TLS.


### http-server.ts
Dynamic files:
- `*.dyn.*`: Execute it as a multi line string with parameters Engine.HttpSocket, SpecialURL, the file location as a string. Content type is the same as the file extension
- `*.mod.ts`: Imports the file, stores the module and first invokes `init` and later invokes `default` with Engine.HttpSocket, SpecialURL, the file location as a string.
- `*.async.js`: Turns the file into an async function and invokes it with Engine.HttpSocket, SpecialURL, the file location as a string.
- `*.link`: Contains the path of another file which will be processed as if it were the original file.
- `*.proxy.json`: Parses the json file and will fetch the destination and show that to the client.
- `*.ai.json`: Uses ai to generate a response.

#### Behaviour
If the path is a directory it will look for `index.*` or will look for a file that starts with the name of its parent directory.

The server will read and parse `config.json` everytime when a request happens and will look up which directory it needs to look in based of the hostname and port and will then add the result to `./http/` and read the file starting form that directory. This is stored in SPecialURL.tardir.

Paths to directories dont need to start with `/` and files are allowed to end with `/`.

When an error occours it will use the error files located in SpecialURL.tardir+`/errors/`+status code.
If it can't find an error file it wll send out a default response.

Will cache certain responses and all files. Customizable with the variable `cacheTIme` with miliseconds in `http-server.ts:20:23`.

### main.ts
Imports engine.ts, http-server.ts and starts a server.
You can configure this server with cli parameters.
- `--http=PORT`: A port to listen on without tls. Can be used multiple times for multiple ports.
- `--https=PORT`: A port to listen on with tls. Can also be used multiple times for multiple ports.
- `--dyn=PORT`: A port to listen on with a proxy. The proxy will automatically upgrade the connection to tls if a tls connection was attempted to make (think tls over port 80). IP integrity remained meaning the original ip address is given without `127.0.0.1` like normally.

#### Run examples
```bash
# Run tls and plain tcp on both port 80 and 443
deno run --allow-read --allow-write --allow-net ./main.ts --dyn=80 --dyn=443


# Standard server
deno run --allow-read --allow-write --allow-net ./main.ts --http=80 --https=443
```