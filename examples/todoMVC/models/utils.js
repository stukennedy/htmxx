exports.filterTodos = (filter, todos) => {
  switch (filter) {
    case 'all':
      return todos;
    case 'active':
      return todos.filter((t) => !t.done);
    case 'completed':
      return todos.filter((t) => t.done);
    default:
      return todos;
  }
};
