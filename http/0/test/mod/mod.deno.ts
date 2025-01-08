let del:Function;
let visits=0;
let imp;
export default async function(socket, url, get, opt){
    await socket.writeText("yeah "+visits);
    socket.close(); 
    visits++;
    if(visits>5)del();
}
export async function init(socket, url, get, opt, dele, self, imports){
    del=dele
    imp=imports;
    await socket.writeText("hello");
    socket.close(); 
}
