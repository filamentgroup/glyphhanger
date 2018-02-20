const assert = require( "assert" );
const GlyphHangerWhitelist = require( "../src/GlyphHangerWhitelist" );
const CharacterSet = require( "characterset" );

describe( "GlyphHangerWhitelist", function() {
	describe( "constructor", function() {
		it( "made a simple whitelist from string", function() {
			let wl = new GlyphHangerWhitelist("abc");
			assert.equal( wl.getWhitelist(), "abc" );
			assert.equal( wl.isEmpty(), false );
			assert.equal( wl.getCharacterSet() instanceof CharacterSet, true );
		});

		it( "made a simple whitelist from empty string", function() {
			let wl = new GlyphHangerWhitelist("");
			assert.equal( wl.getWhitelist(), "" );
			assert.equal( wl.isEmpty(), true );
		});

		it( "made a simple whitelist from unicode range", function() {
			let wl = new GlyphHangerWhitelist("U+61-63");
			assert.equal( wl.getWhitelist(), "abc" );
			assert.equal( wl.isEmpty(), false );
		});

		it( "made a simple whitelist from string with US_ASCII", function() {
			let wl = new GlyphHangerWhitelist("abc", true);
			assert.equal( wl.getWhitelistAsUnicodes(), "U+20-7E" );
			assert.equal( wl.isEmpty(), false );
		});

		it( "made a simple whitelist from empty string with US_ASCII", function() {
			let wl = new GlyphHangerWhitelist("", true);
			assert.equal( wl.getWhitelistAsUnicodes(), "U+20-7E" );
			assert.equal( wl.isEmpty(), false );
		});

		it( "made a simple whitelist from unicode range with US_ASCII", function() {
			let wl = new GlyphHangerWhitelist("U+61-63", true);
			assert.equal( wl.getWhitelistAsUnicodes(), "U+20-7E" );
			assert.equal( wl.isEmpty(), false );
		});

		it( "doesn’t barf when you don’t pass in a whitelist", function() {
			let wl = new GlyphHangerWhitelist("");
			assert.equal( wl.getWhitelistAsUnicodes(), "" );
			assert.equal( wl.isEmpty(), true );
		});

		it( "doesn’t barf when you pass in true (whitelist enabled but empty)", function() {
			let wl = new GlyphHangerWhitelist(true);
			assert.equal( wl.getWhitelistAsUnicodes(), "" );
			assert.equal( wl.isEmpty(), true );
		});
	});

	describe( "unicodeCodePointsRegex", function() {
		it( "Matched a single code point", function() {
			assert.ok( "U+20".match( GlyphHangerWhitelist.unicodeCodePointsRegex ) );
		});

		it( "Matched a range", function() {
			assert.ok( "U+20-32".match( GlyphHangerWhitelist.unicodeCodePointsRegex ) );
		});

		it( "Mixed range", function() {
			assert.ok( "U+20-7E,U+A0-FF,U+131".match( GlyphHangerWhitelist.unicodeCodePointsRegex ) );
		});

		it( "Mixed range with spaces", function() {
			assert.ok( "U+20-7E, U+A0-FF, U+131".match( GlyphHangerWhitelist.unicodeCodePointsRegex ) );
		});

		it( "Lower case mixed range with spaces", function() {
			assert.ok( "u+20-7e, u+a0-ff, u+131".match( GlyphHangerWhitelist.unicodeCodePointsRegex ) );
		});
	});
});