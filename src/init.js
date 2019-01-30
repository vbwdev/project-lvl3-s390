import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  };

  const rssUrlForm = document.querySelector('.js-rss-url-form');
  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');

  rssUrlInput.addEventListener('input', (e) => {
    const { value: url } = e.target;
    const isInputEmpty = url === '';
    const isUrlValid = isUrl(url);
    const isDuplicateUrl = state.rssUrls.includes(url);
    state.addUrlForm.hasUrlError = !isInputEmpty && !isUrlValid || isDuplicateUrl;
    state.addUrlForm.canSubscribe = !isInputEmpty && isUrlValid && !isDuplicateUrl;
  });

  rssUrlForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!state.addUrlForm.canSubscribe) {
      return false;
    }

    state.rssUrls = [...state.rssUrls, rssUrlInput.value];
    console.log('form was submited');
  });

  rssUrlSubmitButton.addEventListener('click', (e) => {
    console.log('rssUrlSubmitButton was clicked');
  });


  watch(state.addUrlForm, ['hasUrlError', 'canSubscribe'], () => {
    rssUrlInput.classList.toggle('is-invalid', state.addUrlForm.hasUrlError);
    rssUrlSubmitButton.disabled = !state.addUrlForm.canSubscribe;
  });

  watch(state, 'rssUrls', () => {
    rssUrlInput.value = '';
    rssUrlSubmitButton.disabled = true;
    console.log('state.rssUrls was updated');
    console.log(state.rssUrls.length, state.rssUrls);
  });
};
