function GlyphHangerFormat( formats ) {
	var lookup = {};
	( formats || "ttf,woff2,woff-zopfli" ).split( "," ).forEach(function( format ) {
		lookup[ format.trim().toLowerCase() ] = true;
	})
	this.formats = lookup;
};
GlyphHangerFormat.prototype.hasFormat = function( format ) {
	return this.formats[ format ] === true;
};

module.exports = GlyphHangerFormat;