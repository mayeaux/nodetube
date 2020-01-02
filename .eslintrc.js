module.exports = {
  "env": {
      "browser": true,
      "commonjs": true,
      "node": true,
      "mocha": true,
      "jquery": true
  },
  "extends": "eslint:recommended",
  "globals": {
      "Atomics": "readonly",
      "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
      "sourceType": "module",
      "ecmaVersion": 2018
  },
  "rules": {
      "indent": [
          "error",
          2
      ],
      "linebreak-style": [
          "error",
           (process.platform === "win32" ? "windows" : "unix")
      ],
      "quotes": [
          "error",
          "single"
      ],
      "semi": [
          "error",
          "always"
      ],
      "no-multiple-empty-lines": [
          "error", 
          { "max": 1, "maxEOF": 1}
      ],
      "no-useless-escape": 0,
      "no-console": 0,
      "no-unused-vars": 0,
      "no-undef": 0,
      "no-redeclare": 0,
      "no-unreachable": 0
  }
};