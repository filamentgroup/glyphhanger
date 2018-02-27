var assert = require( "assert" );
var path = require( "path" );
var childProcess = require( "child_process" );

describe( "CLI (pseudos)", function() {
	it( "works with pseudo elements", function () {
		this.timeout( 10000 );

		let output = childProcess.execSync(`node cmd.js test/pseudos/test.html --json`, {
			cwd: path.resolve(__dirname, "..")
		});

		let json = JSON.parse(output.toString().trim());
		assert.equal( json["My Icon Font"], "U+E6AC" );
		assert.equal( json["My Second Icon Font"], "U+27" );
	});
});