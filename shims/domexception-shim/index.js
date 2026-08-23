// Modern, native shim for deprecated domexception and node-domexception packages.
// Since modern environments (Node 18+ and browsers) have a native globalThis.DOMException,
// we safely export this directly, avoiding standard deprecation warnings during npm install.

module.exports = globalThis.DOMException || class DOMException extends Error {
  constructor(message, name) {
    super(message);
    this.name = name || "DOMException";
  }
};
