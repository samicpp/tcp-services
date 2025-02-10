class Circle{
    ctx=null;
    radius=0;
    fillStyle="#000"
    x=0;
    y=0;
    constructor({x=0,y=0,radius=0,ctx=null,fillStyle="#000"}={}){
        //if(typeof arguments[0]!="object")return;
        this.ctx=ctx;
        this.radius=radius;
        this.fillStyle=fillStyle;
        this.x=x;
        this.y=y;
    }
    draw(){
        if(!ctx)return;
        this.ctx.beginPath();
        this.ctx.fillStyle=this.fillStyle;
        this.ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        this.ctx.fill();
        this.ctx.closePath();
    }
};
class Rectangle{
    ctx=null;
    width=0;
    height=0;
    fillStyle="#000"
    x=0;
    y=0;
    constructor({x=0,y=0,width=0,height=0,ctx=null,fillStyle="#000"}={}){
        //if(typeof arguments[0]!="object")return;
        this.ctx=ctx;
        this.width=width;
        this.height=height;
        this.fillStyle=fillStyle;
        this.x=x;
        this.y=y;
    }
    draw(){
        if(!ctx)return;
        this.ctx.beginPath();
        this.ctx.fillStyle=this.fillStyle;
        this.ctx.rect(this.x,this.y,this.width,this.height);
        this.ctx.fill();
        this.ctx.closePath();
    }
}