const assert = require( "assert" );
const path = require( "path" );
const phantomjs = require( "phantomjs-prebuilt" );
const childProcess = require( "child_process" );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const window = (new JSDOM(`<!doctype html><html><body></body></html>`)).window;
const document = window.document;

const GlyphHanger = require( "../glyphhanger.js" );

describe( "glyphhanger", function() {
	describe( "Simple node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "abc";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "abc" );
		});
	});

	describe( "Node with children", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "bcd" );
		});
	});

	describe( "Node with text-transform: uppercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: uppercase'>bcd</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "BCD" );
		});
	});

	describe( "Complex node with text-transform: uppercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div><span style='text-transform: uppercase'>b</span>cd</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "Bcd" );
		});
	});

	describe( "Node with text-transform: lowercase", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: lowercase'>BCD</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "bcd" );
		});
	});

	describe( "Node with text-transform: capitalize", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='text-transform: capitalize'>test</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			// TESTtest => unique and sorted becomes ESTest
			assert.equal( gh.toString(), "ESTest" );
		});
	});


	describe( "More complex node", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div>bcd</div><div><span>e</span>fg</div>0123456789";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "0123456789bcdefg" );
		});
	});

	describe( "Whitelist", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "bcd";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.saveGlyphs( "efgh")
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.toString(), "bcdefgh" );
		});
	});

	describe( "Surrogate Pair", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "has a surrogate pair", function() {
			assert.equal( gh.toString(), "\\uD83D\\uDE0E" );
		});
	});

	describe( "Multiple Surrogate Pairs", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "😎💩";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "has two surrogate pairs", function() {
			assert.equal( gh.toString(), "\\uD83D\\uDCA9\\uD83D\\uDE0E" );
		});
	});

	describe( "font-family Sets, monospace", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.getFamilySet("monospace").toString(), "bcd" );
			assert.equal( gh.getFamilySet("serif").toString(), "efg" );
			assert.equal( gh.toString(), "bcdefg" );
		});
	});

	describe( "font-family Sets, monospace and sans-serif", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg<div style='font-family: sans-serif'>ghi</div>";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.equal( gh.getFamilySet("monospace").toString(), "bcd" );
			assert.equal( gh.getFamilySet("sans-serif").toString(), "ghi" );
			assert.equal( gh.getFamilySet("serif").toString(), "efg" );
			assert.equal( gh.toString(), "bcdefghi" );
		});
	});

	describe( "font-family Sets, monospace JSON", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: monospace'>bcd</div>efg";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.deepEqual( gh.toJSON(), {"monospace":[98,99,100],"serif":[101,102,103],"*":[98,99,100,101,102,103]} );
		});
	});

	describe( "getFontFamilyName", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: Lato, monospace'>bcd</div>efg";

		var gh = new GlyphHanger();

		it( "should fetch a single name", function() {
			assert.deepEqual( gh.getFontFamilyName("serif"), "serif" );
			assert.deepEqual( gh.getFontFamilyName("Lato"), "Lato" );
		});

		it( "should fetch the first family name in a list", function() {
			assert.deepEqual( gh.getFontFamilyName("Lato, serif"), "Lato" );
		});

		it( "should fetch a family name without quotes", function() {
			assert.deepEqual( gh.getFontFamilyName("'Lato'"), "Lato" );
		});

		it( "should fetch the first family name without quotes in a list", function() {
			assert.deepEqual( gh.getFontFamilyName("'Lato', serif"), "Lato" );
		});
	});

	describe( "Get font-family name from list", function() {
		var div = document.createElement( "div" );
		div.innerHTML = "<div style='font-family: Lato, monospace'>bcd</div>efg";

		var gh = new GlyphHanger();
		gh.setEnv(window);
		gh.init( div );

		it( "should match", function() {
			assert.deepEqual( gh.toJSON(), {"Lato":[98,99,100],"serif":[101,102,103],"*":[98,99,100,101,102,103]} );
		});
	});

	describe( "Integration test", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-glyphhanger.js" ), false, false, "", false, "", path.join( __dirname, "test.html" ) ];

		it( "should have 3 distinct glyphs", function( done ) {
			this.timeout( 30000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				assert.equal( stdout.trim(), "abc" );
				done();
			});
		})
	});

	describe( "Integration test: text-transform uppercase", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-glyphhanger.js" ), false, false, "", false, "", path.join( __dirname, "uppercase.html" ) ];

		it( "should have uppercase words", function( done ) {
			this.timeout( 30000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				// abc ^word => abcWORD => DORWabc
				assert.equal( stdout.trim(), "DORWabc" );
				done();
			});
		})
	});

	describe( "Integration test: text-transform capitalize", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-glyphhanger.js" ), false, false, "", false, "", path.join( __dirname, "capitalize.html" ) ];

		it( "should have capitalized words", function( done ) {
			this.timeout( 30000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				// abc ^word => abcWORDword => DORWabcdorw
				assert.equal( stdout.trim(), "DORWabcdorw" );
				done();
			});
		})
	});

	describe( "Integration test: onload and DOMContentLoaded content", function() {
		var args = [ path.join( __dirname, "..", "phantomjs-glyphhanger.js" ), false, false, "", false, "", path.join( __dirname, "test-onload-content.html" ) ];

		it( "should have 9 distinct glyphs", function( done ) {
			this.timeout( 30000 );
			childProcess.execFile( phantomjs.path, args, function( error, stdout, stderr ) {

				assert.equal( stdout.trim(), "abcdefghi" );
				done();
			});
		})
	});
});

