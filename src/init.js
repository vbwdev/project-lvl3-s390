import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from 'axios';
import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';

import getArticlesListHtml from './components/articlesList';
import getChannelsListHtml from './components/channelsList';

const { watch } = WatchJS;

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

const getChannelsAndArticlesData = urls => getRssFeedsData(urls).then(mergeChannelsAndArticlesData);

const getUrlFormState = (stateName, oldState, inputValue) => {
  switch (stateName) {
    case 'validation-error':
      return {
        canSubscribe: false,
        hasUrlError: true,
        isFetching: false,
        urlInputValue: inputValue,
      };
    case 'fetching':
      return {
        canSubscribe: false,
        hasUrlError: false,
        isFetching: true,
        urlInputValue: oldState.urlInputValue,
      };
    case 'validation-no-error':
      return {
        canSubscribe: true,
        hasUrlError: false,
        isFetching: false,
        urlInputValue: inputValue || oldState.urlInputValue,
      };
    case 'empty':
      return {
        canSubscribe: false,
        hasUrlError: false,
        isFetching: false,
        urlInputValue: '',
      };
    default:
      console.error(`Unknown state name "${stateName}"`);
      return oldState;
  }
};

export default () => {
  const state = {
    addUrlForm: {
      ...getUrlFormState('empty'),
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
      state.addUrlForm = getUrlFormState('empty', state.addUrlForm, url);
    } else if (!isUrl(url) || state.rssUrls.includes(url)) {
      state.addUrlForm = getUrlFormState('validation-error', state.addUrlForm, url);
    } else {
      state.addUrlForm = getUrlFormState('validation-no-error', state.addUrlForm, url);
    }
  });

  rssUrlForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!state.addUrlForm.canSubscribe) {
      return false;
    }

    state.rssUrls = [...state.rssUrls, rssUrlInput.value];

    state.addUrlForm = getUrlFormState('fetching', state.addUrlForm);
    state.isLoading = true;
    state.hasLoadingError = false;

    return getChannelsAndArticlesData(state.rssUrls)
      .then(({ channels, articles }) => {
        state.addUrlForm = getUrlFormState('empty');
        state.channels = channels;
        state.articles = articles;
        state.isLoading = false;
      })
      .catch(error => {
        console.error(error);
        state.addUrlForm = getUrlFormState('validation-no-error', state.addUrlForm);
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

  watch(state, 'addUrlForm', () => {
    const { canSubscribe, hasUrlError, isFetching, urlInputValue } = state.addUrlForm;
    rssUrlInput.value = urlInputValue;
    rssUrlInput.classList.toggle('is-invalid', hasUrlError);
    rssUrlSubmitButton.disabled = !canSubscribe;
    rssUrlSubmitButton.innerHTML = isFetching
      ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
      : 'Submit';
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
