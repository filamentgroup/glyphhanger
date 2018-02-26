var CharacterSet = require( "characterset" );

class GlyphHangerWhitelist {

	constructor( chars, useUsAscii ) {
		var cs = new CharacterSet();
		
		if( useUsAscii ) {
			cs = cs.union( CharacterSet.parseUnicodeRange("U+20-7E") );
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