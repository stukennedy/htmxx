export default (itemsLeft: number) => {
  return /*html*/ `
  <span id="todo-count" class="todo-count" hx-swap-oob="true">
    <strong>${itemsLeft}</strong> item left
  </span>`;
};
