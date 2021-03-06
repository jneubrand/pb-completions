'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module */

import fs from 'fs';
import path from 'path';

class PbColorProvider {
    constructor() {
        this.colordata = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, './color_definitions.json')));
    }
    cssClassForString(str) {
        str = str.replace(/ARGB8/, '');
        if (!str.includes('GColor')) {
            return '';
        }
        if (str in this.colordata) {
            return(this.colordata[str]);
        } else if (str.includes('GColorClear')) {
            return 'clear';
        }
        return '';
    }
}
module.exports.PbColorProvider = PbColorProvider;
