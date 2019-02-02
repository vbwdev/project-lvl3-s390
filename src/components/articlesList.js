import getSpinnerHtml from './spinner';

const getArticlesListHtml = (articles, isLoading) => {
  if (isLoading) {
    return getSpinnerHtml();
  }
  if (articles.length === 0) {
    return '<div class="list-group-item">No articles</div>';
  }
  const articlesHtml = articles.map(
    ({ link, title }) => `
      <div class="list-group-item">
        <h4><a class="" href="${link}" target="_blank">${title}</a></h4>
        <button
          class="js-show-article-modal-button btn btn-primary"
          data-link="${link}"
          data-target="#articleDescriptionModal"
          data-toggle="modal"
          type="button"
        >
          More
        </button>
      </div>
    `,
  );
  return articlesHtml.join('');
};

export default getArticlesListHtml;
