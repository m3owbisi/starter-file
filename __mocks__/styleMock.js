// mock for CSS module imports in Jest
// returns an empty object so className lookups don't crash
module.exports = new Proxy(
  {},
  {
    get: function (_target, key) {
      if (key === "__esModule") return false;
      return key;
    },
  }
);
