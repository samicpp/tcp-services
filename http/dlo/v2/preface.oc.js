(async function idle(){
    console.log("DOMContentLoaded",
        await new Promise(r=>addEventListener("DOMContentLoaded",r))
    );
})();