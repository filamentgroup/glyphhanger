(function( root, factory ) {
		if( typeof exports === "object" && typeof exports.nodeName !== "string" ) {
			// CommonJS
			module.exports = factory();
		} else {
			// Browser
			root.GlyphHangerSpider = factory();
		}
}( this, function() {

	var GHS = function() {
		this.urls = [];
		this.duplicates = {};

		if( typeof window !== "undefined" ) {
			this.setEnv( window );
		}
	};

	GHS.prototype.setEnv = function( win ) {
		this.window = win;
		this.document = win.document;
	};

	GHS.prototype.add = function( url ) {
		if( !url ||
			this.duplicates[ url ] ||
			url.indexOf( "mailto:" ) === 0 || // is email link
			url.indexOf( this.document.location.host ) === -1 ) { // is not a local link
			return;
		}

		this.duplicates[ url ] = true;
		this.urls.push( url );
	};

	GHS.prototype.normalizeURL = function( url ) {
		var a = this.document.createElement( "a" );
		a.href = url;
		var href = a.href;

		var foundPound = href.lastIndexOf("#");
		if( foundPound > -1 ) {
			return href.substr(0, foundPound );
		}

		return href;
	};

	GHS.prototype.parse = function( parentNode ) {
		Array.prototype.slice.call( parentNode.querySelectorAll( "a[href]" ) ).forEach(function( node ) {
			var url = this.normalizeURL( node.getAttribute( "href" ) );

			this.add( url );
		}.bind( this ));

		return this.urls;
	};

	GHS.prototype.getUrls = function() {
		return this.urls;
	};

	return GHS;
}));