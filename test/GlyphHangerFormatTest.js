const assert = require( "assert" );
const GlyphHangerFormat = require( "../src/GlyphHangerFormat" );

describe( "GlyphHangerFormat", function() {
	it( "hasFormat just ttf", function() {
		var format = new GlyphHangerFormat("ttf");
		assert.equal( format.hasFormat("ttf"), true );
		assert.equal( format.hasFormat("woff"), false );
		assert.equal( format.hasFormat("woff-zopfli"), false );
		assert.equal( format.hasFormat("woff2"), false );
		assert.equal( format.hasFormat("unknown"), false );
	});

	it( "hasFormat just woff", function() {
		var format = new GlyphHangerFormat("woff");
		assert.equal( format.hasFormat("ttf"), false );
		assert.equal( format.hasFormat("woff"), true );
		assert.equal( format.hasFormat("woff-zopfli"), false );
		assert.equal( format.hasFormat("woff2"), false );
		assert.equal( format.hasFormat("unknown"), false );
	});

	it( "hasFormat just woff-zopfli", function() {
		var format = new GlyphHangerFormat("woff-zopfli");
		assert.equal( format.hasFormat("ttf"), false );
		assert.equal( format.hasFormat("woff"), false );
		assert.equal( format.hasFormat("woff-zopfli"), true );
		assert.equal( format.hasFormat("woff2"), false );
		assert.equal( format.hasFormat("unknown"), false );
	});

	it( "hasFormat just woff2", function() {
		var format = new GlyphHangerFormat("woff2");
		assert.equal( format.hasFormat("ttf"), false );
		assert.equal( format.hasFormat("woff"), false );
		assert.equal( format.hasFormat("woff-zopfli"), false );
		assert.equal( format.hasFormat("woff2"), true );
		assert.equal( format.hasFormat("unknown"), false );
	});

	it( "hasFormat just ttf,woff2", function() {
		var format = new GlyphHangerFormat("ttf,woff2");
		assert.equal( format.hasFormat("ttf"), true );
		assert.equal( format.hasFormat("woff"), false );
		assert.equal( format.hasFormat("woff-zopfli"), false );
		assert.equal( format.hasFormat("woff2"), true );
		assert.equal( format.hasFormat("unknown"), false );
	});
});