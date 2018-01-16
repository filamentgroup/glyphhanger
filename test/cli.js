const assert = require( "assert" );
const path = require( "path" );
const childProcess = require( "child_process" );

describe( "glyphhanger cli", function() {

	it( "Produced a file", function (done) {
		childProcess.exec('node index.js --whitelist=ABC --subset=test/fonts/sourcesanspro-regular.ttf', function(err) {
      if (err) done(err)
      else done();
		})
	})
});
