import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';

const { watch } = WatchJS;

// import Example from './Example';

const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
const getWithProxy = url => axios.get(`${corsProxyUrl}${url}`);

const parseResponseToDom = ({ data }) => new DOMParser().parseFromString(data, 'application/xml');

const getChannelAndArticles = rssDom => {
  const channel = {
    title: rssDom.querySelector('title').textContent,
    description: rssDom.querySelector('description').textContent,
  };
  const articlesNodes = rssDom.querySelectorAll('item');
  const articles = [...articlesNodes].map(article => ({
    description: article.querySelector('description').textContent,
    link: article.querySelector('link').textContent,
    title: article.querySelector('title').textContent,
  }));
  return {
    channel,
    articles,
  };
};

const getChannelAndArticlesData = url =>
  getWithProxy(url)
    .then(parseResponseToDom)
    .then(getChannelAndArticles);

const getRssFeedsData = urls => Promise.all(urls.map(getChannelAndArticlesData));

const mergeChannelsAndArticlesData = channelsAndArticles =>
  channelsAndArticles.reduce(
    (acc, channelAndArticles) => ({
      channels: [...acc.channels, channelAndArticles.channel],
      articles: [...acc.articles, ...channelAndArticles.articles],
    }),
    {
      channels: [],
      articles: [],
    },
  );

const getSpinnerHtml = () => `
  <div class="d-flex justify-content-center">
    <div class="spinner-border text-primary">
      <span class="sr-only">Loading...</span>
    </div>
  </div>
`;

const getChannelsListHtml = (channels, isLoading) => {
  if (isLoading) {
    return getSpinnerHtml();
  }
  if (channels.length === 0) {
    return '<li class="list-group-item">No channels added</li>';
  }
  const channelsHtml = channels.map(
    ({ title, description }) => `<li class="list-group-item"><h4>${title}</h4>${description}</li>`,
  );
  return channelsHtml.join('');
};

const getArticlesListHtml = (articles, isLoading) => {
  if (isLoading) {
    return getSpinnerHtml();
  }
  if (articles.length === 0) {
    return '<div class="list-group-item">No articles</div>';
  }
  const articlesHtml = articles.map(
    ({ description, link, title }) => `
      <div class="list-group-item">
        <h4><a class="" href="${link}" target="_blank">${title}</a></h4>
        <button
          class="js-show-article-modal-button btn btn-primary"
          data-description="${description}"
          data-link="${link}"
          data-target="#articleDescriptionModal"
          data-title="${title}"
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

export default () => {
  const state = {
    addUrlForm: {
      hasUrlError: false,
      canSubscribe: false,
    },
    rssUrls: [],
    channels: [],
    articles: [],
    isLoading: false,
    hasLoadingError: false,
    articleDescriptionModal: {
      description: null,
      link: null,
      title: null,
    },
  };

  const rssUrlForm = document.querySelector('.js-rss-url-form');
  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');
  const channelsList = document.querySelector('.js-rss-channels-list');
  const articlesList = document.querySelector('.js-rss-articles-list');
  const alertPopup = document.querySelector('.js-alert-popup');
  const articleDescriptionModal = document.querySelector('#articleDescriptionModal');

  rssUrlInput.addEventListener('input', e => {
    const { value: url } = e.target;
    if (url === '') {
      state.addUrlForm.hasUrlError = false;
      state.addUrlForm.canSubscribe = false;
    } else if (!isUrl(url) || state.rssUrls.includes(url)) {
      state.addUrlForm.hasUrlError = true;
      state.addUrlForm.canSubscribe = false;
    } else {
      state.addUrlForm.hasUrlError = false;
      state.addUrlForm.canSubscribe = true;
    }
  });

  rssUrlForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!state.addUrlForm.canSubscribe) {
      return false;
    }

    state.rssUrls = [...state.rssUrls, rssUrlInput.value];
    rssUrlInput.value = ''; // TODO Rework with state?
    rssUrlSubmitButton.disabled = true; // TODO Rework with state?

    state.isLoading = true;
    state.hasLoadingError = false;
    return getRssFeedsData(state.rssUrls)
      .then(mergeChannelsAndArticlesData)
      .then(({ channels, articles }) => {
        state.channels = channels;
        state.articles = articles;
        state.isLoading = false;
      })
      .catch(() => {
        console.log('Catch error');
        state.hasLoadingError = true;
        state.isLoading = false;
      });
  });

  document.addEventListener('click', ({ target }) => {
    if (target.classList.contains('js-show-article-modal-button')) {
      const { description, link, title } = target.dataset;
      state.articleDescriptionModal = {
        description,
        link,
        title,
      };
    }
  });

  watch(state.addUrlForm, ['hasUrlError', 'canSubscribe'], () => {
    rssUrlInput.classList.toggle('is-invalid', state.addUrlForm.hasUrlError);
    rssUrlSubmitButton.disabled = !state.addUrlForm.canSubscribe;
  });

  watch(state, ['articles', 'channels', 'isLoading'], () => {
    channelsList.innerHTML = getChannelsListHtml(state.channels, state.isLoading);
    articlesList.innerHTML = getArticlesListHtml(state.articles, state.isLoading);
  });

  watch(state, 'hasLoadingError', () => {
    alertPopup.classList.toggle('show');
  });

  watch(state, 'articleDescriptionModal', () => {
    const { description, link, title } = state.articleDescriptionModal;
    articleDescriptionModal.querySelector('.js-modal-description').textContent = description;
    articleDescriptionModal.querySelector('.js-modal-link').href = link;
    articleDescriptionModal.querySelector('.js-modal-title').textContent = title;
  });
};
