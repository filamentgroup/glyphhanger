var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );
var fs = require( "fs" );

// TODO glyphhanger --subset=*.ttf																(file format conversion)
// DONE glyphhanger --subset=*.ttf --whitelist=ABCD								(reduce to whitelist characters)
// TODO glyphhanger --subset=*.ttf --US_ASCII											(reduce to US_ASCII characters)
// TODO glyphhanger --subset=*.ttf --US_ASCII --whitelist=ABCD		(reduce to US_ASCII union with whitelist)

describe( "CLI (subset)", function() {
	it( "--subset --whitelist", function () {
		// due to some unknown permission issue, this test fails on travis
		if(process.env.TRAVIS) {
			this.skip();
		}

		this.timeout( 10000 );

		var fontPath = "test/fonts/sourcesanspro-regular.ttf";

		let output = childProcess.execSync(`node cmd.js --whitelist=ABC --subset=${fontPath} --formats=ttf`, {
			cwd: path.resolve(__dirname, "..")
		});

		var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" );

		assert.ok( fs.existsSync( subsetPath ) );
		fs.unlinkSync( subsetPath );
	});

	it( "--subset --whitelist --css", function () {
		// due to some unknown permission issue, this test fails on travis
		if(process.env.TRAVIS) {
			this.skip();
		}

		this.timeout( 10000 );

		var fontPath = "test/fonts/sourcesanspro-regular.ttf";

		let output = childProcess.execSync(`node cmd.js --whitelist=ABC --subset=${fontPath} --formats=ttf --css`, {
			cwd: path.resolve(__dirname, "..")
		});

		var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" );
		assert.ok( fs.existsSync( subsetPath ) );
		fs.unlinkSync( subsetPath );

		var cssPath = fontPath.split( ".ttf" ).join( ".css" );
		assert.ok( fs.existsSync( cssPath ) );
		fs.unlinkSync( cssPath );
	});
});
