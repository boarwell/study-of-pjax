"use strict";
const serialize = ({ head, root }) => {
    const headHTML = head.outerHTML;
    const rootHTML = root.outerHTML;
    return JSON.stringify({ head: headHTML, root: rootHTML });
};
const createDOMFrom = (html) => {
    const dp = new DOMParser();
    const dom = dp.parseFromString(html, 'text/html');
    return {
        head: dom.head,
        root: dom.querySelector('#domrep-root')
    };
};
const restorePage = (serializedDOMString) => {
    const state = JSON.parse(serializedDOMString);
    const head = document.createElement('head');
    head.innerHTML = state.head;
    const root = document.createElement('div');
    root.innerHTML = state.root;
    const dom = { head, root };
    replaceDOM(dom);
};
const getHTML = async (src) => {
    // if we don't specify { cache: 'no-store' },
    // Chrome caches responses and doesn't send request (on my environment).
    const res = await fetch(src, { cache: 'no-store' });
    const html = await res.text();
    return createDOMFrom(html);
};
const replaceHead = (newDOM) => {
    document.head.replaceWith(newDOM.head);
};
const replaceRoot = (newDOM) => {
    const root = document.querySelector('#domrep-root');
    // if we use `replaceWith()` to the observed element,
    // it doesn't fire mutation event.
    root.innerHTML = '';
    root.appendChild(newDOM.root);
};
const replaceDOM = (newDOM) => {
    replaceHead(newDOM);
    replaceRoot(newDOM);
};
/**
 * for the following situation:
 * newly load a page -> go to somewhere -> browser back
 *
 * if we don't save the initial page state,
 * we lost the way to back to there.
 */
const saveCurrentState = () => {
    const html = document.documentElement.outerHTML;
    history.replaceState(serialize(createDOMFrom(html)), '', null);
};
const onPopstate = (ev) => {
    restorePage(ev.state);
};
const observe = () => {
    const mo = new MutationObserver(mutations => {
        console.log('mutation');
        for (const mutation of mutations) {
            switch (mutation.type) {
                case 'childList':
                    // TODO:
                    break;
            }
        }
    });
    const root = document.querySelector('#domrep-root');
    mo.observe(root, { childList: true });
};
const main = () => {
    saveCurrentState();
    observe();
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
    window.addEventListener('popstate', onPopstate);
};
main();
