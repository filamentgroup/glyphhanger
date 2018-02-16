#!/usr/bin/env node
var argv = require( "minimist" )( process.argv.slice(2) );
var GlyphHangerFormat = require( "./src/GlyphHangerFormat" );
var GlyphHangerWhitelist = require( "./src/GlyphHangerWhitelist" );
var PhantomGlyphHanger = require( "./src/PhantomGlyphHanger" );
var PhantomGlyphHangerSpider = require( "./src/PhantomGlyphHangerSpider" );
var GlyphHangerSubset = require( "./src/GlyphHangerSubset" );

var whitelist = new GlyphHangerWhitelist( argv.w || argv.whitelist, argv.US_ASCII );

var pgh = new PhantomGlyphHanger();
pgh.setVerbose( argv.verbose );
if( argv.unicodes ) {
	console.log( '--unicodes was made default in v2.0. To output characters instead of code points, use --string' );
	require( "shelljs" ).exit(1);
}
pgh.setUnicodesOutput( argv.string );
pgh.setWhitelist( whitelist );
pgh.setSubset( argv.subset );
pgh.setJson( argv.json );
pgh.setClassName( argv.classname );

var subset = new GlyphHangerSubset();
if( argv.formats ) {
	subset.setFormats( argv.formats );
}

if( argv.subset ) {
	subset.setFontFilesGlob( argv.subset );

	// using URLs
	pgh.setFetchUrlsCallback(function( unicodes ) {
		subset.subsetAll( unicodes );
	});
}

// glyphhanger --version
// glyphhanger --help
// glyphhanger
// glyphhanger http://localhost/
// glyphhanger http://localhost/ --spider 									(limit default 10)
// glyphhanger http://localhost/ --spider-limit							(limit default 10)
// glyphhanger http://localhost/ --spider-limit=0 					(no limit)
// glyphhanger http://localhost/ --spider-limit=1						(limit 1)
// glyphhanger --whitelist=ABCD															(convert characters to unicode range)
// glyphhanger --US_ASCII																		(convert characters to unicode range)
// glyphhanger --US_ASCII --whitelist=ABCD									(convert characters to unicode range)
// glyphhanger --subset=*.ttf																(file format conversion)
// glyphhanger --subset=*.ttf --whitelist=ABCD							(reduce to whitelist characters)
// glyphhanger --subset=*.ttf --US_ASCII										(reduce to US_ASCII characters)
// glyphhanger --subset=*.ttf --US_ASCII --whitelist=ABCD		(reduce to US_ASCII union with whitelist)

if( argv.version ) {
	var pkg = require( "./package.json" );
	console.log( pkg.version );
} else if( argv.help ) {
	pgh.outputHelp();
} else if( argv._ && argv._.length ) {
	if( argv.spider || argv[ 'spider-limit' ] || argv[ 'spider-limit' ] === 0 ) {
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
} else { // not using URLs
	if( argv.subset ) {
		// --subset with or without --whitelist
		subset.subsetAll( !whitelist.isEmpty() ? whitelist.getWhitelistAsUnicodes() : whitelist.getUniversalRangeAsUnicodes() );
	} else if( !whitelist.isEmpty() ) {
		// not subsetting, just output the code points (can convert whitelist string to code points)
		pgh.output();
	} else {
		pgh.outputHelp();
	}
}