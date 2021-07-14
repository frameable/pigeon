const { _clone, _objId } = require('./helpers');

function reverse(changes) {

  const reversed = _clone(changes).reverse();

  for (const change of reversed) {

    if (change.op == 'add') {
      change.op = 'remove';
      const id = _objId(change.value);
      if (id) {
        change._index = change.path.split('/').pop();
        const components = change.path.split(/\//).map(c => decodeURIComponent(c));
        let newPath = [];
        for (let component of components) {
          component = component.replace(/\d+$/, `[${id}]`);
          component = component.replace(/\//, '%2f');

          newPath.push(component);
        }
        change.path = newPath.join('/');
      }

    } else if (change.op == 'remove') {
      change.op = 'add';
    }

    if ('_prev' in change) {
      var _prev = change._prev;
    }

    if ('value' in change) {
      var _value = change.value;
    }

    if (_prev === undefined) {
      delete change.value;
    } else {
      change.value = _prev;
    }

    if (_value === undefined) {
      delete change._prev;
    } else {
      change._prev = _value;
    }

  }

  return reversed;

}

module.exports = reverse;
