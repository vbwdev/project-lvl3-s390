import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from 'axios';
import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';

import getAlertHtml from './components/alert';
import getArticlesListHtml from './components/articlesList';
import getChannelsListHtml from './components/channelsList';
import parseRssFeed from './parser';

const { watch } = WatchJS;

const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
const getWithProxy = url => axios.get(`${corsProxyUrl}${url}`);

const getUrlFormState = (stateName, oldState, { url, error } = {}) => {
  switch (stateName) {
    case 'validation-error':
      return {
        canSubscribe: false,
        formError: null,
        hasUrlError: true,
        isFetching: false,
        urlInputValue: url || oldState.addUrlForm.urlInputValue,
      };
    case 'fetching':
      return {
        canSubscribe: false,
        formError: null,
        hasUrlError: false,
        isFetching: true,
        urlInputValue: url || oldState.addUrlForm.urlInputValue,
      };
    case 'fetching-error':
      return {
        canSubscribe: true,
        formError: error,
        hasUrlError: false,
        isFetching: false,
        urlInputValue: url || oldState.addUrlForm.urlInputValue,
      };
    case 'validation-no-error':
      return {
        canSubscribe: true,
        formError: null,
        hasUrlError: false,
        isFetching: false,
        urlInputValue: url || oldState.addUrlForm.urlInputValue,
      };
    case 'empty':
      return {
        canSubscribe: false,
        formError: null,
        hasUrlError: false,
        isFetching: false,
        urlInputValue: '',
      };
    default:
      console.error(`Unknown state name "${stateName}"`);
      return oldState.addUrlForm;
  }
};

export default () => {
  const state = {
    addUrlForm: {
      ...getUrlFormState('empty'),
    },
    rssFeeds: {},
    articleDescriptionModal: {
      description: null,
      link: null,
      title: null,
    },
  };

  const setUrlFormState = (stateName, values) => {
    Object.assign(state, { addUrlForm: getUrlFormState(stateName, state, values) });
  };

  const addRssFeed = url =>
    getWithProxy(url)
      .then(({ data }) => parseRssFeed(data))
      .then(rssFeed => {
        state.rssFeeds = {
          ...state.rssFeeds,
          [url]: rssFeed,
        };
      });

  const getChannelsList = () => Object.values(state.rssFeeds);

  const getArticlesList = () =>
    Object.values(state.rssFeeds).reduce(
      (acc, { articles }) => [...acc, ...Object.values(articles)],
      [],
    );

  const isDuplicatedUrl = url => Object.keys(state.rssFeeds).includes(url);

  const rssUrlForm = document.querySelector('.js-rss-url-form');
  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');
  const formAlerts = document.querySelector('.js-form-alerts');
  const channelsList = document.querySelector('.js-rss-channels-list');
  const articlesList = document.querySelector('.js-rss-articles-list');
  const articleDescriptionModal = document.querySelector('#articleDescriptionModal');

  rssUrlInput.addEventListener('input', e => {
    if (state.addUrlForm.isFetching) {
      return false;
    }

    const { value: url } = e.target;
    if (url === '') {
      setUrlFormState('empty');
    } else if (!isUrl(url) || isDuplicatedUrl(url)) {
      setUrlFormState('validation-error', { url });
    } else {
      setUrlFormState('validation-no-error', { url });
    }
    return true;
  });

  rssUrlForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!state.addUrlForm.canSubscribe || state.addUrlForm.isFetching) {
      return false;
    }

    setUrlFormState('fetching');
    const rssFeedUrl = rssUrlInput.value;
    return addRssFeed(rssFeedUrl)
      .then(() => {
        setUrlFormState('empty');
      })
      .catch(error => {
        setUrlFormState('fetching-error', { error });
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
    const { canSubscribe, formError, hasUrlError, isFetching, urlInputValue } = state.addUrlForm;
    rssUrlInput.value = urlInputValue;
    rssUrlInput.classList.toggle('is-invalid', hasUrlError);
    rssUrlSubmitButton.disabled = !canSubscribe;
    rssUrlSubmitButton.innerHTML = isFetching
      ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'
      : 'Submit';
    formAlerts.innerHTML = formError ? getAlertHtml(formError) : '';
  });

  watch(state, 'rssFeeds', () => {
    const articles = getArticlesList();
    const channels = getChannelsList();
    channelsList.innerHTML = getChannelsListHtml(channels);
    articlesList.innerHTML = getArticlesListHtml(articles);
  });

  watch(state, 'articleDescriptionModal', () => {
    const { description, link, title } = state.articleDescriptionModal;
    articleDescriptionModal.querySelector('.js-modal-description').textContent = description;
    articleDescriptionModal.querySelector('.js-modal-link').href = link;
    articleDescriptionModal.querySelector('.js-modal-title').textContent = title;
  });
};
