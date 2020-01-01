const ID = 'domrep-root';

type DOM = {
  head: HTMLHeadElement;
  root: HTMLElement;
};

type SerializedDOM = { [P in keyof DOM]: string };

/**
 * convert dom elements to string
 */
const serialize = ({ head, root }: DOM): string => {
  const headHTML = head.outerHTML;
  const rootHTML = root.outerHTML;

  return JSON.stringify({ head: headHTML, root: rootHTML });
};

/**
 * full (fetched) html to dom elements
 */
const createDOMFrom = (html: string): DOM => {
  const dom = new DOMParser().parseFromString(html, 'text/html');

  return {
    head: dom.head,
    root: dom.querySelector(`#${ID}`) as HTMLElement
  };
};

/**
 * rewrite current page by the argument
 */
const restorePage = (serializedDOMString: string): void => {
  const state: SerializedDOM = JSON.parse(serializedDOMString);
  const head = document.createElement('head');
  head.innerHTML = state.head;
  const root = document.createElement('div');
  root.innerHTML = state.root;

  const dom: DOM = { head, root };

  replaceDOM(dom);
};

/**
 * fetch html from the src and create dom element
 */
const getHTML = async (src: string): Promise<DOM> => {
  // if we don't specify { cache: 'no-store' },
  // Chrome caches responses and doesn't send request (on my environment).
  const res = await fetch(src, { cache: 'no-store' });
  const html = await res.text();

  return createDOMFrom(html);
};

/**
 * replace head element
 */
const replaceHead = (newDOM: DOM): void => {
  document.head.replaceWith(newDOM.head);
};

/**
 * replace root element
 */
const replaceRoot = (newDOM: DOM): void => {
  const root = document.querySelector(`#${ID}`) as HTMLElement;
  // if we use `replaceWith()` to the observed element,
  // it doesn't fire mutation event.
  root.innerHTML = '';
  root.appendChild(newDOM.root);
};

/**
 * (currently) replace head and root element
 */
const replaceDOM = (newDOM: DOM): void => {
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
const saveCurrentState = (): void => {
  const html = document.documentElement.outerHTML;
  history.replaceState(serialize(createDOMFrom(html)), '', null);
};

const hasHREF = ({ href }: HTMLAnchorElement) => href !== '';
const withoutHash = ({ href }: HTMLAnchorElement) => new URL(href).hash === '';
const isSameOriginWith = (currentURL: URL) => ({ href }: HTMLAnchorElement) =>
  new URL(href).origin === currentURL.origin;

/**
 * set an eventListener for <a> tags:
 * fetch the target HTML, replace DOM, and pushState
 */
const setup = (root: Element): void => {
  const currentURL = new URL(location.href);
  const listOfATag = [...root.querySelectorAll('a')];
  const targets = listOfATag
    .filter(hasHREF)
    .filter(withoutHash)
    .filter(isSameOriginWith(currentURL));

  targets.forEach(a => {
    a.addEventListener('click', async e => {
      e.preventDefault();
      const dest = (e.target as HTMLAnchorElement).href;
      const res = await getHTML(dest);
      replaceDOM(res);
      history.pushState(serialize(res), '', dest);
    });
  });
};

/**
 * restore page content
 */
const onPopstate = (ev: PopStateEvent): void => {
  restorePage(ev.state);
};

/**
 * when the mutation type is 'childList',
 * get the root element and setup
 */
const onMutation: MutationCallback = (mutations: MutationRecord[]) => {
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
  const root = document.querySelector(`#${ID}`)!;
  if (root === null) {
    console.log('root is null...');
    return;
  }
  new MutationObserver(onMutation).observe(root, { childList: true });
  setup(root);
  window.addEventListener('popstate', onPopstate);
};

main();
