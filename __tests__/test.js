import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { html } from 'js-beautify';
import keycode from 'keycode';
import nock from 'nock';

import init from '../src/init';

const htmlOptions = {
  indent_size: 2,
  preserve_newlines: false,
};

const getTree = () => html(document.body.innerHTML, htmlOptions);

const pressKey = (key, el = document.body, value = key) => {
  const keyCode = keycode(key);
  const e = new KeyboardEvent('input', { keyCode });
  el.value = value; // eslint-disable-line no-param-reassign
  el.setAttribute('value', value);
  el.dispatchEvent(e);
};

const readFile = promisify(fs.readFile);

const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const proxyHeaders = { 'access-control-allow-origin': '*' };

const articlesListSelector = '.js-rss-articles-list';
const channelsListSelector = '.js-rss-channels-list';
const formAlertsSelector = '.js-form-alerts';
const formSelector = '.js-rss-url-form';
const showArticleModalButtonSelector = '.js-show-article-modal-button';
const articleModalSelector = '#articleDescriptionModal';

describe('rss reader', () => {
  nock.disableNetConnect();
  const rssFeedHexletPart1 = fs.readFileSync(
    `${__dirname}/__fixtures__/rss-feed-hexlet-part-1.txt`,
    'utf8',
  );
  // const rssFeedHexletPart2 = fs.readFileSync(
  //   `${__dirname}/__fixtures__/rss-feed-hexlet-part-2.txt`,
  //   'utf8',
  // );
  const rssFeedLorem = fs.readFileSync(`${__dirname}/__fixtures__/rss-feed-lorem.txt`, 'utf8');
  let rssUrlForm;
  let rssUrlInput;
  let rssUrlSubmitButton;

  beforeEach(async () => {
    const pathToHtml = path.resolve(__dirname, '../template.html');
    document.body.innerHTML = await readFile(pathToHtml, 'utf8');
    init();
    rssUrlInput = document.querySelector('.js-rss-url-input');
    rssUrlSubmitButton = document.querySelector('.js-rss-url-submit-button');
    rssUrlForm = document.querySelector('.js-rss-url-form');
  });

  test('should init without changes', () => {
    expect(getTree()).toMatchSnapshot();
  });

  test('should validate rss url input with wrong url', done => {
    rssUrlInput.focus();
    pressKey('l', rssUrlInput, 'wrong-url');
    setTimeout(() => {
      expect(rssUrlInput.classList.contains('is-invalid')).toBe(true);
      expect(rssUrlSubmitButton.disabled).toBe(true);
      done();
    }, 0);
  });

  test('should validate rss url input with good url', done => {
    rssUrlInput.focus();
    pressKey('m', rssUrlInput, 'https://good-url.com');
    setTimeout(() => {
      expect(rssUrlInput.classList.contains('is-invalid')).toBe(false);
      expect(rssUrlSubmitButton.disabled).toBe(false);
      done();
    }, 0);
  });

  test('should remove error class from empty input', done => {
    rssUrlInput.focus();
    pressKey('t', rssUrlInput);
    pressKey('Backspace', rssUrlInput, '');
    setTimeout(() => {
      expect(rssUrlInput.classList.contains('is-invalid')).toBe(false);
      expect(rssUrlSubmitButton.disabled).toBe(true);
      done();
    }, 0);
  });

  test('should clear input and disable button after form submitting', done => {
    const url = 'test.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart1);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(rssUrlInput.value).toBe('');
      expect(rssUrlSubmitButton.disabled).toBe(true);
      done();
    }, 100);
  });

  test('should not add duplicated url', async done => {
    const url = 'https://test.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart1);
    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    await (() => {
      return new Promise(resolve =>
        setTimeout(() => {
          pressKey('m', rssUrlInput, url);
          rssUrlForm.dispatchEvent(new Event('submit'));
          resolve();
        }, 100),
      );
    })().then(() => {
      setTimeout(() => {
        expect(rssUrlInput.classList.contains('is-invalid')).toBe(true);
        expect(rssUrlSubmitButton.disabled).toBe(true);
        done();
      }, 200);
    });
  });

  test('should show loading state when fetching', done => {
    const url = 'https://test.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .delay(1000)
      .reply(500);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(html(document.querySelector(formSelector).innerHTML, htmlOptions)).toMatchSnapshot();
      done();
    }, 100);
  });

  test('should show error if loading failed', done => {
    const url = 'https://test.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(500);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(
        html(document.querySelector(formAlertsSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      done();
    }, 100);
  });

  test('should render channels and articles list', done => {
    const url = 'https://good-url.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart1);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(
        html(document.querySelector(channelsListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      expect(
        html(document.querySelector(articlesListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      done();
    }, 100);
  });

  test('should render new channels and articles list', async done => {
    const url = 'https://good-url.com';
    const url2 = 'https://other-good-url.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .twice()
      .reply(200, rssFeedHexletPart1)
      .get(`/${url2}`)
      .reply(200, rssFeedLorem);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    await (() => {
      return new Promise(resolve =>
        setTimeout(() => {
          pressKey('m', rssUrlInput, url2);
          rssUrlForm.dispatchEvent(new Event('submit'));
          resolve();
        }, 100),
      );
    })().then(() => {
      setTimeout(() => {
        expect(
          html(document.querySelector(channelsListSelector).innerHTML, htmlOptions),
        ).toMatchSnapshot();
        expect(
          html(document.querySelector(articlesListSelector).innerHTML, htmlOptions),
        ).toMatchSnapshot();
        done();
      }, 100);
    });
  });

  test('should show popup with description', done => {
    const url = 'https://good-url.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart1);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      document.querySelector(showArticleModalButtonSelector).click();
    }, 100);
    setTimeout(() => {
      expect(
        html(document.querySelector(articleModalSelector).outerHTML, htmlOptions),
      ).toMatchSnapshot();
      done();
    }, 1000);
  });
});
