const assert = require( "assert" );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const GlyphHanger = require( "../src/GlyphHanger" );
const window = (new JSDOM(`<!doctype html><html><body></body></html>`)).window;
const document = window.document;

const GlyphHangerScript = require( "../src/glyphhanger-script.js" );

describe( "GlyphHanger Injected Script Tests", function() {
	describe( "Simple node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "abc";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "abc" );
		});
	});

	describe( "Node with children", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "bcd" );
		});
	});

	describe( "Node with text-transform: uppercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: uppercase'>bcd</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "BCD" );
		});
	});

	describe( "Complex node with text-transform: uppercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div><span style='text-transform: uppercase'>b</span>cd</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "Bcd" );
		});
	});

	describe( "Node with text-transform: lowercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: lowercase'>BCD</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "bcd" );
		});
	});

	describe( "Node with text-transform: capitalize", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: capitalize'>test</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			// TESTtest => unique and sorted becomes ESTest
			assert.equal( ghs.toString(), "ESTest" );
		});
	});


	describe( "More complex node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div><div><span>e</span>fg</div>0123456789";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "0123456789bcdefg" );
		});
	});

	describe( "Whitelist", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "bcd";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.saveGlyphs( "efgh", "serif");
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.toString(), "bcdefgh" );
		});
	});

	describe( "Surrogate Pair", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "has a surrogate pair", function() {
			assert.equal( ghs.toString(), "\\uD83D\\uDE0E" );
		});
	});

	describe( "Multiple Surrogate Pairs", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎💩";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "has two surrogate pairs", function() {
			assert.equal( ghs.toString(), "\\uD83D\\uDCA9\\uD83D\\uDE0E" );
		});
	});

	describe( "font-family Sets, monospace", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.getFamilySet("monospace").toString(), "bcd" );
			assert.equal( ghs.getFamilySet("serif").toString(), "efg" );
			assert.equal( ghs.toString(), "bcdefg" );
		});
	});

	describe( "font-family Sets, monospace and sans-serif", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg<div style='font-family: sans-serif'>ghi</div>";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.equal( ghs.getFamilySet("monospace").toString(), "bcd" );
			assert.equal( ghs.getFamilySet("sans-serif").toString(), "ghi" );
			assert.equal( ghs.getFamilySet("serif").toString(), "efg" );
			assert.equal( ghs.toString(), "bcdefghi" );
		});
	});

	describe( "font-family Sets, monospace JSON", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.deepEqual( ghs.toJSON(), {"monospace":[98,99,100],"serif":[101,102,103],"*":[98,99,100,101,102,103]} );
		});
	});

	describe( "getFontFamilyName", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: Lato, monospace'>bcd</div>efg";

		var ghs = new GlyphHangerScript();

		it( "should fetch a single name", function() {
			assert.deepEqual( ghs.getFontFamilyName("serif"), "serif" );
			assert.deepEqual( ghs.getFontFamilyName("Lato"), "Lato" );
		});

		it( "should fetch the first family name in a list", function() {
			assert.deepEqual( ghs.getFontFamilyName("Lato, serif"), "Lato" );
		});

		it( "should fetch a family name without quotes", function() {
			assert.deepEqual( ghs.getFontFamilyName("'Lato'"), "Lato" );
		});

		it( "should fetch the first family name without quotes in a list", function() {
			assert.deepEqual( ghs.getFontFamilyName("'Lato', serif"), "Lato" );
		});
	});

	describe( "Get font-family name from list", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: Lato, monospace'>bcd</div>efg";

		var ghs = new GlyphHangerScript();
		ghs.setEnv(window);
		ghs.init( div );

		it( "should match", function() {
			assert.deepEqual( ghs.toJSON(), {"Lato":[98,99,100],"serif":[101,102,103],"*":[98,99,100,101,102,103]} );
		});
	});
});

describe( "GlyphHanger Tests", function() {
	describe( "Add to sets", function() {
		it( "Sets should have the right keys", function() {
			var gh = new GlyphHanger();
			gh.addToSets({
				"*": [44,45,46],
				"Open Sans": [44,45,46]
			});

			assert.deepEqual( Object.keys(gh.sets), ["*", "Open Sans"] );
		});
	});
	describe( "getSetForFamilies", function() {
		var gh = new GlyphHanger();
		gh.addToSets({
			"*": [9,44,45,46,47,48],
			"Open Sans": [44,45,46],
			"Lato": [44,47,48],
			"Roboto": [9]
		});

		it( "empty string should return empty set", function() {
			assert.deepEqual( gh.getSetForFamilies("").toArray(), [] );
		});

		it( "Open Sans should show only the code points for Open Sans", function() {
			assert.deepEqual( gh.getSetForFamilies("Open Sans").toArray(), [44,45,46] );
		});

		it( "open sans (case insensitive) should show only the code points for Open Sans", function() {
			assert.deepEqual( gh.getSetForFamilies("open sans").toArray(), [44,45,46] );
		});

		it( "OPEN SANS (case insensitive) should show only the code points for Open Sans", function() {
			assert.deepEqual( gh.getSetForFamilies("OPEN SANS").toArray(), [44,45,46] );
		});

		it( "Lato, Open Sans should show only the code points for Open Sans and Lato", function() {
			assert.deepEqual( gh.getSetForFamilies("Lato, Open Sans").toArray(), [44,45,46,47,48] );
		});
	});
});
