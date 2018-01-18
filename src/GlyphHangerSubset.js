var shell = require( "shelljs" );
var parsePath = require( "parse-filepath" );
var fs = require( "fs" );
var filesize = require( "filesize" );
var path = require("path");

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
	cmd.push( "--layout-features='*'" );
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

module.exports = GlyphHangerSubset;
