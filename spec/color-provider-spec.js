'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module, describe, it, expect */
import os from 'os';

let PbColorProvider = require(__dirname + '/../lib/color-provider.js').PbColorProvider;

describe('Color Provider', () => {
    describe('provider initialization', () => {
        let provider = new PbColorProvider();
        it('should initialize sanely', () => {
            expect(Object.keys(provider.colordata).length).toEqual(64);
        });
        it('should return correct color classes', () => {
            expect(provider.cssClassForString('GColorRed'))
                .toEqual('#FF0000');
            expect(provider.cssClassForString('GColorWhite'))
                .toEqual('#FFFFFF');
            expect(provider.cssClassForString('GColorBlue'))
                .toEqual('#0000FF');
        });
        it('should return clear when applicable', () => {
            expect(provider.cssClassForString('GColorClear'))
                .toEqual('clear');
        });
        it('should ignore ARGB8', () => {
            expect(provider.cssClassForString('GColorRed'))
                .toEqual(provider.cssClassForString('GColorRedARGB8'));
            expect(provider.cssClassForString('GColorWhite'))
                .toEqual(provider.cssClassForString('GColorWhiteARGB8'));
            expect(provider.cssClassForString('GColorBlue'))
                .toEqual(provider.cssClassForString('GColorBlueARGB8'));
            expect(provider.cssClassForString('GColorClear'))
                .toEqual(provider.cssClassForString('GColorClearARGB8'));
        });
    });
});
