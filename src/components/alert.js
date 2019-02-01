const getAlertHtml = (text, className = '') => `
  <div class="alert alert-danger text-center ${className}" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
    ${text}
  </div>
`;

export default getAlertHtml;
