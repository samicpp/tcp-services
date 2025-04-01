let s1, s2, ra = false;

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
                const crcm=this.getAttribute("code");
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
        customElements.define('copy-js', CopyJS);
        customElements.define('open-js', OpenJS);


        doc.title="dlo opties";
        doc.body.outerHTML = `<body class="dark">
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
            <input placeholder="token" type="password"></input>
            <span></span>
        </div>
        <script>ready()</script>
    </body>`
        await p;
    } catch (_err) {
        //alert(_err);
        return;
    }
};