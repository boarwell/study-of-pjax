const ID = 'domrep-root';

type DOM = {
  head: HTMLHeadElement;
  root: HTMLElement;
};

type SerializedDOM = { [P in keyof DOM]: string };

const serialize = ({ head, root }: DOM): string => {
  const headHTML = head.outerHTML;
  const rootHTML = root.outerHTML;

  return JSON.stringify({ head: headHTML, root: rootHTML });
};

const createDOMFrom = (html: string): DOM => {
  const dp = new DOMParser();
  const dom = dp.parseFromString(html, 'text/html');

  return {
    head: dom.head,
    root: dom.querySelector(`#${ID}`) as HTMLElement
  };
};

const restorePage = (serializedDOMString: string): void => {
  const state: SerializedDOM = JSON.parse(serializedDOMString);
  const head = document.createElement('head');
  head.innerHTML = state.head;
  const root = document.createElement('div');
  root.innerHTML = state.root;

  const dom: DOM = { head, root };

  replaceDOM(dom);
};

const getHTML = async (src: string): Promise<DOM> => {
  // if we don't specify { cache: 'no-store' },
  // Chrome caches responses and doesn't send request (on my environment).
  const res = await fetch(src, { cache: 'no-store' });
  const html = await res.text();

  return createDOMFrom(html);
};

const replaceHead = (newDOM: DOM): void => {
  document.head.replaceWith(newDOM.head);
};

const replaceRoot = (newDOM: DOM): void => {
  const root = document.querySelector(`#${ID}`) as HTMLElement;
  // if we use `replaceWith()` to the observed element,
  // it doesn't fire mutation event.
  root.innerHTML = '';
  root.appendChild(newDOM.root);
};

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

const hasHREF = (a: HTMLAnchorElement) => a.href !== '';
const withoutHash = (a: HTMLAnchorElement) => new URL(a.href).hash === '';
const isSameOriginWith = (currentURL: URL) => (a: HTMLAnchorElement) =>
  new URL(a.href).origin === currentURL.origin;

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

const onPopstate = (ev: PopStateEvent): void => {
  restorePage(ev.state);
};

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

const observe = (root: Element): void => {
  const mo = new MutationObserver(onMutation);
  mo.observe(root, { childList: true });
};

const main = () => {
  saveCurrentState();
  const root = document.querySelector(`#${ID}`)!;
  observe(root);
  setup(root);
  window.addEventListener('popstate', onPopstate);
};

main();
