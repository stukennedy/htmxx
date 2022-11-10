export default (id: string, retweets: number) => {
  return /*html*/ `
  <button
    class="btn btn-link ps-0 text-decoration-none"
    id="retweet-${id}"
    type="button"
    hx-post="/retweet/${id}"
  >
    Retweet (${retweets})
  </button>
`;
};
