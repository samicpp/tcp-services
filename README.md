# Tcp Services
Currently I only have 1 service.
- HTTP

## HTTP
- `engine.ts`: HTTP connection handling.
- `http-server.ts`: Complex HTTP server using `engine.ts`.
- `main.ts`: responsible for setting up the HTTP server with `http-server.ts` and `engine.ts`

### engine.ts
Methods and use cases specified in `docs.ts`


### http-server.ts
dynamic files:
- `*.dyn.*`: execute it as a multi line string with parameters Engine.HttpSocket
