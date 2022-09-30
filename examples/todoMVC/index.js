const { Htmxx } = require('../../lib/index');
const htmxx = new Htmxx(process.cwd() + '/routes');
htmxx.startServer();
