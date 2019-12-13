"use strict";
const ID = 'domrep-root';
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
        root: dom.querySelector(`#${ID}`)
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
    const root = document.querySelector(`#${ID}`);
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
const observe = (root) => {
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
    mo.observe(root, { childList: true });
};
const setup = (id) => {
    const button = document.querySelector(`#${id}`);
    button.addEventListener('click', async () => {
        const res = await getHTML(`/${id}.html`);
        replaceDOM(res);
        history.pushState(serialize(res), '', `/${id}.html`);
    });
};
const main = () => {
    saveCurrentState();
    const root = document.querySelector(`#${ID}`);
    observe(root);
    setup('sample');
    setup('index');
    window.addEventListener('popstate', onPopstate);
};
main();
