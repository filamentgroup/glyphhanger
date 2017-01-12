require( "jsdom-global" )();

var assert = require( "assert" );
var GlyphHanger = require( "../glyphhanger.js" );
var GlyphHangerSpider = require( "../glyphhanger-spider.js" );

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
});

describe( "glyphhanger-spider", function() {
	describe( "Single Link", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a>";

		it( "found one link", function() {
			var gh = new GlyphHangerSpider();
			var urls = gh.parse( div );

			assert.deepEqual( [ "firstlink.html" ], urls );
		});
	});

	describe( "Multiple links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='secondlink.html'>Test</a>";

		it( "found two links", function() {
			var gh = new GlyphHangerSpider();
			var urls = gh.parse( div );

			assert.deepEqual( [ "firstlink.html", "secondlink.html" ], urls );
		});
	});
});