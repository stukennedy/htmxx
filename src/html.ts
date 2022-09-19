import escape from 'escape-html';

function iterateObject(obj: any) {
  for (let prop in obj) {
    if (typeof obj[prop] == 'object') {
      iterateObject(obj[prop]);
    } else if (typeof obj[prop] == 'string') {
      obj[prop] = escape(obj[prop]);
    } else if (obj[prop].length) {
      iterateObject(obj[prop]);
    }
  }
}

export default (f: (a: any) => string) => (a: object) => {
  iterateObject(a);
  return f(a);
};
