var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );
var fs = require( "fs" );
var path = require( "path" );

// glyphhanger http://localhost/ http://localhost2/					(multiple urls are welcome)
// glyphhanger http://localhost/ --spider 									(limit default 10)
// glyphhanger http://localhost/ --spider-limit							(limit default 10)
// glyphhanger http://localhost/ --spider-limit=0 					(no limit)
// glyphhanger http://localhost/ --spider-limit=1						(limit 1)
// glyphhanger --whitelist=ABCD															(convert characters to unicode range)
// glyphhanger --US_ASCII																		(convert characters to unicode range)
// glyphhanger --US_ASCII --whitelist=ABCD									(convert characters to unicode range)
// glyphhanger --subset=*.ttf																(file format conversion)
// glyphhanger --subset=*.ttf --whitelist=ABCD							(reduce to whitelist characters)
// glyphhanger --subset=*.ttf --US_ASCII										(reduce to US_ASCII characters)
// glyphhanger --subset=*.ttf --US_ASCII --whitelist=ABCD		(reduce to US_ASCII union with whitelist)

describe( "glyphhanger cli", function() {
	it( "outputs version", function () {
		this.timeout( 10000 );
		// console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node cmd.js --version`, {
			cwd: path.resolve(__dirname, "..")
		});

		let pkg = require("../package.json");
		assert.equal( output.toString().trim(), pkg.version );
	});

	it( "outputs help with --help", function () {
		this.timeout( 10000 );
		// console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node cmd.js --help`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf("usage: glyphhanger") > -1 );
	});

	it( "outputs help (no arguments)", function () {
		this.timeout( 10000 );
		// console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node cmd.js`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf("usage: glyphhanger") > -1 );
	});

	it( "can use a single url", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/multiple/one.html`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+61-63" );
	});

	it( "can use multiple urls", function () {
		this.timeout( 10000 );
		// console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node cmd.js test/multiple/one.html test/multiple/two.html`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+61-66" );
	});

	it( "Produced a file", function () {
		this.timeout( 10000 );

		var fontPath = "test/fonts/sourcesanspro-regular.ttf";
		// console.log( "__dirname:", __dirname );
		let output = childProcess.execSync(`node cmd.js --whitelist=ABC --subset=${fontPath} --formats=ttf`, {
			cwd: path.resolve(__dirname, "..")
		});
		// console.log( "childProcess output: ", output.toString() );

		var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" );
		var subset = fs.existsSync( subsetPath );
		assert.ok( subset );
		fs.unlinkSync( subsetPath );
	});
});
