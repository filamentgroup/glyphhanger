#!/usr/bin/env node

var path = require( "path" );
var phantomjs = require( "phantomjs-prebuilt" );
var childProcess = require( "child_process" );
var chalk = require( "chalk" );
var argv = require( "minimist" )( process.argv.slice(2) );

var pluginName = "glyphhanger";

if( !argv.version && ( !argv._ || !argv._.length ) ) {
	var out = [];

	out.push( chalk.red( "glyphhanger error: requires at least one URL argument." ) );
	out.push( "" );
	out.push( "usage: glyphhanger ./test.html" );
	out.push( "       glyphhanger http://example.com" );
	out.push( "       glyphhanger https://google.com https://www.filamentgroup.com" );
	out.push( "" );
	out.push( "arguments: " );
	out.push( "  -w abcdef" );
	out.push( "       A list of whitelist characters." );
	out.push( "  --US_ASCII" );
	out.push( "       Shortcut for whitelisting the printable US-ASCII characters" );
	out.push( "  --unicodes" );
	out.push( "       Output code points instead of string values (better compatibility)." );
	out.push( "  --verbose" );
	out.push( "  --spider" );
	out.push( "       Gather urls from the main page and navigate those URLs." );
	out.push( "  --spider-limit=10" );
	out.push( "       Maximum number of URLs gathered from the spider (default: 10, use 0 to ignore)." );
	out.push( "  --version" );
	out.push( "       Outputs the glyphhanger version number." );

	console.log( out.join( "\n" ) );
	return;
}


function PhantomGlyphHanger() {
}

PhantomGlyphHanger.prototype.setVerbose = function( verbose ) {
	this.verbose = !!verbose;
};
PhantomGlyphHanger.prototype.setUnicodesOutput = function( unicodes ) {
	this.unicodes = !!unicodes;
};
PhantomGlyphHanger.prototype.setWhitelist = function( chars, useUsAscii ) {
	var whitelist = "";
	if( chars ) {
		whitelist += chars;
	}
	if( useUsAscii ) {
		whitelist += " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
	}
	this.whitelist = whitelist;
};

PhantomGlyphHanger.prototype.getArguments = function() {
	// order is important here
	var args = [
		path.join( __dirname, "phantomjs-glyphhanger.js" )
	];

	args.push( this.verbose );
	args.push( this.unicodes );
	args.push( this.whitelist );

	return args;
};

PhantomGlyphHanger.prototype.fetchUrls = function( urls ) {
	var args = this.getArguments();

	if( this.verbose ) {
		urls.forEach(function( url, index ) {
			console.log( "glyphhanger-spider found (" + ( index + 1 ) + "): " + url );
		});
	}

	childProcess.execFile( phantomjs.path, args.concat( urls ), function( error, stdout, stderr ) {
		if( error ) {
			throw error;
		}

		console.log( stdout );
	});
};

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
		path.join( __dirname, "phantomjs-urls.js" )
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


var pgh = new PhantomGlyphHanger();
pgh.setVerbose( argv.verbose );
pgh.setUnicodesOutput( argv.unicodes );
pgh.setWhitelist( argv.w );

if( argv.version ) {
	var pkg = require( "./package.json" );
	console.log( pkg.version );
} else if( !argv.spider && !argv[ 'spider-limit' ] ) {
	pgh.fetchUrls( argv._ );
} else {
	var spider = new PhantomGlyphHangerSpider();
	spider.setLimit( argv[ 'spider-limit' ] );

	spider.findUrls( argv._, function( urls ) {
		pgh.fetchUrls( urls );
	});
}