let del:Function;
let visits=0;
export default async function(socket, url, get){
    await socket.writeText("yeah "+visits);
    socket.close(); 
    visits++;
    if(visits>5)del();
}
export async function init(socket, url, get, dele, self, imports){
    del=dele
    await socket.writeText("hello");
    socket.close(); 
}
