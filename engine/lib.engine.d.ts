interface Eventable{
    on(name:string,listener:(obj:any)=>void|Promise<void>): void;
    emit(name:string,obj:any): void;
}

interface EngineReplacer extends Eventable{
    readonly WebSocket;
    readonly HttpSocket;
    readonly Http2Socket;
    readonly readSize: number;
}