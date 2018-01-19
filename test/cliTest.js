var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );
var fs = require( "fs" );
var path = require( "path" );

var fontPath = "test/fonts/sourcesanspro-regular.ttf"

describe( "glyphhanger cli", function() {
	it( "Produced a file", function () {
		this.timeout( 10000 );
		console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node index.js --whitelist=ABC --subset=${fontPath} --formats=ttf`, {
			cwd: path.resolve(__dirname, "..")
		});
		console.log( "childProcess output: ", output.toString() );

		var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" );
		var subset = fs.existsSync( subsetPath );
		assert.ok( subset );
		fs.unlinkSync( subsetPath );
	})
});
