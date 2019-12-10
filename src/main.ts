type FetchedDOM = {
  head: HTMLHeadElement;
};

const getHTML = async (src: string): Promise<FetchedDOM> => {
  const res = await fetch(src);
  const html = await res.text();
  const domParser = new DOMParser();
  const fetchedDOM = domParser.parseFromString(html, 'text/html');

  return {
    head: fetchedDOM.head
  };
};

const replaceHead = (newDOM: FetchedDOM): void => {
  document.head.replaceWith(newDOM.head);
};

const main = () => {
  const button = document.querySelector('#sample')!;
  button.addEventListener('click', async () => {
    const res = await getHTML('/sample.html');
    replaceHead(res);
  });
};

main();
