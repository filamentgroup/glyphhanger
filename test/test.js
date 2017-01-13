require( "jsdom-global" )();

var assert = require( "assert" );
var GlyphHanger = require( "../glyphhanger.js" );
var GlyphHangerSpider = require( "../glyphhanger-spider.js" );
var path = require( "path" );
var phantomjs = require( "phantomjs-prebuilt" );
var childProcess = require( "child_process" );

describe( "glyphhanger", function() {
	describe( "Simple node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "abc";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "abc", gh.toString() );
		});
	});

	describe( "Node with children", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div>";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "bcd", gh.toString() );
		});
	});

	describe( "More complex node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div><div><span>e</span>fg</div>0123456789";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "0123456789bcdefg", gh.toString() );
		});
	});

	describe( "Whitelist", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "bcd";

		var gh = new GlyphHanger();
		gh.saveGlyphs( "efgh")
		gh.init( div );

		it( "should match", function() {
			assert.equal( "bcdefgh", gh.toString() );
		});
	});

	describe( "Surrogate Pair", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "has a surrogate pair", function() {
			assert.equal( "\\uD83D\\uDE0E", gh.toString() );
		});
	});

	describe( "Multiple Surrogate Pairs", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎💩";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "has two surrogate pairs", function() {
			assert.equal( "\\uD83D\\uDCA9\\uD83D\\uDE0E", gh.toString() );
		});
	});

	describe( "integration test: onload and DOMContentLoaded content", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-glyphhanger.js" ), false, false, "", path.join( __dirname, "test.html" ) ];

		it( "should have 9 distinct glyphs", function( done ) {
			this.timeout( 6000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				assert.equal( "abcdefghi", stdout.trim() );
				done();
			});
		})
	});
});

describe( "glyphhanger-spider", function() {
	describe( "Single Link", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a>";

		it( "found one link", function() {
			var gh = new GlyphHangerSpider();
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( [ "firstlink.html" ], urls );
		});
	});

	describe( "Multiple links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='secondlink.html'>Test</a>";

		it( "found two links", function() {
			var gh = new GlyphHangerSpider();
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( [ "firstlink.html", "secondlink.html" ], urls );
		});
	});

	describe( "Prune email links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='mailto:localhost@example.com'>Test</a>";

		it( "did not find the email link", function() {
			var gh = new GlyphHangerSpider();
			gh.parse( div );
			var urls = gh.getUrls();

			assert.deepEqual( [ "firstlink.html" ], urls );
		});
	});

	describe( "Integration test: find links", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-urls.js" ), path.join( __dirname, "urls.html" ) ];

		it( "should have 3 links", function( done ) {
			this.timeout( 6000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				var expecting = [
					"file://" + path.join( __dirname, "test.html" ),
					"file://" + path.join( __dirname, "test2.html" ),
					"file://" + path.join( __dirname, "test3.html" )
				];

				assert.equal( expecting.join( "\n" ), stdout.trim() );
				done();
			});
		})
	});
});