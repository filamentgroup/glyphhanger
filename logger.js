(function( root, factory ) {
		if( typeof exports === "object" && typeof exports.nodeName !== "string" ) {
			// CommonJS
			module.exports = factory();
		} else {
			// Browser
			root.GlyphHanger = factory();
		}
}( this, function() {

	var GH = function() {
		this.glyphs = {};
	};

	GH.prototype.init = function( parentNode ) {
		if( parentNode ) {
			this.findTextNodes( parentNode ).forEach( function( node ) {
				this.saveGlyphs( node.nodeValue );
			}.bind( this ) );
		}
	}

	GH.prototype.findTextNodes = function( node ) {
		// via http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var all = [];
		for( node = node.firstChild; node; node = node.nextSibling ) {
			if( node.nodeType == 3 && !!node.nodeValue.trim() ) {
				all.push( node );
			} else {
				all = all.concat( this.findTextNodes( node ) );
			}
		}
		return all;
	};

	GH.prototype.saveGlyph = function( glyph ) {
		// glyph = glyph.trim();
		if( !( glyph in this.glyphs ) ) {
			this.glyphs[ glyph ] = 0;
		}

		this.glyphs[ glyph ]++;
	}

	GH.prototype.saveGlyphs = function( text ) {
		var split = text.split( "" );
		split.forEach( this.saveGlyph.bind( this ) );
	};

	GH.prototype.getReport = function() {
		var str = [];
		var keys = this.getGlyphs();
		str.push( keys.length + " glyphs: " + keys.join( "" ) );
		return str.join( "\n" );
	};

	GH.prototype.getGlyphs = function() {
		return Object.keys( this.glyphs ).sort();
	};

	return GH;
}));