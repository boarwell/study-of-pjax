"use strict";
const serialize = ({ head, root }) => {
    const headHTML = head.outerHTML;
    const rootHTML = root.outerHTML;
    return JSON.stringify({ head: headHTML, root: rootHTML });
};
const restorePage = (serializedState) => {
    const state = JSON.parse(serializedState);
    const head = document.createElement('head');
    head.innerHTML = state.head;
    const root = document.createElement('div');
    root.innerHTML = state.root;
    const dom = {
        head,
        root
    };
    replaceDOM(dom);
};
const getHTML = async (src) => {
    // if we don't specify { cache: 'no-store' },
    // Chrome caches responses and doesn't send request (on my environment).
    const res = await fetch(src, { cache: 'no-store' });
    const html = await res.text();
    const domParser = new DOMParser();
    const fetchedDOM = domParser.parseFromString(html, 'text/html');
    return {
        head: fetchedDOM.head,
        root: fetchedDOM.querySelector('#domrep-root')
    };
};
const replaceHead = (newDOM) => {
    document.head.replaceWith(newDOM.head);
};
const replaceRoot = (newDOM) => {
    const root = document.querySelector('#domrep-root');
    root.replaceWith(newDOM.root);
};
const replaceDOM = (newDOM) => {
    replaceHead(newDOM);
    replaceRoot(newDOM);
};
const main = () => {
    const sampleButton = document.querySelector('#sample');
    sampleButton.addEventListener('click', async () => {
        const res = await getHTML('/sample.html');
        replaceDOM(res);
        history.pushState(serialize(res), '', '/sample.html');
    });
    const indexButton = document.querySelector('#index');
    indexButton.addEventListener('click', async () => {
        const res = await getHTML('/index.html');
        replaceDOM(res);
        history.pushState(serialize(res), '', '/index.html');
    });
    window.addEventListener('popstate', ev => {
        restorePage(ev.state);
    });
};
main();
