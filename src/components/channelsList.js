import getSpinnerHtml from './spinner';

const getChannelsListHtml = (channels, isLoading) => {
  if (isLoading) {
    return getSpinnerHtml();
  }
  if (channels.length === 0) {
    return '<li class="list-group-item">No channels added</li>';
  }
  const channelsHtml = channels.map(
    ({ title, description }) => `<li class="list-group-item"><h4>${title}</h4>${description}</li>`,
  );
  return channelsHtml.join('');
};

export default getChannelsListHtml;
