const assert = require( "assert" );
const GlyphHangerWhitelist = require( "../src/GlyphHangerWhitelist" );

describe( "GlyphHangerWhitelist", function() {
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