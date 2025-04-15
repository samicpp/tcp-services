let s1, s2, ra = false;

function cmd(n, ...j) {
    return n + JSON.stringify(j);
};
export function a(s) { s1 = s };
export function b(s) { s2 = s };
export default async function (c2, c1, doc) {
    if (ra) return; ra = true;
    //alert("craz");
    //console.log(s1,s2,c1,c2);
    try {
        if (!s1 || !s2 || !c1 || !c2) throw "undefined things";
        if (s1 !== c1 || s2 !== c2) throw "not equal";
        if (s1 == s2 || c1 == c2) throw "params equal";
        if (doc !== document) throw "doc not equal";
        if (!"".match(s2)) throw "string mismatch";
        if (c1.r == c1.r) throw "not rand num";

        let p = new Promise(r => globalThis.ready = r);
        const cmap = globalThis.cmap = {
            ins: await fetch("/v2/scripts/inspect.oc.js").then(r => r.text()),
            xpl: await fetch("/v2/scripts/source.oc.js").then(r => r.text()),
            ciu: "chrome://inspect",
        };

        class CopyJS extends HTMLElement {
            

            constructor() {
                super();
                // this.attachShadow({ mode: 'open' });

                this.addEventListener('click', this.handleClick);
            }


            handleClick() {
                const crcm = this.getAttribute("code");
                navigator.clipboard.writeText(cmap[crcm]);
            }

            connectedCallback() {
                ;
            }
        };
        class OpenJS extends HTMLElement {

            constructor() {
                super();
                // this.attachShadow({ mode: 'open' });

                this.addEventListener('click', this.handleClick);
            }



            handleClick() {
                open(this.getAttribute("href"));
            }

            connectedCallback() {
                ;
            }
        };
        class ChecklJS extends HTMLElement {
            #list=[]; #map={};
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });

                this.addEventListener('click', this.handleClick);
                //this.update();
            }

            update(){
                this.#list=JSON.parse(this.textContent);this.#map={};
                //this.innerHTML='';
                const sp=parseInt(this.getAttribute("spaces"))||1;
                const nl=parseInt(this.getAttribute("newline"))||3;
                const arr=[];
                this.shadowRoot.childNodes.forEach(e=>arr.push(e));
                arr.forEach(e=>e.remove());

                console.log(arr,this.#list,this.#map,sp,nl);

                let l=0;
                for(const i of this.#list){
                    console.log(i);
                    const c1=new Text(" ".repeat(sp)+i);
                    const c2=doc.createElement("input");
                    c2.type="checkbox";
                    c2.addEventListener("change",()=>this.clickItem(i));
                    this.shadowRoot.appendChild(c1);
                    this.shadowRoot.appendChild(c2);
                    if(l++>=nl){
                        this.shadowRoot.appendChild(doc.createElement("br"));
                        l=0;
                    };
                    console.log(c1,c2,l);
                };
            };

            clickItem(name){
                this.#map[name]=!this.#map[name];
            };
            get map(){return {...this.#map}};

            handleClick() {
                ;
            }
  
            connectedCallback() {
                ;
            }
        };
        customElements.define('copy-js', CopyJS);
        customElements.define('open-js', OpenJS);
        customElements.define('checkl-js', ChecklJS);


        //doc.title = "dlo opties";
        doc.write(`<!DOCTYPE HTML>
<html>
    <head>
        <title>dlo opties</title>
        <link rel="stylesheet" href="/style.css"/>
        <link rel="stylesheet" href="/v2/style.css"/>
        <style>
            body{
                --vertical: 0.5%;
            }
        </style>
    </head>
    
    <body class="dark" onload="ready()">
        <h1>dlo aerobe hack</h1>
        <span class="red">als je gepakt wordt is dat echt jouw probleem.</span>
        <p>
            <span class="grey">instaleren<span>
            <ol>
                <li>open een nieuw tabblad en typ <copy-js code="ciu">chrome://inspect</copy-js> <span class="grey">(klik om te kopieren)</grey> en druk op enter</li>
                <li>druk met <span class="light-green">twee vingers</span> op de mouse pad of druk op <key>CTRL</key> + <key>SHIFT</key> + <key>J</key></li>
                <li>zorg ervoor dat inspecteren staat op <var>Console</var></li>
                <li>typ <var>allow pasting</var> en druk op enter <span class="grey">zodat je dingetjes kan plakken</span></li>
                <li>copier <copy-js code="ins">dit</copy-js> en plak het erin, sluit daarna het venster en het tabblad</li>
                <li>plak daarna <copy-js code="xpl">dit</copy-js> in het geopende venster. sluit het daarna ook</li>
                <li>je krijgt een melding met een titel van een aantal nummertjes. dit is je token. <span class="grey">bewaar deze want om de melding opnieuw te krijgen moet je opnieuw opstarten</span></li>
                <li>de token heb je nodig om je instellingen aan te passen. <span class="grey"><span class="red">andere kunnen dit ook</span> met je token dus wees voorzichtig</span></li>
            </ol>
            <ul>
                <li>elke keer dat je chromebook opnieuw opstart <span class="red">gaan de hacks weg</span></li>
                <li>als er iets is, stuur een mail naar <open-js href="mailto:shibahax@gmail.com">shibahax@gmail.com</open-js> <span class="red bold">met je school mail</span> <span class="grey">(als je het niet via je school mail stuurt antwoord ik niet)</span></li>
                <li>ik ben voor <span class="red">niks</span> verantwoordelijk dat er met je hierdoor gebeurt</li>
                <li>ik ben <span class="red">geen hacker</span>, dit heet gewoon hacks voor duidelijkheid. jij bent ook geen hacker</li>
                <li>als je dit deelt wees dan voorzichtig</li>
                <li>als ik iets van de school hoor of een mailtje krijg van school word dit <span class="red">meteen gestopt</span>, <span class="grey">de scriptjes doen het dan ook niet meer</span></li>
            </ul>
        </p>
        <div class="options">
            <input placeholder="token" type="password"/> <button style="display: none;">login</button> <br/>
            <div class="menu" style="display: none;">
                <textarea></textarea> <p>ruwe opties. <span class="grey">alleen gebruken als je weet wat het is</span></p> <br/>
                <checkl-js spaces="5" newline="2"></checkl-js> <br/> <br/>
                <button>opslaan</button>
            </div>
        </div>
        <script>ready()</script>
    </body>
</html>`);
        await p; console.log("everything loaded");

        docLoad();




    } catch (_err) {
        //alert(_err);
        console.error(_err);
        return;
    }
};

const rxc=['request.student.tabs','request.student.screen','refresh','refresh.sso','app.start','navigate','closetab','whitelist.allow','whitelist.deny'];
const txc=['send.student.tabs','send.student.screen'];
const trx=[...rxc,...txc];
//const rxl=Object.fromEntries(rxc.map(e=>[e,true]));
//const txl=Object.fromEntries(txc.map(e=>[e,true]));

function docLoad() {
    let valid = false, ws;
    const [inp, btn, menu, ta, check, btn2] = document.querySelectorAll("input,button,.menu,textarea,checkl-js,button"); // button 2x cause of readability
    console.log(inp, btn, menu, ta, check);

    async function start(e) {
        if(ws&&ws.readyState!=1)valid=false;
        if(valid)return;
        console.log("event onchange", e, inp);
        const r = await fetch("/v2", { method: "POST", body: inp.value }).then(r => r.json());
        if (r) { menu.style.display = "block"; valid = true; }
        else menu.style.display = "none";

        if (r && ws?.readyState != 1) {
            globalThis.ws = ws = new WebSocket("/v2?t=m&uid=" + inp.value);
            ws.onclose = () => {
                menu.style.display = "none";
                valid = false;
            };
            ws.onmessage = m => {
                const str = String(m.data)
                const js = "[" + (str.replace(/^.*?(\[|$)/, "") || "]");
                const j = (() => { try { return JSON.parse(js) } catch (_err) { return [] } })();

                if (str.startsWith("config")) {
                    for (const c of j) ta.value = JSON.stringify(c);
                }
            };
            ws.onopen = () => {
                ws.send(cmd("notify", {
                    title: "login",
                    message: "iemand heeft met jouw token ingelogd",
                }));
                ws.send(("config[]"));
            };
        };
    };

    console.log(start);

    check.innerText=JSON.stringify(trx);
    check.update();

    globalThis.start=start;
    globalThis.valid=()=>valid;

    //console.log(globalThis,inp.addEventListener,btn.addEventListener);

    // btn.onclick=start;
    //btn.addEventListener("click",start);
    inp.addEventListener("change", start);
    //inp.addEventListener("keyup", e=>e.code=="Enter"?start():null);

    btn2.addEventListener("click",click=>{
        ;
    });
}