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

		if( typeof window !== "undefined" ) {
			this.win = window;
		}
	};

	GH.prototype.setEnv = function(win) {
		this.win = win;
	};

	GH.prototype.init = function( parentNode ) {
		if( parentNode ) {
			this.findTextNodes( parentNode ).filter(function( node ) {
				// only non-empty values
				return this.hasValue( node );
			}.bind( this )).forEach( function( node ) {
				this.saveGlyphs( this.getNodeValue( node ) );
			}.bind( this ));
		}
	}

	GH.prototype.fakeInnerText = function( node ) {
		var value = node.nodeValue;

		if( node.nodeType !== 3 ) {
			return "";
		}

		if( node.parentNode ) {
			var textTransform = this.win.getComputedStyle( node.parentNode ).getPropertyValue( "text-transform" );
			switch (textTransform) {
				case "uppercase":
					return value.toUpperCase();
				case "lowercase":
					return value.toLowerCase();
				case "capitalize":
					// workaround language specific rules with text-transform
					// "ß".toUpperCase() => "SS" in german, for example
					return value.toUpperCase() + value.toLowerCase();
			}
		}

		return value;
	};

	GH.prototype.getNodeValue = function( node ) {
		return node.innerText || this.fakeInnerText( node ) || "";
	};

	GH.prototype.hasValue = function( node ) {
		return (node.innerText || node.nodeValue).trim().length > 0;
	};

	GH.prototype.findTextNodes = function( node ) {
		// via http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var all = [];
		for( node = node.firstChild; node; node = node.nextSibling ) {
			if( node.nodeType == 3 ) {
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