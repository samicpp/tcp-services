export function add(x:i32,y:i32):i32{
    return x+y;
};
export function sub(x:i32,y:i32):i32{
    return x-y;
};
export function mult(x:i32,y:i32):i32{
    return x*y;
};
export function div(x:i32,y:i32):i32{
    return x/y;
};
export function pow(x:i32,y:i32=2):i32{
    return x**y;
};
export function sqrt(x:i32,y:i32=2):i32{
    return x**(y**-1);
};
export function mod(x:i32,y:i32):i32{
    return x%y;
};
export function rand():f64{
    return Math.random();
};