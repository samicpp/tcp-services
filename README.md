# Tcp Services
Currently I only have 1 service.
- HTTP

## HTTP
- `engine.ts`: HTTP connection handling.
- `http-server.ts`: Complex HTTP server using `engine.ts`.
- `main.ts`: responsible for setting up the HTTP server with `http-server.ts` and `engine.ts`

### engine.ts
Methods and use cases specified in `docs.ts`.
Responsible for handling the HTTP (or WebSocket) connection starting from the TCP/UDP level with or without TLS.


### http-server.ts
Dynamic files:
- `*.dyn.*`: Execute it as a multi line string with parameters Engine.HttpSocket, SpecialURL, the file location as a string. Content type is the same as the file extension
- `*.mod.ts`: Imports the file, stores the module and invokes `default` with Engine.HttpSocket, SpecialURL, the file location as a string.
- `*.async.js`: Turns the file into an async function and invokes it with Engine.HttpSocket, SpecialURL, the file location as a string.

#### Behaviour
If the path is a directory it will look for `index.*` or will look for a file that starts with the name of its parent directory.

The server will read and parse `config.json` everytime when a request happens and will look up which directory it needs to look in based of the hostname and port and will then add the result to `./http/` and read the file starting form that directory. This is stored in SPecialURL.tardir.

Paths to directories dont need to start with `/` and files are allowed to end with `/`.

When an error occours it will use the error files located in SpecialURL.tardir+`/errors/`+status code.
If it cant find an error file it wll send out a default response.