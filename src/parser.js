const parseRssFeed = data => {
  const rssDom = new DOMParser().parseFromString(data, 'application/xml');
  const articlesNodes = rssDom.querySelectorAll('item');
  const articles = [...articlesNodes].reduce((acc, article) => {
    const link = article.querySelector('link').textContent;
    return {
      ...acc,
      [link]: {
        description: article.querySelector('description').textContent,
        title: article.querySelector('title').textContent,
        link,
      },
    };
  }, {});
  return {
    title: rssDom.querySelector('channel > title').textContent,
    description: rssDom.querySelector('channel > description').textContent,
    link: rssDom.querySelector('channel > link').textContent,
    articles,
  };
};

export default parseRssFeed;
