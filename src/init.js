import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import isUrl from 'validator/lib/isURL';
import WatchJS from 'melanke-watchjs';
const watch = WatchJS.watch;

// import Example from './Example';

export default () => {
  const state = {
    addUrlForm: {
      isUrlValid: false,
      canSubmit: false,
    },
  };

  const rssUrlInput = document.querySelector('.js-rss-url-input');
  const rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');

  rssUrlInput.addEventListener('input', function(e) {
    const { value } = e.target;
    const isValid = isUrl(value);
    if (isValid) {
      state.addUrlForm.isUrlValid = true;
      state.canSubmit = true;
    } else {
      state.addUrlForm.isUrlValid = false;
      state.canSubmit = false;
    }
  });

  watch(state.addUrlForm, ['isUrlValid', 'canSubmit'], function() {
    rssUrlInput.classList.toggle('is-invalid', !state.addUrlForm.isUrlValid);
    rssUrlInput.classList.toggle('is-valid', state.addUrlForm.isUrlValid);
    if (state.addUrlForm.canSubmit) {
      rssUrlSubmitButton.disabled = false;
    } else {
      rssUrlSubmitButton.disabled = true;
    }
    console.log(rssUrlSubmitButton.disabled);
  });

};
