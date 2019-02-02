/**
 * 'should update articles by timeout' – is long test and it broke other tests.
 * TODO Rework long test
 */

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

describe('rss reader', () => {
  nock.disableNetConnect();
  const rssFeedHexletPart1 = fs.readFileSync(
    `${__dirname}/__fixtures__/rss-feed-hexlet-part-1.txt`,
    'utf8',
  );
  const rssFeedHexletPart2 = fs.readFileSync(
    `${__dirname}/__fixtures__/rss-feed-hexlet-part-2.txt`,
    'utf8',
  );
  let rssUrlForm;
  let rssUrlInput;

  beforeEach(async () => {
    const pathToHtml = path.resolve(__dirname, '../template.html');
    document.body.innerHTML = await readFile(pathToHtml, 'utf8');
    init();
    rssUrlInput = document.querySelector('.js-rss-url-input');
    rssUrlForm = document.querySelector('.js-rss-url-form');
  });

  test('should update articles by timeout', done => {
    jest.setTimeout(10000);

    const url = 'https://good-url.com';
    nock(proxyUrl)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart1)
      .defaultReplyHeaders(proxyHeaders)
      .get(`/${url}`)
      .reply(200, rssFeedHexletPart2);

    pressKey('m', rssUrlInput, url);
    rssUrlForm.dispatchEvent(new Event('submit'));

    setTimeout(() => {
      expect(
        html(document.querySelector(channelsListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      expect(
        html(document.querySelector(articlesListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
    }, 100);

    setTimeout(() => {
      expect(
        html(document.querySelector(channelsListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      expect(
        html(document.querySelector(articlesListSelector).innerHTML, htmlOptions),
      ).toMatchSnapshot();
      done();
    }, 7000);
  });
});
