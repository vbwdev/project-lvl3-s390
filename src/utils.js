// eslint-disable-next-line import/prefer-default-export
export const getNodeFromHtmlString = htmlString =>
  new DOMParser().parseFromString(htmlString, 'text/html').body.firstElementChild;
