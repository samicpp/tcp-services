# Tcp Services
This project consists of 2 parts: [A library (`engine.ts`)](#enginets) and [a handler](#http-serverts) (`http-server.ts` and `main.ts`)

## HTTP
- [`engine.ts`](#enginets): HTTP connection handling. [File](/engine.ts).
- [`http-server.ts`](#http-serverts): Complex HTTP server using `engine.ts`. [File](/http-server.ts).
- [`main.ts`](#maints): Responsible for setting up the HTTP server with `http-server.ts` and `engine.ts`. [File](/main.ts).

This server is running on [www.cppdev.dev](https://www.cppdev.dev/?reff=github). If anything peculiar happens please notify me by [mail](https://gmail.com) to [sami.cplusplus0@gmail.com](mailto:sami.cplusplus0@gmail.com) or make an issue. Same goes for feature requests.

### engine.ts
Methods and use cases specified in `docs.ts`.
Responsible for handling the HTTP connections starting from the TCP level with or without TLS. Supports HTTP/1.1, HTTP/2 and WebSocket.
This file is located at [`/engine.ts`](/engine.ts).


### http-server.ts
This is a webhandler with some complexity that uses [engine.ts](#enginets) for TCP/HTTP handling. See [Behaviour](#behaviour) for more details.
On its own this module only exports the handling functions and doesnt actually start a server.
This file is located at [`/http-server.ts`](/http-server.ts).

#### Behaviour
If the path is a directory it will look for `index.*` or will look for a file that starts with the name of its parent directory.

The server will read and parse `config.json` everytime when a request happens and will look up which directory it needs to look in based of the hostname and port and will then add the result to `./http/` and read the file starting form that directory. This is stored in SpecialURL.tardir. Optionably can also use a router file.

Paths to directories dont need to start with `/` and files are allowed to end with `/`.

When an error occours it will use the error files located in SpecialURL.tardir+`/errors/`+status code.
If it can't find an error file it wll send out a default response.

Will cache certain responses and all files. Customizable with the variable `cacheTIme` with miliseconds in `http-server.ts:20:23`.

##### config.json
In here you can route certain hosts to certain directories. E.g. upgrade http connections to https.

In config.json a property is read based of this format: `protocol(commonly http or https)://hostname:port(if applicable. think of defualt port like 80 and 443)`.
The value of said property is another json object with 2 properties, where's the second one not mandatory
- `dir`: Specify the directory which will be looked in. Is a string.
- `router`: Specify the filename of the router. Is a string and optionable.

#### Dynamic files:
- `*.dyn.*`: Execute it as a multi line string with parameters Engine.HttpSocket, SpecialURL, the file location as a string. Content type is the same as the file extension
- `*.mod.ts`: Imports the file, stores the module and first invokes `init` and later invokes `default` with Engine.HttpSocket, SpecialURL, the file location as a string.
- `*.async.js`: Turns the file into an async function and invokes it with Engine.HttpSocket, SpecialURL, the file location as a string.
- `*.link`: Contains the path of another file which will be processed as if it were the original file.
- `*.proxy.json`: Parses the json file and will fetch the destination and show that to the client.
- `*.ai.json`: Uses ai to generate a response.


##### Router files
These type of files will be used regardless of the pathname. Can be used for sites independent of the page.

If said file is a dynamic file (think of `.deno.ts` or `.async.js`) you could continue the connection like normal. The additional parameter `opt` will contain things like the original path to get files, all error handlers, file handler, directory handler and default handler.

### main.ts
Imports engine.ts, http-server.ts and starts a server.
You can configure this server with cli parameters or with an .env file.
- `--http=PORT`: A port to listen on without tls. Can be used multiple times for multiple ports.
- `--https=PORT`: A port to listen on with tls. Can also be used multiple times for multiple ports.
- `--dyn=PORT`: A port to listen on with a proxy. The proxy will automatically upgrade the connection to tls if a tls connection was attempted to make (think tls over port 80). The original ip address is given without showing `lo` addresses (like `127.0.0.1`) unlike normally seen with proxies.

#### Env file.
The env file contains things like the tls cert paths.
You can find the most recent env files in [`example.env`](/example2.env) and [`example2.env`](/example2.env).
This is taken from `example.env` at Tuesday March 04 2025 13:45:21 GMT+0100 (Central-European standard time).
```env
# main.ts
envonly="1"

dyn=""
http="8080"
https="1443"

silent="0"

useTls="1"
keyfile="./localhost.key"
certfile="./localhost.crt"
cafile=""
alpn="h2;http/1.1"

logcatfile="./logcat.log"
loglevels="debug;debug2;info;log;log2;log3;warn;warn2;error;error2"

# http-server.ts
openai_key="api key"

dissallow=".no;.not"
```
This example might not be up-to-date.

##### Properties
- `dissallow`: `http-server.ts` wont send a response if the file ends with any of those file extensions (seperated by `;`).
- `logcatfile`: Stores console output in there.
- `loglevels`: Contains a list of log levels (such as `error`, `log`, and `debug`) to output to stdout.
- `envonly`: Makes `main.ts` ingore cli params.
- `dyn` `http` `https`: Acts like the cli params `dyn` `http` `https`.
- `silent`: Won't write logs to stdout.
- `alpn`: ALPN list seperated by `;`.
- `useTls`: If `1` will try to read the tls files, if `0` won't.
- `openai_key`: Contains an openai api key for `*.ai.json` files (Dynamic files)[#dynamicfiles]

#### Run examples
```bash
# Run tls and plain tcp on both port 80 and 443
deno run --allow-read --allow-write --allow-net ./main.ts --dyn=80 --dyn=443


# Standard server
deno run --allow-read --allow-write --allow-net ./main.ts --http=80 --https=443

# Env only
deno run --allow-read --allow-write --allow-net --env-file ./main.ts
```

# TODO
This is a list of things i might implement in the future.

- [ ] Fix elsint to make project compilable.
- [x] Make todo list.

## engine.ts
 - [ ] Fix client data reading.
 - [ ] ~~Full HTTP/3 support~~ (no QUIC support).
 - [x] Store system headers (things like `Content-Length`) separate from user configurable headers.
 - [x] Full HTTP/2 support (not just translation).
 - [ ] Fix HPACK decoding.

## http-server.ts
- [ ] Support FFI and WASM dynamic files.
- [ ] Improve configurability (e.g. variable error paths).

## main.ts
- [ ] Read and eval stdin input.
- [ ] Better CLI arguments.
- [x] Env support

## ~~tcp-proxy.ts~~
- [ ] ~~Make the service.~~
- [ ] ~~TLS decryption.~~

# Credits
This project makes use of [Dancrumb's](https://github.com/dancrumb) [hpack repo](https://github.com/dancrumb/hpack).

# License

This project and everything in it is licensed under the GNU General Public License v3.0. See the [LICENSE](./LICENSE) file for details.
