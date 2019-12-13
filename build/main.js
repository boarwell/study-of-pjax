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
const hasHREF = (a) => a.href !== '';
const withoutHash = (a) => new URL(a.href).hash === '';
const isSameOriginWith = (currentURL) => (a) => new URL(a.href).origin === currentURL.origin;
const setup = (root) => {
    const currentURL = new URL(location.href);
    const listOfATag = [...root.querySelectorAll('a')];
    const targets = listOfATag
        .filter(hasHREF)
        .filter(withoutHash)
        .filter(isSameOriginWith(currentURL));
    targets.forEach(a => {
        a.addEventListener('click', async (e) => {
            e.preventDefault();
            const dest = e.target.href;
            const res = await getHTML(dest);
            replaceDOM(res);
            history.pushState(serialize(res), '', dest);
        });
    });
};
const onPopstate = (ev) => {
    restorePage(ev.state);
};
const onMutation = (mutations) => {
    console.log('mutation');
    mutations
        .filter(m => m.type === 'childList')
        .forEach(() => {
        const root_ = document.querySelector(`#${ID}`);
        if (root_ !== null) {
            setup(root_);
        }
    });
};
const main = () => {
    saveCurrentState();
    const root = document.querySelector(`#${ID}`);
    if (root === null) {
        console.log('root is null...');
        return;
    }
    new MutationObserver(onMutation).observe(root, { childList: true });
    setup(root);
    window.addEventListener('popstate', onPopstate);
};
main();
