var CharacterSet = require( "characterset" );

class GlyphHangerWhitelist {

	constructor( chars, presets ) {
		presets = presets || {};

		var cs = new CharacterSet();

		if( presets.US_ASCII ) {
			cs = cs.union( CharacterSet.parseUnicodeRange("U+20-7E") );
		}

		if( presets.LATIN ) {
			cs = cs.union( CharacterSet.parseUnicodeRange("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" ));
		}

		if( typeof chars === "string" ) {
			if( chars && chars.match( GlyphHangerWhitelist.unicodeCodePointsRegex ) ) {
				cs = cs.union( CharacterSet.parseUnicodeRange( chars ) );
			} else if( chars ) {
				cs = cs.union( new CharacterSet( chars ) );
			}
		}

		this.whitelist = cs;
	}

	static get unicodeCodePointsRegex() {
		return /(U\+[\dABCDEF]+\-?[\dABCDEF]*),?/gi
	}

	isEmpty() {
		return this.whitelist.isEmpty();
	}

	getUniversalRangeAsUnicodes() {
		return CharacterSet.parseUnicodeRange( "U+0-10FFFF" ).toHexRangeString();
	}

	getCharacterSet() {
		return this.whitelist;
	}

	getWhitelist() {
		return this.whitelist.toString();
	}

	getWhitelistAsUnicodes() {
		return this.whitelist.toHexRangeString();
	}
}


module.exports = GlyphHangerWhitelist;