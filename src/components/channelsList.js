const getChannelsListHtml = channels => {
  const channelsHtml = channels.map(
    ({ title, description }) => `<li class="list-group-item"><h4>${title}</h4>${description}</li>`,
  );
  return channelsHtml.join('');
};

export default getChannelsListHtml;
