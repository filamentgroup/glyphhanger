#!/usr/bin/env node

var fs = require( "fs" );
var filesize = require( "filesize" );
var path = require( "path" );
var phantomjs = require( "phantomjs-prebuilt" );
var childProcess = require( "child_process" );
var chalk = require( "chalk" );
var argv = require( "minimist" )( process.argv.slice(2) );
var glob = require( "glob" );
var shell = require( "shelljs" );
var parsePath = require( "parse-filepath" );
var CharacterSet = require( "characterset" );

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

function GlyphHangerWhitelist( chars, useUsAscii ) {
	var cs = new CharacterSet();
	if( useUsAscii ) {
		cs = cs.union( new CharacterSet(" ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~") );
	}
	if( chars && chars.match( GlyphHangerWhitelist.unicodeCodePointsRegex ) ) {
		cs = cs.union( CharacterSet.parseUnicodeRange( chars ) );
	} else if( chars ) {
		cs = cs.union( new CharacterSet( chars ) );
	}

	this.whitelist = cs;
}

GlyphHangerWhitelist.unicodeCodePointsRegex = /(U\+[\dABCDEF]+\-?[\dABCDEF]*),?/g;

GlyphHangerWhitelist.prototype.usingWhitelist = function() {
	return !this.whitelist.isEmpty();
};
GlyphHangerWhitelist.prototype.getWhitelist = function() {
	return this.whitelist.toString();
};
GlyphHangerWhitelist.prototype.getWhitelistAsUnicodes = function() {
	return this.whitelist.toHexRangeString();
};

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
PhantomGlyphHanger.prototype.setUnicodesOutput = function( unicodes ) {
	this.unicodes = !!unicodes;
};
PhantomGlyphHanger.prototype.setWhitelist = function( whitelistObj ) {
	this.whitelist = whitelistObj;
};

PhantomGlyphHanger.prototype.getArguments = function() {
	// order is important here
	var args = [
		path.join( __dirname, "phantomjs-glyphhanger.js" )
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
	out.push( "  --unicodes" );
	out.push( "       Output code points instead of string values (better compatibility)." );
	out.push( "  --subset=*.ttf" );
	out.push( "       Automatically subsets one or more font files using fonttools `pyftsubset`." );
	out.push( "  --formats=ttf,woff,woff2,woff-zopfli" );
	out.push( "       woff2 requires brotli, woff-zopfli requires zopfli, installation instructions: https://github.com/filamentgroup/glyphhanger#installing-pyftsubset" );
	out.push( "" );
	out.push( "  --spider" );
	out.push( "       Gather urls from the main page and navigate those URLs." );
	out.push( "  --spider-limit=10" );
	out.push( "       Maximum number of URLs gathered from the spider (default: 10, use 0 to ignore)." );
	console.log( out.join( "\n" ) );
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

function GlyphHangerSubset() {}

GlyphHangerSubset.prototype.setFontFiles = function( ttfFontFiles ) {
	this.fontPaths = ttfFontFiles;
};

GlyphHangerSubset.prototype.setFormats = function( formatObj ) {
	this.formats = formatObj;
};

GlyphHangerSubset.prototype.subsetAll = function( unicodes, formats ) {
	this.fontPaths.forEach(function( fontPath ) {
		if( this.formats.hasFormat( "ttf" ) ) {
			this.subset( fontPath, unicodes );
		}
		if( this.formats.hasFormat( "woff" ) ) {
			this.subset( fontPath, unicodes, "woff", false );
		}
		if( this.formats.hasFormat( "woff-zopfli" ) ) {
			this.subset( fontPath, unicodes, "woff", true );
		}
		if( this.formats.hasFormat( "woff2" ) ) {
			this.subset( fontPath, unicodes, "woff2" );
		}
	}.bind( this ));
};

GlyphHangerSubset.prototype.subset = function( inputFile, unicodes, format, useZopfli ) {
	var fontPath = parsePath( inputFile );
	var outputFilename = fontPath.name + "-subset" + ( useZopfli ? ".zopfli" : "" ) + ( format ? "." + format : fontPath.ext );
	var outputFullPath = path.join( fontPath.dir, outputFilename );
	var cmd = [ "pyftsubset" ];
	cmd.push( inputFile );
	cmd.push( "--output-file=" + outputFullPath );
	cmd.push( "--unicodes=" + unicodes );
	if( format ) {
		format = format.toLowerCase();

		cmd.push( "--flavor=" + format );

		if( format === "woff" && useZopfli ) {
			cmd.push( "--with-zopfli" );
		}
	}

	if( !shell.which( "pyftsubset" ) ) {
		console.log( "`pyftsubset` from fonttools is required for the --subset feature." );
		shell.exit(1);
	}

	if( shell.exec( cmd.join( " " ) ).code !== 0 ) {
		shell.echo( "Error: pyftsubset command failed (" + cmd.join( " " ) + ")." );
		shell.exit(1);
	}

	var inputStat = fs.statSync( inputFile );
	var outputStat = fs.statSync( outputFullPath );
	console.log( "Subsetting", inputFile, "to", outputFilename, "(was " + chalk.red( filesize( inputStat.size ) ) + ", now " + chalk.green( filesize( outputStat.size ) ) + ")" );
}


var formats = new GlyphHangerFormat( argv.formats );
var whitelist = new GlyphHangerWhitelist( argv.w || argv.whitelist, argv.US_ASCII );

var pgh = new PhantomGlyphHanger();
pgh.setVerbose( argv.verbose );
pgh.setUnicodesOutput( argv.unicodes );
pgh.setWhitelist( whitelist );
pgh.setSubset( argv.subset );

var subset = new GlyphHangerSubset();
subset.setFormats( formats );

if( argv.subset ) {
	var fontFiles = glob.sync( argv.subset );

	subset.setFontFiles( fontFiles );

	pgh.setFetchUrlsCallback(function( unicodes ) {
		subset.subsetAll( unicodes );
	});
}

if( argv.version ) {
	var pkg = require( "./package.json" );
	console.log( pkg.version );
} else if( ( !argv._ || !argv._.length ) && whitelist.usingWhitelist() ) {
	if( argv.subset ) {
		subset.subsetAll( whitelist.getWhitelistAsUnicodes() );
	} else {
		pgh.output();
	}
} else if( !argv._ || !argv._.length ) {
	pgh.outputHelp();
} else if( argv.spider || argv[ 'spider-limit' ] || argv[ 'spider-limit' ] === 0 ) {
	var spider = new PhantomGlyphHangerSpider();
	spider.setLimit( argv[ 'spider-limit' ] );

	spider.findUrls( argv._, function( urls ) {
		if( argv.verbose ) {
			urls.forEach(function( url, index ) {
				console.log( "glyphhanger-spider found (" + ( index + 1 ) + "): " + url );
			});
		}

		pgh.fetchUrls( urls );
	});
} else {
	pgh.fetchUrls( argv._ );
}
