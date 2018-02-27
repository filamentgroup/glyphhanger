var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );
var fs = require( "fs" );

describe( "CLI (version, help)", function() {
	it( "outputs version", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --version`, {
			cwd: path.resolve(__dirname, "..")
		});

		let pkg = require("../package.json");
		assert.equal( output.toString().trim(), pkg.version );
	});

	it( "outputs help with --help", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --help`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf("usage: glyphhanger") > -1 );
	});

	it( "outputs help (no arguments)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf("usage: glyphhanger") > -1 );
	});
});

describe( "CLI (urls)", function() {
	it( "can use a single url", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/multiple/one.html`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+61-63" );
	});

	it( "can use multiple urls", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js test/multiple/one.html test/multiple/two.html`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+61-66" );
	});

	it( "can use spider", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js test/urls/root.html --spider`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+41-47" );
	});

	it( "can use spider with limit", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js test/urls/root.html --spider-limit=2`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+41-44" );
	});

	it( "works with emoji (on a local html file)", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/test-emoji.html`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.deepEqual( output.toString().trim(), "U+31-34,U+41-44,U+1F4A9");
	});

	it( "works with emoji (on a local txt file)", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/test-emoji.txt`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.deepEqual( output.toString().trim(), "U+31-34,U+41-44,U+1F4A9");
	});

	it( "outputs json per font-family (with --json)", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/json/families.html --json`, {
			cwd: path.resolve(__dirname, "..")
		});

		let json = JSON.parse(output.toString().trim());
		assert.deepEqual( json, {
			"*": "U+61-69",
			"Times New Roman": "U+61-63",
			"monospace": "U+64-66",
			"A Web Font": "U+67-69"
		});
	});

	it( "outputs json per font-family (with empty --family)", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/json/families.html --family`, {
			cwd: path.resolve(__dirname, "..")
		});

		let json = JSON.parse(output.toString().trim());
		assert.deepEqual( json, {
			"*": "U+61-69",
			"Times New Roman": "U+61-63",
			"monospace": "U+64-66",
			"A Web Font": "U+67-69"
		});
	});

	it( "outputs results for a single font-family", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/json/families.html --family='A Web Font'`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.deepEqual( output.toString().trim(), "U+67-69" );
	});

	it( "outputs results for two font-families", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/json/families.html --family='A Web Font, monospace'`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.deepEqual( output.toString().trim(), "U+64-69" );
	});
});

describe( "CLI (whitelist)", function() {
	it( "--whitelist without other arguments (outputs range)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist=ABCD`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+41-44" );
	});

	it( "--whitelist --string (outputs string)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist=ABCD --string`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "ABCD" );
	});

	it( "--US_ASCII (outputs code points)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --US_ASCII`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+20-7E" );
	});

	it( "--whitelist --US_ASCII (outputs code points)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist=ABCD --US_ASCII`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+20-7E" );
	});

	it( "--whitelist='Unicode Range' --US_ASCII (outputs code points)", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist="U+09" --US_ASCII`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.equal( output.toString().trim(), "U+9,U+20-7E" );
	});
});

describe( "CLI (css)", function() {
	it( "--css --whitelist='Unicode Range'", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist="U+09" --css`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf(`@font-face {
  unicode-range: U+9;
}`) > - 1);
	});

	it( "--css --whitelist='String'", function () {
		this.timeout( 10000 );
		let output = childProcess.execSync(`node cmd.js --whitelist="abcd" --css`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf(`@font-face {
  unicode-range: U+61-64;
}`) > - 1);
	});

	it( "single url --css", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/multiple/one.html --css`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf(`@font-face {
  unicode-range: U+61-63;
}`) > - 1);
	});

	it( "two font-families --css", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/json/families.html --family='A Web Font, monospace' --css`, {
			cwd: path.resolve(__dirname, "..")
		});

		assert.ok( output.toString().indexOf(`@font-face {
  font-family: A Web Font;
  unicode-range: U+64-69;
}`) > - 1);
	});
});

// 
// TODO glyphhanger --subset=*.ttf																(file format conversion)
// DONE glyphhanger --subset=*.ttf --whitelist=ABCD								(reduce to whitelist characters)
// TODO glyphhanger --subset=*.ttf --US_ASCII											(reduce to US_ASCII characters)
// TODO glyphhanger --subset=*.ttf --US_ASCII --whitelist=ABCD		(reduce to US_ASCII union with whitelist)

describe( "CLI (subset)", function() {
	it( "Produced a file", function () {
		// due to some unknown permission issue, this test fails on travis
		if(process.env.TRAVIS) {
			this.skip();
		}

		this.timeout( 10000 );

		var fontPath = "test/fonts/sourcesanspro-regular.ttf";
		// console.log( "__dirname:", __dirname );

		let output = childProcess.execSync(`node cmd.js --whitelist=ABC --subset=${fontPath} --formats=ttf`, {
			cwd: path.resolve(__dirname, "..")
		});

		// console.log( "childProcess output: ", output.toString() );

		var subsetPath = fontPath.split( ".ttf" ).join( "-subset.ttf" );
		// console.log("old fontPath: ", fontPath, " new fontpath: ", subsetPath);

		var subset = fs.existsSync( subsetPath );
		assert.ok( subset );
		fs.unlinkSync( subsetPath );
	});
});
