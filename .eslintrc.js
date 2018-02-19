module.exports = {
  "extends": [
    "standard",
    "plugin:ava/recommended"
  ],
  "parserOptions": {
    // "ecmaVersion": 2016, // for node v6.11.1
    "ecmaVersion": 2017,
  },
  "env": {
    "es6": true,
    "node": true
  },
  "plugins": [
    "ava"
  ],
  "rules": {
    // js
    "comma-dangle": ["error", "always-multiline"],
    "brace-style": ["error", "stroustrup"],
    "quotes": "off",

    // ava
    "ava/prefer-async-await": [0]
  }
};
