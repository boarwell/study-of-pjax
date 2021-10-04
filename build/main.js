"use strict";
const ID = 'domrep-root';
/**
 * convert dom elements to string
 */
const serialize = ({ head, root }) => {
    const headHTML = head.outerHTML;
    const rootHTML = root.outerHTML;
    return JSON.stringify({ head: headHTML, root: rootHTML });
};
/**
 * full (fetched) html to dom elements
 */
const createDOMFrom = (html) => {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    return {
        head: dom.head,
        root: dom.querySelector(`#${ID}`)
    };
};
/**
 * rewrite current page by the argument
 */
const restorePage = (serializedDOMString) => {
    const state = JSON.parse(serializedDOMString);
    const head = document.createElement('head');
    head.innerHTML = state.head;
    const root = document.createElement('div');
    root.innerHTML = state.root;
    const dom = { head, root };
    replaceDOM(dom);
};
/**
 * fetch html from the src and create dom element
 */
const getHTML = async (src) => {
    // if we don't specify { cache: 'no-store' },
    // Chrome caches responses and doesn't send request (on my environment).
    const res = await fetch(src, { cache: 'no-store' });
    const html = await res.text();
    return createDOMFrom(html);
};
/**
 * replace head element
 */
const replaceHead = (newDOM) => {
    document.head.replaceWith(newDOM.head);
};
/**
 * replace root element
 */
const replaceRoot = (newDOM) => {
    const root = document.querySelector(`#${ID}`);
    // if we use `replaceWith()` to the observed element,
    // it doesn't fire mutation event.
    root.innerHTML = '';
    root.appendChild(newDOM.root);
};
/**
 * (currently) replace head and root element
 */
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
const hasHREF = ({ href }) => href !== '';
const withoutHash = ({ href }) => new URL(href).hash === '';
const isSameOriginWith = (currentURL) => ({ href }) => new URL(href).origin === currentURL.origin;
/**
 * set an eventListener for <a> tags:
 * fetch the target HTML, replace DOM, and pushState
 */
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
/**
 * restore page content
 */
const onPopstate = (ev) => {
    restorePage(ev.state);
};
/**
 * when the mutation type is 'childList',
 * get the root element and setup
 */
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
/**
 * main
 */
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
