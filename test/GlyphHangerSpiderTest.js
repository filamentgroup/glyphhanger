const assert = require( "assert" );
const path = require( "path" );
const phantomjs = require( "phantomjs-prebuilt" );
const childProcess = require( "child_process" );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const window = (new JSDOM(`<!doctype html><html><body></body></html>`)).window;
const document = window.document;

const GlyphHangerSpider = require( "../glyphhanger-spider.js" );

describe( "GlyphHangerSpider", function() {
	describe( "Single Link", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a>";

		it( "found one link", function() {
			var gh = new GlyphHangerSpider();
			gh.setEnv( window );
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( urls, [ "firstlink.html" ] );
		});
	});

	describe( "Multiple links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='secondlink.html'>Test</a>";

		it( "found two links", function() {
			var gh = new GlyphHangerSpider();
			gh.setEnv( window );
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( urls, [ "firstlink.html", "secondlink.html" ] );
		});
	});

	describe( "Prune email links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='mailto:localhost@example.com'>Test</a>";

		it( "did not find the email link", function() {
			var gh = new GlyphHangerSpider();
			gh.setEnv( window );
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( urls, [ "firstlink.html" ] );
		});
	});

	describe( "Integration test: find links", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-urls.js" ), path.join( __dirname, "urls.html" ) ];

		it( "should have four links", function( done ) {
			this.timeout( 30000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				var expecting = [
					"file://" + path.join( __dirname, "test.html" ),
					"file://" + path.join( __dirname, "test2.html" ),
					"file://" + path.join( __dirname, "test3.html" ),
					"file://" + path.join( __dirname, "urls.html" )
				];

				assert.equal( stdout.trim(), expecting.join( "\n" ) );
				done();
			});
		})
	});
});
