var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );
var fs = require( "fs" );

var fontPath = "test/fonts/sourcesanspro-regular.ttf"

var removeFile = function( filePath ) {
	fs.unlinkSync( filePath );
}

describe( "glyphhanger cli", function() {
	it( "Produced a file", function ( done ) {
		childProcess.exec(`node index.js --whitelist=ABC --subset=${fontPath} --formats=ttf`, function(err) {
      if ( err ) {
				done( err );
			} else {
				var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" )
				var subset = fs.existsSync( subsetPath );
				assert.ok( subset );
				removeFile( subsetPath );
				done();
			};
		})
	})
});
