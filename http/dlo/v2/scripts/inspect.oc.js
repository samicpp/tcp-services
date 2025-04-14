// [...document.querySelectorAll("#service-workers-list .properties-box")].find(e=>e.textContent.includes("heklbdfkgeanjdbpdccflbbgjhmooaol")).childNodes[0].childNodes[1].childNodes[0].click()
/*const we=open("chrome://inspect");
// we.window.addEventListener("load",
setTimeout(()=>{
    const na=[...we.document.querySelectorAll("#service-workers-list .properties-box")];
    const me=na.find(e=>e.textContent.includes("heklbdfkgeanjdbpdccflbbgjhmooaol"));
    const ib=me.childNodes[0].childNodes[1].childNodes[0];
    ib.click();
    globalThis.s=[na,me,ib]
    console.log("na",na);
    console.log("me",me);
    console.log("ib",ib);
    setTimeout(()=>wa.close(),1000);
},3000);*/

const na=[...document.querySelectorAll("#service-workers-list .properties-box")];
const me=na.find(e=>e.textContent.includes("heklbdfkgeanjdbpdccflbbgjhmooaol"));
const ib=me.childNodes[0].childNodes[1].childNodes[0];
ib.click();