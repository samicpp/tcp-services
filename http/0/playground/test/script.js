const canvas=document.querySelector("canvas"),
ctx=canvas.getContext("2d"),
aspect=window.innerWidth/window.innerHeight,
height=canvas.height=1440,
width=canvas.width=height*aspect;
keyboard=new Keyboard,
mouse=new Mouse,
{key}=keyboard;

const player=new Circle({x:width/2,y:height/2,radius:50,ctx,fillStyle:"#ccffdd"}),
background=new Rectangle({x:0,y:0,width,height,ctx,fillStyle:"#111"}),
projectiles=[];

let cooldown=0;
let shotcool=200;
let lastShot=0;


function moveCircle(c=player,x=0,y=0){
    //if((c.x+c.radius==width)&&x<0||0<x&&(c.x==c.radius)){}
    if(c.x+x+c.radius>=width)c.x=width-c.radius;
    else if(c.x+x-c.radius<=0)c.x=c.radius;
    else c.x+=x;

    //if((player.y+player.radius==height)&&y<0||0<y&&(player.y==player.radius)){}
    if(c.y+y+c.radius>=height)c.y=height-c.radius;
    else if(c.y+y-c.radius<=0)c.y=c.radius;
    else c.y+=y;

    ;
};
function dir([x,y],[x2,y2]){
    const dx=x-x2,dy=y-y2;
    const l=(dx**2+dy**2)**0.5;
    const a=Math.atan2(dy,dx);

    //console.log("dx,dy",dx,dy);
    return[
        Math.cos(a),
        Math.sin(a),
        l, a,
    ];
}


!async function gameloop1(){
    try{
        ctx.clearRect(0,0,100,100);
        background.draw();

        const rect = canvas.getBoundingClientRect();

        if(projectiles.length<1000&&lastShot+shotcool<Date.now()&&(mouse.down||key.Space)){
            let p=new Circle({x:player.x,y:player.y,radius:10,ctx,fillStyle:"#f99"});
            let nx=mouse.x*(width/innerWidth);
            let ny=mouse.y*(height/innerHeight);
            let [dx,dy]=dir([nx,ny],[p.x,p.y]);
            p.dx=dx;p.dy=dy;projectiles.push(p);
            p.dx*=5; p.dy*=5;
            lastShot=Date.now();
        };

        moveCircle(player,key.KeyA&&!key.KeyD?-10:(!key.KeyA&&key.KeyD?10:0),key.KeyW&&!key.KeyS?-10:(!key.KeyW&&key.KeyS?10:0));

        // if(key.KeyW)player.y-=10;
        // if(key.KeyS)player.y+=10;
        // if(key.KeyA)player.x-=10;
        // if(key.KeyD)player.x+=10;

        for(let i in projectiles){
            let p=projectiles[i];
            p.x+=p.dx; p.y+=p.dy;
            if(p.x-p.radius>width||p.y-p.radius>height||p.x+p.radius<0||p.y+p.radius<0)projectiles.splice(i,1);
            p.draw();

            /*let nx=mouse.x*(width/innerWidth);
            let ny=mouse.y*(height/innerHeight);
            let [dx,dy]=dir([nx,ny],[p.x,p.y]);
            p.dx=dx;p.dy=dy;
            p.dx*=5; p.dy*=5;*/
        }

        player.draw();
    }
    catch(err){console.error(err)}
    finally{
        if(cooldown>0)await new Promise(r=>setTimeout(r,cooldown));
        requestAnimationFrame(gameloop1);
    }
}();
!async function gameloop2(){
    try{
    }
    catch(err){}
    finally{
        requestAnimationFrame(gameloop2);
    }
}();
/*
!async function gameloop(){
    try{}
    catch(err){}
    finally{
        requestAnimationFrame(gameloop);
    }
}();
!async function heartbeat(){
    try{}
    catch(err){}
    finally{
        setTimeout(heartbeat);
    }
}();
!async function unsyncedLoop(){
    requestAnimationFrame(unsyncedLoop);
    try{}
    catch(err){}
}();

*/