(function( root, factory ) {
		if( typeof exports === "object" && typeof exports.nodeName !== "string" ) {
			// CommonJS
			module.exports = factory( require( "characterset" ) );
		} else {
			// Browser
			root.GlyphHanger = factory( root.CharacterSet );
		}
}( this, function( CharacterSet ) {

	var GH = function() {
		this.set = new CharacterSet();
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

	GH.prototype.saveGlyphs = function( text ) {
		this.set = this.set.union( new CharacterSet( text ) );
	};

	GH.prototype.getGlyphs = function() {
		return this.set.toArray();
	};

	GH.prototype.toString = function() {
		return this.set.toString();
	};

	return GH;
}));