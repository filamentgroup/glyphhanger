const assert = require( "assert" );
const path = require("path");
const connect = require("connect");
const serveStatic = require("serve-static");
const GlyphHanger = require( "../src/GlyphHanger.js" );

const SITE_PATH = path.resolve(__dirname);

describe( "Integration test", function() {

	it( "should have 3 distinct glyphs", function( done ) {
		this.timeout( 30000 );

		var gh = new GlyphHanger();
		let server = connect().use(serveStatic(SITE_PATH)).listen(8080, function() {
			gh.fetchUrls(["http://localhost:8080/test.html"]).then(function(result) {
				assert.equal( gh.getUniversalSet().toString(), "abc" );

				server.close();
				done();
			});
		});
	});

	it( "should have work with text-transform: uppercase", function( done ) {
		this.timeout( 30000 );

		var gh = new GlyphHanger();
		let server = connect().use(serveStatic(SITE_PATH)).listen(8080, function() {
			gh.fetchUrls(["http://localhost:8080/uppercase.html"]).then(function(result) {
				// abc ^word => abcWORD => DORWabc
				assert.equal( gh.getUniversalSet().toString(), "DORWabc" );

				server.close();
				done();
			});
		});
	});

	it( "should have work with text-transform: capitalize", function( done ) {
		this.timeout( 30000 );

		var gh = new GlyphHanger();
		let server = connect().use(serveStatic(SITE_PATH)).listen(8080, function() {
			gh.fetchUrls(["http://localhost:8080/capitalize.html"]).then(function(result) {
				// abc ^word => abcWORDword => DORWabcdorw
				assert.equal( gh.getUniversalSet().toString(), "DORWabcdorw" );

				server.close();
				done();
			});
		});
	});

	it( "should have work with onload and DOMContentLoaded content", function( done ) {
		this.timeout( 30000 );

		var gh = new GlyphHanger();
		let server = connect().use(serveStatic(SITE_PATH)).listen(8080, function() {
			gh.fetchUrls(["http://localhost:8080/test-onload-content.html"]).then(function(result) {
				// abc ^word => abcWORDword => DORWabcdorw
				assert.equal( gh.getUniversalSet().toString(), "abcdefghi" );

				server.close();
				done();
			});
		});
	});
});
