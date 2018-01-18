var childProcess = require( "child_process" );
var phantomjs = require( "phantomjs-prebuilt" );
var path = require( "path" );

function PhantomGlyphHangerSpider() {
	this.limit = 10;
}

PhantomGlyphHangerSpider.prototype.setLimit = function( limit ) {
	if( limit !== undefined ) {
		this.limit = limit;
	}
};

PhantomGlyphHangerSpider.prototype.getArguments = function() {
	// order is important here
	var args = [
		path.join( __dirname, "..", "phantomjs-urls.js" )
	];
	return args;
};

PhantomGlyphHangerSpider.prototype.findUrls = function( url, callback ) {
	var args = this.getArguments();

	childProcess.execFile( phantomjs.path, args.concat( url ), function( error, stdout, stderr ) {
		if( error ) {
			throw error;
		}

		var urls = stdout.trim().split( "\n" );
		callback( this.limit ? urls.slice( 0, this.limit ) : urls );
	}.bind( this ));
};

module.exports = PhantomGlyphHangerSpider;