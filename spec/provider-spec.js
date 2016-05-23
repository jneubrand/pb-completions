'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module, describe, it, expect */
import os from 'os';
import child_process from 'child_process';

let PbCompletionsProvider = require(__dirname + '/../lib/provider.js');

describe('Provider', () => {
    describe('provider initialization', () => {
        it('should replace directory shorthands correctly', () => {
            let provider = new PbCompletionsProvider();
            provider.init('{{{HOME}}}/*home*{{{AND}}}{{{LIB}}}/*lib*{{{AND}}}*bare*{{{AND}}}{{{INCLUDE}}}/*include*');
            expect(provider.headerLocations).toEqual(
                [
                    os.homedir() + '/*home*',
                    __dirname.split('/').slice(0,-1).join('/') + '/lib/*lib*',
                    '*bare*',
                    child_process.spawnSync('pebble',
                        ['sdk', 'include-path', 'aplite'])
                        .output[1].toString('utf-8').replace('\n', '') +
                        '/*include*'
                ]
            );
        });
        it('should set ignored items correctly', () => {
            let provider = new PbCompletionsProvider();
            provider.init('', ['foo', 'bar']);
            expect(provider.ignoredItems).toEqual(['foo', 'bar']);
        });
    });
    describe('helper functions', () => {
        let proto = PbCompletionsProvider.prototype;
        it('should snippetize correctly', () => {
            expect(proto.snippetize('()'))
                .toEqual('()${1:}');
            expect(proto.snippetize('(a, b, c)'))
                .toEqual('(${1:a}, ${2:b}, ${3:c})');
            expect(proto.snippetize('(a, b, c, ...)'))
                .toEqual('(${1:a}, ${2:b}, ${3:c}, ${4:...})');
            expect(proto.snippetize('(a, b, c, ...})'))
                .toEqual('(${1:a}, ${2:b}, ${3:c}, ${4:...\\}})');
        });
        it('should listify correctly', () => {
            expect(proto.listify('()'))
                .toEqual([]);
            expect(proto.listify('(a, b, c)'))
                .toEqual(['a', 'b', 'c']);
            expect(proto.listify('(a, b, c, ...)'))
                .toEqual(['a', 'b', 'c', '...']);
        });
        it('should applyArgsInfo correctly', () => {
            let item = {};

            proto.applyArgsInfo(item, '()', 'w');
            expect(item.description).toEqual('Returns w');

            proto.applyArgsInfo(item, '(...)', 'x');
            expect(item.description).toEqual('Takes 0+ arguments; returns x');

            proto.applyArgsInfo(item, '(a, b, c)', 'y');
            expect(item.description).toEqual('Takes 3 arguments; returns y');

            proto.applyArgsInfo(item, '(a, b, c, ...)', 'z');
            expect(item.description).toEqual('Takes 3+ arguments; returns z');
        });
    });
    describe('data processing', () => {
        it('should processData correctly', () => {
            let out = [],
                provider = new PbCompletionsProvider(),
                data = 'a\nb\nc';
            provider.processData('', out, data, {
                // If you need help debugging this regex:
                //      Just replace // with /, then apply regexr. Good luck!
                regex: ['.+', 'gm'],
                callback: function(result) {
                    let out = result[0];
                    return out;
                },
                type: 'function'
            });
            expect(out).toEqual(['a', 'b', 'c']);
        });
        it('should processDataFromEnumeration correctly', () => {
            let out = [],
                provider = new PbCompletionsProvider(),
                data = '!1{a\nb\nc}!2{d\ne\nf}';
            provider.processDataFromEnumeration('', out, data, {
                enumerationregex: ['!([\\S\\s])\\{([\\S\\s]+?)\\}', 'gm'],
                parentDataCallback: (data) => {
                    console.log(data);
                    console.log([data[2], data[1]]);
                    return [data[2], data[1]];
                },
                regex: ['[a-z]', 'gm'],
                callback: function(result, parent_result) {
                    console.error(result);
                    return result[0];
                },
                type: 'function'
            });
            expect(out).toEqual(['1', 'a', 'b', 'c',
                                 '2', 'd', 'e', 'f']);
        });
    });
});
