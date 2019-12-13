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

const onPopstate = (ev: PopStateEvent): void => {
  restorePage(ev.state);
};

const observe = (root: Element): void => {
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

const setup = (id: string): void => {
  const button = document.querySelector(`#${id}`)!;

  button.addEventListener('click', async () => {
    const res = await getHTML(`/${id}.html`);
    replaceDOM(res);
    history.pushState(serialize(res), '', `/${id}.html`);
  });
};

const main = () => {
  saveCurrentState();
  const root = document.querySelector(`#${ID}`)!;
  observe(root);

  setup('sample');
  setup('index');

  window.addEventListener('popstate', onPopstate);
};

main();
