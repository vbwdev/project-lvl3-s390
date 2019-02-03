import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import axios from 'axios';
import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';
import { isEmpty } from 'lodash';

import getAlertHtml from './components/alert';
import getArticlesNodes from './components/articlesList';
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
    rssUrls: [],
    articles: {},
    channels: [],
    articleDescriptionModal: {
      description: null,
      link: null,
      title: null,
    },
    isBackgroundRssFeedsUpdating: false,
  };

  const setUrlFormState = (stateName, values) => {
    Object.assign(state, { addUrlForm: getUrlFormState(stateName, state, values) });
  };

  const addRssFeed = url =>
    getWithProxy(url)
      .then(({ data }) => parseRssFeed(data))
      .then(({ articles, channel }) => {
        state.rssUrls = [...state.rssUrls, url];
        state.articles = {
          ...state.articles,
          ...articles,
        };
        state.channels = [...state.channels, channel];
      });

  const updateRssFeedArticles = url =>
    getWithProxy(url)
      .then(({ data }) => parseRssFeed(data))
      .then(({ articles }) => {
        state.articles = {
          ...articles,
          ...state.articles,
        };
      });

  const updateRssFeedsArticles = () => {
    if (isEmpty(state.rssUrls)) {
      return Promise.resolve();
    }

    const promises = state.rssUrls.map(updateRssFeedArticles);
    return Promise.all(promises);
  };

  const getChannelsList = () => state.channels;

  const getArticlesList = () => Object.values(state.articles);

  const isDuplicatedUrl = url => state.rssUrls.includes(url);

  const initBackgroundRssFeedsUpdating = () => {
    setTimeout(() => {
      updateRssFeedsArticles().finally(initBackgroundRssFeedsUpdating);
    }, 5000);
  };

  const updateModalContent = ({ description, link, title }) => {
    state.articleDescriptionModal = {
      description,
      link,
      title,
    };
  };

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
        if (!state.isBackgroundRssFeedsUpdating) {
          initBackgroundRssFeedsUpdating();
          state.isBackgroundRssFeedsUpdating = true;
        }
      })
      .catch(error => {
        setUrlFormState('fetching-error', { error });
      });
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

  watch(state, 'channels', () => {
    const channels = getChannelsList();
    channelsList.innerHTML = getChannelsListHtml(channels);
  });

  watch(state, 'articles', () => {
    const articles = getArticlesList();
    const articlesNodes = getArticlesNodes(articles, updateModalContent);
    articlesList.innerHTML = '';
    articlesList.append(...articlesNodes);
  });

  watch(state, 'articleDescriptionModal', () => {
    const { description, link, title } = state.articleDescriptionModal;
    articleDescriptionModal.querySelector('.js-modal-description').textContent = description;
    articleDescriptionModal.querySelector('.js-modal-link').href = link;
    articleDescriptionModal.querySelector('.js-modal-title').textContent = title;
  });
};
