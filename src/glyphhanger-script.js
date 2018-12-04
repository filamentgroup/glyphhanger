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

	GH.prototype.setEnv = function(win) {
		this.win = win;
	};

	GH.prototype.init = function( contextNode, opts ) {
		opts = opts || {};
		if( contextNode ) {
			var nodes = Array.from(contextNode.getElementsByTagName("*"));
			nodes.push(contextNode);
			nodes.forEach(function(node) {
				if( node.tagName ) {
					var tagName = node.tagName.toLowerCase();
					if( tagName === "script" ) {
						return;
					}
				}
				if( opts.onlyVisible && !(node.offsetWidth || node.offsetHeight || node.getClientRects().length) ) {
					return;
				}

				if( opts.cssSelector && !node.matches( opts.cssSelector ) ) {
					return;
				}

				this.getTextNodeChildren(node).filter(function( textNode ) {
					// only non-empty values
					return this.hasValue( textNode );
				}.bind( this )).forEach( function( textNode ) {
					var fontFamily = this.getFontFamilyNameFromNode( textNode, null );
					var text = this.getNodeValue( textNode );
					// console.log( "font-family `" + fontFamily + "` has text: ", text );

					this.saveGlyphs( text, fontFamily );
				}.bind( this ));

				var beforeContent = this.getPseudoContent(node, ":before");
				if( beforeContent ) {
					var beforeFamily = this.getFontFamilyNameFromNode( node, ":before" );
					// console.log( "(:before) font-family `" + beforeFamily + "` has text: ", beforeContent );
					this.saveGlyphs(beforeContent, beforeFamily);
				}

				var afterContent = this.getPseudoContent(node, ":after");
				if( afterContent ) {
					var afterFamily = this.getFontFamilyNameFromNode( node, ":after" );
					// console.log( "(:after) font-family `" + afterFamily + "` has text: ", afterContent );
					this.saveGlyphs(afterContent, afterFamily);
				}
			}.bind( this ));
		}
	}

	GH.prototype.getPseudoContent = function(node, pseudo) {
		if(!pseudo) {
			return;
		}
		return this.removeQuotes(this.win.getComputedStyle( node, pseudo ).getPropertyValue( "content" ), true);
	};

	// TODO resolve keywords when not string content
	GH.prototype.removeQuotes = function(text, requireQuotes) {
		if( text.indexOf("'") === 0 ) {
			// using single quotes
			return text.replace(/[\']/g, "");
		} else if( text.indexOf('"') === 0 ) {
			// using double quotes
			return text.replace(/[\"]/g, "");
		}

		if( !requireQuotes ) {
			return text;
		}
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
			return this.removeQuotes(family);
		}.bind( this ));

		return split.length ? split[0] : "";
	};

	GH.prototype.getFontFamilyNameFromNode = function(node, pseudo) {
		var context = node;
		if( node.nodeType === 3 ) {
			context = node.parentNode;
		}
		var fontFamilyList;
		if( context ) {
			var fontFamily = this.win.getComputedStyle( context, pseudo ).getPropertyValue( "font-family" );
			// console.log( "node font-family:", fontFamily, "fallback to", this.defaultFontFamily );
			fontFamilyList = fontFamily || this.defaultFontFamily;
		}
		return this.getFontFamilyName( fontFamilyList );
	};

	GH.prototype.fakeInnerText = function( node ) {
		var value = node.nodeValue.trim();

		if( node.nodeType !== 3 ) {
			return "";
		}

		if( node.parentNode ) {
			var style = this.win.getComputedStyle( node.parentNode );
			var textTransform = style.getPropertyValue( "text-transform" );
			// More information on small-caps at issue #51
			var fontVariant = style.getPropertyValue( "font-variant" );

			if( fontVariant === "small-caps" || textTransform === "capitalize" ) {
				// workaround language specific rules with text-transform
				// "ß".toUpperCase() => "SS" in german, for example
				return value.toUpperCase() + value.toLowerCase();
			} else if( textTransform === "uppercase" ) {
				return value.toUpperCase();
			} else if( textTransform === "lowercase" ) {
				return value.toLowerCase();
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

	GH.prototype.getTextNodeChildren = function( node ) {
		// modified from http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var all = [];
		var node;
		for( node = node.firstChild; node; node = node.nextSibling ) {
			if( node.nodeType === 3 ) {
				all.push( node );
			}
		}
		return all;
	};

	GH.prototype.saveGlyphs = function( text, fontFamily ) {
		var set = new CharacterSet( text );
		this.globalSet = this.globalSet.union( set );

		if( fontFamily ) {
			var key = fontFamily.toLowerCase();
			this.displayFontFamilyNames[ key ] = fontFamily;

			if( key ) {
				this.fontFamilySets[ key ] = this.getFamilySet( key ).union( set );
			}
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
