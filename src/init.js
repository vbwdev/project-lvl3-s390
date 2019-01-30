import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';

const { watch } = WatchJS;

// import Example from './Example';

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

    const rssUrls = state.rssUrls.map(rssUrl => {
      return axios.get(`https://cors-anywhere.herokuapp.com/${rssUrl}`);
    });

    return Promise.all(rssUrls)
      .then(channelsRowData => {
        return channelsRowData.map(({ data: channelRowData }) =>
          new DOMParser().parseFromString(channelRowData, 'application/xml'),
        );
      })
      .then(channels => {
        const channelsData = [];
        const itemsData = [];
        channels.forEach(channel => {
          const channelTitle = channel.querySelector('title').textContent;
          const channelDescription = channel.querySelector('description').textContent;
          channelsData.push({
            title: channelTitle,
            description: channelDescription,
          });

          const items = channel.querySelectorAll('item');
          items.forEach(item => {
            const itemTitle = item.querySelector('title').textContent;
            const itemLink = item.querySelector('link').textContent;
            itemsData.push({
              title: itemTitle,
              link: itemLink,
            });
          });
        });
        state.channels = channelsData;
        state.articles = itemsData;
      });
  });

  watch(state.addUrlForm, ['hasUrlError', 'canSubscribe'], () => {
    rssUrlInput.classList.toggle('is-invalid', state.addUrlForm.hasUrlError);
    rssUrlSubmitButton.disabled = !state.addUrlForm.canSubscribe;
  });

  watch(state, 'channels', () => {
    if (state.channels.length === 0) {
      const el = document.createElement('li');
      el.classList.add('list-group-item');
      el.textContent = 'No channels';
      channelsList.innerHTML = el;
    } else {
      const els = state.channels.map(({ title, description }) => {
        const el = document.createElement('li');
        el.classList.add('list-group-item');
        el.textContent = `${title} --- ${description}`;
        console.log(el);
        return el.outerHTML;
      });
      console.log(els);
      channelsList.innerHTML = els.join('');
    }
    console.log('channels was updated', state.channels);
  });

  watch(state, 'articles', () => {
    if (state.articles.length === 0) {
      const el = document.createElement('div');
      el.classList.add('list-group-item');
      el.textContent = 'No articles';
      articlesList.innerHTML = el;
    } else {
      const els = state.articles.map(({ title, link }) => {
        const el = document.createElement('a');
        el.classList.add('list-group-item');
        el.classList.add('list-group-item-action');
        el.target = '_blank';
        el.href = link;
        el.textContent = title;
        console.log(el);
        return el.outerHTML;
      });
      console.log(els);
      articlesList.innerHTML = els.join('');
    }
    console.log('articles was updated', state.articles);
  });
};
