function GlyphHangerFormat( formatsString ) {
	this.setFormats( formatsString || "ttf,woff2,woff-zopfli" );
};

GlyphHangerFormat.prototype.setFormats = function( formatsString ) {
	var lookup = {};
	formatsString.split( "," ).forEach(function( format ) {
		lookup[ format.trim().toLowerCase() ] = true;
	})
	this.formats = lookup;
};
GlyphHangerFormat.prototype.hasFormat = function( format ) {
	return this.formats[ format ] === true;
};

module.exports = GlyphHangerFormat;