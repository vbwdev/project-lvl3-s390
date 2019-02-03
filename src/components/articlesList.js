const getArticleNode = ({ description, link, title }, buttonClickHandler) => {
  const linkElement = document.createElement('a');
  linkElement.target = '_blank';
  linkElement.href = link;
  linkElement.textContent = title;

  const titleElement = document.createElement('h4');
  titleElement.append(linkElement);

  const articleElement = document.createElement('div');
  articleElement.classList.add('list-group-item');

  const buttonElement = document.createElement('button');
  buttonElement.type = 'button';
  buttonElement.classList.add('btn', 'btn-primary', 'js-show-article-modal-button');
  buttonElement.dataset.target = '#articleDescriptionModal';
  buttonElement.dataset.toggle = 'modal';
  buttonElement.textContent = 'More';
  buttonElement.addEventListener('click', () => {
    buttonClickHandler({ description, link, title });
  });

  articleElement.append(titleElement);
  articleElement.append(buttonElement);
  return articleElement;
};

const getArticlesNodes = (articles, buttonClickHandler) => {
  return articles.map(article => getArticleNode(article, buttonClickHandler));
};

export default getArticlesNodes;
