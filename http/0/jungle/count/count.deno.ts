let del:Function;
let visits=0;
export default async function(socket:HttpSocket, url, get){
    socket.setHeader("Content-Type","text/plain");
    socket.close(visits.toString());
    visits++;
    if(url.hash=="#reset")del();
}
export async function init(socket:HttpSocket, url, get, dele, self, imports){
    del=dele;
    socket.setHeader("Content-Type","text/plain");
    socket.close(visits.toString());
    visits++;
}
