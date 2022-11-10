export default (id: string, likes: number) => {
  return /*html*/ `
    <button
      class="btn btn-link text-decoration-none"
      id="like-${id}"
      type="button"
      hx-post="/like/${id}"
    >
      Like (${likes})
    </button>
  `;
};
