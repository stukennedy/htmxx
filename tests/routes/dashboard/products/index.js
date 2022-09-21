exports.script = () => {
  let id = 'bob';
  let likes = 5;
};

exports.template = /*html*/ `
<button
  id="like-{id}"
  hx-post="/like/{id}"
  type="button"
  class="btn btn-link text-decoration-none"
>
  Like ({likes})
</button>
`;
