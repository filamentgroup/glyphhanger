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
		this.globalSet = new CharacterSet();
		this.fontFamilySets = {};
		this.displayFontFamilyNames = {};
		this.defaultFontFamily = "serif";

		if( typeof window !== "undefined" ) {
			this.win = window;
		}
	};

	GH.prototype.getFontFamilyNameFromNode = function(node) {
		var fontFamilyList = node.parentNode ? (this.win.getComputedStyle( node.parentNode ).getPropertyValue( "font-family" ) || this.defaultFontFamily) : null;
		return this.getFontFamilyName( fontFamilyList );
	};

	GH.prototype.getFontFamilyName = function(fontFamilyList) {
		if( !fontFamilyList ) {
			return "";
		}

		var split = fontFamilyList.split(",").map(function(family) {
			// remove whitespace
			return family.trim();
		}).map(function(family) {
			// remove quotes
			return family.replace(/[\"\']/g, "");
		});

		return split.length ? split[0] : "";
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
				var fontFamily = this.getFontFamilyNameFromNode( node );
				this.displayFontFamilyNames[ fontFamily.toLowerCase() ] = fontFamily;
				var text = this.getNodeValue( node );
				console.log( "font-family `" + fontFamily + "` has text: ", text );

				this.saveGlyphs( text, fontFamily.toLowerCase() );
			}.bind( this ));
		}
	}

	GH.prototype.fakeInnerText = function( node ) {
		var value = node.nodeValue.trim();

		if( node.nodeType !== 3 ) {
			return "";
		}

		if( node.parentNode ) {
			var textTransform = this.win.getComputedStyle( node.parentNode ).getPropertyValue( "text-transform" );
			// console.log( "textTransform:", textTransform );
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

		// console.log( "returning nodeValue", value );

		return value;
	};

	GH.prototype.getNodeValue = function( node ) {
		var innerText = this.fakeInnerText( node );
		// console.log( "innerText:", node.innerText );
		// console.log( "fakeInnerText:", innerText );
		return node.innerText || innerText || "";
	};

	GH.prototype.hasValue = function( node ) {
		return (node.innerText || node.nodeValue).trim().length > 0;
	};

	GH.prototype.findTextNodes = function( node ) {
		// via http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var all = [];
		var node;
		for( node = node.firstChild; node; node = node.nextSibling ) {
			if( node.nodeType === 3 ) {
				all.push( node );
			} else {
				all = all.concat( this.findTextNodes( node ) );
			}
		}
		return all;
	};

	GH.prototype.saveGlyphs = function( text, fontFamily ) {
		var set = new CharacterSet( text );
		this.globalSet = this.globalSet.union( set );

		if( fontFamily ) {
			this.fontFamilySets[ fontFamily ] = this.getFamilySet( fontFamily ).union( set );
		}
	};

	GH.prototype.getFamilySet = function(fontFamily) {
		return fontFamily in this.fontFamilySets ? this.fontFamilySets[ fontFamily ] : new CharacterSet();
	};

	GH.prototype.getGlyphs = function() {
		return this.globalSet.toArray();
	};

	GH.prototype.toString = function() {
		return this.globalSet.toString();
	};

	GH.prototype.toJSONString = function() {
		return JSON.stringify(this.toJSON());
	};

	GH.prototype.toJSON = function() {
		var obj = {};
		for( var family in this.fontFamilySets ) {
			obj[this.displayFontFamilyNames[family]] = this.fontFamilySets[family].toArray();
		}
		obj['*'] = this.getGlyphs();

		return obj;
	};

	return GH;
}));