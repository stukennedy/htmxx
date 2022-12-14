import Chance from 'chance';

export default () => {
  const chance = new Chance();
  const name = chance.name();

  return /*html*/ `
    <nav class="navbar navbar-dark bg-dark shadow-sm py-0">
      <div class="container">
        <a class="navbar-brand" href="#">htmx-twitter</a
        ><span class="navbar-text text-white">${name}</span>
      </div>
    </nav>
    <div class="container">
      <div class="row justify-content-center">
        <main class="col-10">
          <p class="text-center mt-2">
            A Twitter clone in <a href="https://htmx.org">htmx</a> and Node
          </p>
          <div hx-ws="connect:/tweet">
            <form hx-ws="send:submit">
              <input
                class="form-control"
                type="hidden"
                name="username"
                value="${name}"
                readonly
              />
              <div class="mb-3 row">
                <label for="txtMessage">Message:</label>
                <textarea
                  class="form-control"
                  id="txtMessage"
                  rows="3"
                  name="message"
                  required="true"
                ></textarea>
              </div>
              <div class="d-grid gap-2 col-3 mx-auto mb-3">
                <button class="btn btn-primary text-center" type="submit">
                  Tweet
                </button>
              </div>
            </form>
          </div>
          <div id="timeline"></div>
        </main>
      </div>
    </div>
  `;
};
