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
  };

  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');

  rssUrlInput.addEventListener('input', (e) => {
    const { value } = e.target;
    const isInputEmpty = value === '';
    const isUrlValid = isUrl(value);
    state.addUrlForm.hasUrlError = !isInputEmpty && !isUrlValid;
    state.addUrlForm.canSubscribe = !isInputEmpty && isUrlValid;
  });

  watch(state.addUrlForm, ['hasUrlError', 'canSubscribe'], () => {
    rssUrlInput.classList.toggle('is-invalid', state.addUrlForm.hasUrlError);
    rssUrlSubmitButton.disabled = !state.addUrlForm.canSubscribe;
  });
};
