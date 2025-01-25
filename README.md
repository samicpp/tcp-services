# Tcp Services
Currently I only have 1 service.
- HTTP

## HTTP
- [`engine.ts`](/engine.ts): HTTP connection handling.
- [`http-server.ts`](/http-server.ts): Complex HTTP server using `engine.ts`.
- [`main.ts`](/main.ts): Responsible for setting up the HTTP server with `http-server.ts` and `engine.ts`

This server is running on [www.cppdev.dev](https://www.cppdev.dev/?reff=github). If anything peculiar happens please notify me by [mail](https://gmail.com) to [sami.cplusplus0@gmail.com](mailto:sami.cplusplus0@gmail.com) or make an issue. Same goes for feature requests.

### engine.ts
Methods and use cases specified in `docs.ts`.
Responsible for handling the HTTP connections starting from the TCP level with or without TLS. Supports HTTP/1.1, HTTP/2 and WebSocket.


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

##### Router files
These type of files will be used regardless of the pathname. Can be used for sites independent of the page.

If said file is a dynamic file (think of `.deno.ts` or `.async.js`) you could continue the connection like normal. The additional parameter `opt` will contain things like the original path to get files, all error handlers, file handler, directory handler and default handler.

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

# TODO
This is a list of things i might implement in the future.

- [ ] Fix elsint to make project compilable.
- [x] Make todo list.

## engine.ts
 - [ ] Fix client data reading.
 - [ ] ~~Full HTTP/3 support~~ (no QUIC support).
 - [x] Store system headers (things like `Content-Length`) separate from user configurable headers.
 - [x] Full HTTP/2 support (not just translation).

## http-server.ts
- [ ] Support FFI and WASM dynamic files.
- [ ] Improve configurability (e.g. variable error paths).

## main.ts
- [ ] Read and eval stdin input.
- [ ] Better CLI arguments.

## tcp-proxy.ts
- [ ] Make the service.
- [ ] TLS decryption.


# License

This project and everything in it is licensed under the GNU General Public License v3.0. See the [LICENSE](./LICENSE) file for details.
