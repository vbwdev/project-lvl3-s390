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
    title: article.querySelector('title').textContent,
    link: article.querySelector('link').textContent,
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

const getChannelsListHtml = channels => {
  if (channels.length === 0) {
    return '<li class="list-group-item">No channels added</li>';
  }
  const channelsHtml = channels.map(
    ({ title, description }) => `<li class="list-group-item"><h4>${title}</h4>${description}</li>`,
  );
  return channelsHtml.join('');
};

const getArticlesListHtml = articles => {
  if (articles.length === 0) {
    return '<div class="list-group-item">No articles</div>';
  }
  const articlesHtml = articles.map(
    ({ title, link }) =>
      `<a class="list-group-item list-group-item-action" href="${link}" target="_blank">${title}</a>`,
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
  };

  const rssUrlForm = document.querySelector('.js-rss-url-form');
  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');
  const channelsList = document.querySelector('.js-rss-channels-list');
  const articlesList = document.querySelector('.js-rss-articles-list');

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

    return getRssFeedsData(state.rssUrls)
      .then(mergeChannelsAndArticlesData)
      .then(({ channels, articles }) => {
        state.channels = channels;
        state.articles = articles;
      });
  });

  watch(state.addUrlForm, ['hasUrlError', 'canSubscribe'], () => {
    rssUrlInput.classList.toggle('is-invalid', state.addUrlForm.hasUrlError);
    rssUrlSubmitButton.disabled = !state.addUrlForm.canSubscribe;
  });

  watch(state, ['articles', 'channels'], () => {
    channelsList.innerHTML = getChannelsListHtml(state.channels);
    articlesList.innerHTML = getArticlesListHtml(state.articles);
  });
};
