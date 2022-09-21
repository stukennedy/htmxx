exports.script = () => {
  return {
    title: 'HOME',
  };
};

exports.template = /*html*/ `
  <main>
    <h5>{{ title }}</h5>
    {{> my-template}}
    <div>HI</div>
  </main>
`;
