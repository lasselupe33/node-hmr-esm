const util = require("util");

// global.setImmediate = jest.useRealTimers;

global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;
