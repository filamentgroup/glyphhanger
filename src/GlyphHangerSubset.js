const shell = require( "shelljs" );
const parsePath = require( "parse-filepath" );
const fs = require( "fs" );
const filesize = require( "filesize" );
const path = require( "path" );
const chalk = require( "chalk" );
const glob = require( "glob" );
const GlyphHangerFormat = require("./GlyphHangerFormat");

function GlyphHangerSubset() {
	this.formats = new GlyphHangerFormat();
}

GlyphHangerSubset.prototype.setFontFilesGlob = function( ttfFilesGlob ) {
	this.fontPaths = glob.sync( ttfFilesGlob );
};

GlyphHangerSubset.prototype.setFontFiles = function( ttfFontFiles ) {
	this.fontPaths = ttfFontFiles;
};

GlyphHangerSubset.prototype.setFormats = function( formatsString ) {
	if( formatsString ) {
		this.formats.setFormats( formatsString );
	}
};

GlyphHangerSubset.prototype.getFilenames = function( ttfPath ) {
	var files = [];
	if( this.formats.hasFormat( "ttf" ) ) {
		files.push(this.getFilenameFromTTFPath(ttfPath));
	}
	if( this.formats.hasFormat( "woff" ) ) {
		files.push(this.getFilenameFromTTFPath(ttfPath, "woff"));
	}
	if( this.formats.hasFormat( "woff-zopfli" ) ) {
		files.push(this.getFilenameFromTTFPath(ttfPath, "woff", true));
	}
	if( this.formats.hasFormat( "woff2" ) ) {
		files.push(this.getFilenameFromTTFPath(ttfPath, "woff2"));
	}
	return files;
};

GlyphHangerSubset.prototype.getFilenameFromTTFPath = function( ttfPath, format, useZopfli ) {
	var fontPath = parsePath( ttfPath );
	var outputFilename = fontPath.name + "-subset" + ( useZopfli ? ".zopfli" : "" ) + ( format ? "." + format : fontPath.ext );
	return outputFilename;
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
	var outputFilename = this.getFilenameFromTTFPath( inputFile, format, useZopfli );
	var outputFullPath = path.join( parsePath( inputFile ).dir, outputFilename );
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