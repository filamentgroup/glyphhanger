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
			assert.equal( "abc", gh.getGlyphs().join( "" ) );
		});
	});

	describe( "Node with children", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div>";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "bcd", gh.getGlyphs().join( "" ) );
		});
	});

	describe( "More complex node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div><div><span>e</span>fg</div>0123456789";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "0123456789bcdefg", gh.getGlyphs().join( "" ) );
		});
	});

	describe( "Whitelist", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "bcd";

		var gh = new GlyphHanger();
		gh.saveGlyphs( "efgh")
		gh.init( div );

		it( "should match", function() {
			assert.equal( "bcdefgh", gh.getGlyphs().join( "" ) );
		});
	});

	describe( "Emoji", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎";

		var gh = new GlyphHanger();
		gh.init( div );

		it( "should match", function() {
			assert.equal( "😎", gh.getGlyphs().join( "" ) );
		});
	});
});

describe( "glyphhanger-spider", function() {
	describe( "Find one links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a>";

		it( "should match", function() {
			var gh = new GlyphHangerSpider();
			var urls = gh.parse( div );

			assert.deepEqual( [ "firstlink.html" ], urls );
		});
	});

	describe( "Find two links", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<a href='firstlink.html'>Test</a><a href='secondlink.html'>Test</a>";

		it( "should match", function() {
			var gh = new GlyphHangerSpider();
			var urls = gh.parse( div );

			assert.deepEqual( [ "firstlink.html", "secondlink.html" ], urls );
		});
	});
});