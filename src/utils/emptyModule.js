// Mock module to satisfy dependencies that check for Node.js built-ins
module.exports = {
  Duplex: function() {},
  Readable: function() {},
  Writable: function() {},
  Transform: function() {},
  PassThrough: function() {},
  Stream: function() {},
};
