var chalk = require( "chalk" );
var path = require( "path" );
var phantomjs = require( "phantomjs-prebuilt" );
var childProcess = require( "child_process" );

function PhantomGlyphHanger() {
}
PhantomGlyphHanger.prototype.setSubset = function( subset ) {
	this.subset = !!subset;
};
PhantomGlyphHanger.prototype.setFetchUrlsCallback = function( callback ) {
	this.fetchUrlsCallback = callback;
};
PhantomGlyphHanger.prototype.setVerbose = function( verbose ) {
	this.verbose = !!verbose;
};
PhantomGlyphHanger.prototype.setUnicodesOutput = function( showString ) {
	this.unicodes = !showString;
};
PhantomGlyphHanger.prototype.setWhitelist = function( whitelistObj ) {
	this.whitelist = whitelistObj;
};

PhantomGlyphHanger.prototype.getArguments = function() {
	// order is important here
	var args = [
		path.join( __dirname, "../phantomjs-glyphhanger.js" )
	];

	args.push( !this.subset && this.verbose ); // can’t use subset and verbose together.
	args.push( this.subset ? true : this.unicodes ); // when subsetting you have to use unicodes
	args.push( this.whitelist.getWhitelistAsUnicodes() );

	return args;
};

PhantomGlyphHanger.prototype.output = function( chars ) {
	if( chars ) {
		console.log( chars );
	} else {
		console.log( this.unicodes ? this.whitelist.getWhitelistAsUnicodes() : this.whitelist.getWhitelist() );
	}
};

PhantomGlyphHanger.prototype.fetchUrls = function( urls ) {
	var args = this.getArguments();

	childProcess.execFile( phantomjs.path, args.concat( urls ), function( error, stdout, stderr ) {
		if( error ) {
			throw error;
		}

		if( this.fetchUrlsCallback ) {
			this.fetchUrlsCallback( stdout.trim() );
		} else {
			this.output( stdout );
		}
	}.bind( this ));
};

PhantomGlyphHanger.prototype.outputHelp = function() {
	// bad usage, output error and quit
	var out = [];

	out.push( chalk.red( "glyphhanger error: requires at least one URL or whitelist." ) );
	out.push( "" );
	out.push( "usage: glyphhanger ./test.html" );
	out.push( "       glyphhanger http://example.com" );
	out.push( "       glyphhanger https://google.com https://www.filamentgroup.com" );
	out.push( "       glyphhanger http://example.com --subset=*.ttf" );
	out.push( "       glyphhanger --whitelist=abcdef --subset=*.ttf" );
	out.push( "" );
	out.push( "arguments: " );
	out.push( "  --verbose" );
	out.push( "  --version" );
	out.push( "  --whitelist=abcdef" );
	out.push( "       A list of whitelist characters (optionally also --US_ASCII)." );
	out.push( "  --string" );
	out.push( "       Output the actual characters instead of Unicode code point values." );
	out.push( "  --subset=*.ttf" );
	out.push( "       Automatically subsets one or more font files using fonttools `pyftsubset`." );
	out.push( "  --formats=ttf,woff,woff2,woff-zopfli" );
	out.push( "       woff2 requires brotli, woff-zopfli requires zopfli, installation instructions: https://github.com/filamentgroup/glyphhanger#installing-pyftsubset" );
	out.push( "" );
	out.push( "  --spider" );
	out.push( "       Gather local URLs from the main page and navigate those URLs." );
	out.push( "  --spider-limit=10" );
	out.push( "       Maximum number of URLs gathered from the spider (default: 10, use 0 to ignore)." );
	console.log( out.join( "\n" ) );
};

module.exports = PhantomGlyphHanger;