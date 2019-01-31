// @flow

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { html } from 'js-beautify';
import keycode from 'keycode';
import nock from 'nock';

import init from '../src/init';

nock.disableNetConnect();

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

describe('rss reader', () => {
  let rssUrlForm;
  let rssUrlInput;
  let rssUrlSubmitButton;

  beforeEach(async () => {
    const pathToHtml = path.resolve(__dirname, '__fixtures__/index.html');
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

  xtest('should clear input and disable button after form submitting', () => {
    nock('test.com')
      .get()
      .reply(200);
    pressKey('m', rssUrlInput, 'test.com');
    rssUrlForm.dispatchEvent(new Event('submit'));
    expect(rssUrlInput.value).toBe('');
    expect(rssUrlSubmitButton.disabled).toBe(true);
  });

  xtest('should not add duplicated url', done => {
    nock('test.com')
      .get()
      .reply(200);
    pressKey('m', rssUrlInput, 'test.com');
    rssUrlForm.dispatchEvent(new Event('submit'));

    pressKey('m', rssUrlInput, 'test.com');
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(rssUrlInput.classList.contains('is-invalid')).toBe(true);
      expect(rssUrlSubmitButton.disabled).toBe(true);
      done();
    }, 0);
  });

  test('should render channels list', done => {
    const rssUrl = 'https://cors-anywhere.herokuapp.com/http://localhost';
    nock(rssUrl)
      .get('/feed')
      .reply(200, 'lol');
    pressKey('m', rssUrlInput, 'http://localhost/feed');
    rssUrlForm.dispatchEvent(new Event('submit'));
    setTimeout(() => {
      console.log(getTree());
      done();
    }, 1000);
  });
});
