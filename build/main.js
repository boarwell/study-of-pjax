"use strict";
const getHTML = async (src) => {
    const res = await fetch(src);
    const html = await res.text();
    const domParser = new DOMParser();
    const fetchedDOM = domParser.parseFromString(html, 'text/html');
    return {
        head: fetchedDOM.head
    };
};
const replaceHead = (newDOM) => {
    document.head.replaceWith(newDOM.head);
};
const main = () => {
    const button = document.querySelector('#sample');
    button.addEventListener('click', async () => {
        const res = await getHTML('/sample.html');
        replaceHead(res);
    });
};
main();
