'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module */
import fs from 'fs';
import os from 'os';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import fuzzaldrin from 'fuzzaldrin';
import color_provider from './color-provider';

var colorProvider = new color_provider.PbColorProvider();
var packageInfo = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json')));

localStorage.PbCompletionsStoredItem_Suggestions = localStorage.PbCompletionsStoredItem_Suggestions || JSON.stringify([]);
localStorage.PbCompletionsStoredItem_Hashes = localStorage.PbCompletionsStoredItem_Hashes || JSON.stringify([]);
localStorage.PbCompletionsStoredItem_LastVersion = localStorage.PbCompletionsStoredItem_LastVersion || packageInfo.version;

localStorage.PbCompletionsStoredItem_NextFetch = localStorage.PbCompletionsStoredItem_NextFetch || 0;
localStorage.PbCompletionsStoredItem_Symbols = localStorage.PbCompletionsStoredItem_Symbols || JSON.stringify([]);

// Useful for debugging:
// localStorage.PbCompletionsStoredItem_Suggestions = JSON.stringify([]);
// localStorage.PbCompletionsStoredItem_Hashes = JSON.stringify([]);

var headerLocations = [];
var ignoredItems = [];

module.exports = {
    init(path, ignore) {
        headerLocations = path
                .replace(/\{\{\{HOME\}\}\}/g, os.homedir())
                .replace(/\{\{\{LIB\}\}\}/g, __dirname)
                .split("{{{AND}}}");
        ignoredItems = ignore;
    },
    selector: '.source.c, .source.h',
    disableForSelector: '.source.c .comment, .source.h .comment',
    inclusionPriority: 10,
    suggestionPriority: 1,
    excludeLowerPriority: false,

    getSuggestions(obj) {
        let prefix = obj.prefix,
            validPath = false,
            pathArr = obj.editor.getPath();
        if (pathArr !== undefined) {
            pathArr = pathArr.split(path.sep);
            for (var i = pathArr.length - 1; i > 1; i--) {
                let searchpath = pathArr.slice(0, i);
                searchpath.push('appinfo.json');
                searchpath = searchpath.join(path.sep);
                if (fs.existsSync(searchpath)) {
                    validPath = true;
                }
            }
        } else {
            return new Promise(function(resolve) {
                return resolve([]);
            });
        }
        if (validPath) {
            return new Promise(function(resolve) {
                let data = JSON.parse(localStorage.PbCompletionsStoredItem_Suggestions);
                let allItems = [];
                for (let k_itemList in data) {
                    allItems = allItems.concat(data[k_itemList]);
                }
                let possible = fuzzaldrin.filter(allItems, prefix,
                                                 {key: 'displayText'});
                return resolve(possible);
            });
        } else {
            return new Promise(function(resolve) {
                return resolve([]);
            });
        }
    },

    snippetize(str) {
        if (str === undefined)
            return '';
        let tmp = str.substr(1, str.length - 2);
        tmp = tmp.replace(/[\s\n]+/g, ' ');
        tmp = tmp.replace(/^void$/, '');
        if (tmp !== '') {
            let counter = 1;
            let args = tmp.split(',').map(x => x.trim());
            args = args.map(x => '${' + (counter++) + ':' + x + '}');
            // console.log('(' + args.join(', ') + ')');
            return '(' + args.join(', ') + ')';
        } else {
            return '()${1:}';
        }
    },

    listify(str) {
        if (str === undefined)
            return [];
        let tmp = str.substr(1, str.length - 2);
        let args = tmp.split(',').map(x => x.trim());
        return args;
    },

    processData(fn, out, data, options, parent_data) {
        if (!('regex' in options) ||
            !('callback' in options) ||
            !('type' in options)) {
            console.log(options);
            throw "Some options missing from (regex/callback/type)";
        }
        let regex = new RegExp(options.regex[0], options.regex[1]),
            matches = data.match(regex);
        for (var match in matches) {
            let regex2 = new RegExp(options.regex[0], options.regex[1]),
                temp = regex2.exec(matches[match]);
            if (temp !== null) {
                let ignore = false;
                for (let ignoredItem in ignoredItems) {
                    // Note: this section is extensively commented for
                    //      debugging purposes.
                    let ignoreWithThisRule = true,
                        igitem = ignoredItems[ignoredItem],
                        regex_ig_fn = new RegExp(igitem.fnregex, 'gm');
                    // If the type isn't fitting, can't match (ergo don't ignore)
                    if (igitem.type.indexOf(options.type) != -1) {
                        // Type is in the list.
                    } else {
                        ignoreWithThisRule = false;
                    }
                    // If the text regex doesn't match, don't ignore
                    // If it does match and ignoring until now; ignore.
                    // If regex is missing, don't alter state.
                    if (igitem.regex === undefined) {
                        // Test missing.
                    } else if (matches[match].match(new RegExp(igitem.regex,
                                                               'gm'))) {
                        // Matches.
                        // console.error("Matches ", matches[match]);
                    } else {
                        // Doesn't match.
                        ignoreWithThisRule = false;
                    }
                    // If the filename regex doesn't match, don't ignore
                    // If it does match and ignoring until now; ignore.
                    // If regex is missing, don't alter state.
                    if (igitem.fnregex === undefined) {
                        // Test missing.
                    } else if (fn.match(new RegExp(igitem.fnregex, 'gm'))) {
                        // Matches.
                        // console.error("Matches ", fn);
                    } else {
                        // Doesn't match.
                        ignoreWithThisRule = false;
                    }
                    ignore |= ignoreWithThisRule;
                }
                if (!ignore) {
                    let suggestion = options.callback(temp, parent_data);
                    if (suggestion !== null) {
                        out.push(suggestion);
                    }
                } else {
                    // console.error(temp, parent_data);
                }
            }
        }
    },
    processDataFromEnumeration(fn, out, data, options) {
        if (!('enumerationregex' in options) ||
            !('regex' in options) ||
            !('callback' in options) ||
            !('type' in options)) {
            console.log(options);
            throw "Some options missing from " +
                  "(enumerationregex/regex/callback/type)";
        }
        let enumerationregex = new RegExp(options.enumerationregex[0],
                                          options.enumerationregex[1]),
            matches = data.match(enumerationregex);
        for (let match in matches) {
            if ('parentDataCallback' in options) {
                enumerationregex = new RegExp(options.enumerationregex[0],
                                              options.enumerationregex[1]);
                let data = enumerationregex.exec(matches[match]);
                module.exports.processData(fn, out, matches[match], options,
                        options.parentDataCallback(data));
            } else {
                module.exports.processData(fn, out, matches[match], options);
            }
        }
    },

    applyDocsInfo(out, name, documentation) {
        let documentationItem = documentation
            .filter(x => x.name == name)
            [0];
        if (typeof documentationItem != 'undefined') {
            out.descriptionMoreURL = documentationItem ?
                'https://developer.getpebble.com' + documentationItem.url :
                undefined;
            if (out.description) {
                out.description += ' — ' + documentationItem.summary
                    .replace(/&lt;\/?.+?&gt;/g, '');
            } else {
                out.description = documentationItem.summary
                    .replace(/&lt;\/?.+?&gt;/g, '');
            }
        }
    },

    applyArgsInfo(out, argString, returns) {
        let args = module.exports.listify(argString),
            varLength = false;
        if (args.length == 1 && args[0] == 'void') {
            args = [];
        }
        if (argString && argString.indexOf('...') != -1) {
            args.pop();
            varLength = true;
        }
        if (args.length !== 0) {
            out.description = `Takes ${args.length}${varLength ? '+' : ''} ` +
                              `argument${args.length == 1 ? '' : 's'}; ` +
                              `returns ${returns}`;
        }
    },

    reloadSuggestions(fn, data, documentation) {
        let suggestions = [];
        module.exports.processData(fn, suggestions, data, {
            regex: ["^#define\\s+(\\w+)(\\(.+?\\))?", "gm"],
            callback: function(result) {
                let colorData = colorProvider.cssClassForString(result[1]);
                let out = {
                    'snippet': result[1] + module.exports.snippetize(result[2]),
                    'displayText': result[1],
                    'leftLabel': '#define',
                    'type': (result[2] === undefined ? 'constant' : 'function')
                };
                if (colorData == 'clear') {
                    out.leftLabel = undefined;
                    out.rightLabelHTML = '· <span class="pb-swatch" '+
                            'style="background-color: white;' +
                                   'background-image: linear-gradient(' +
                                        'to bottom right, white 45%, red 45%,' +
                                        'red 55%, white 55%);' +
                                   'display: inline-block;' +
                                   'vertical-align: middle;' +
                                   'height: 14px;' +
                                   'width: 14px;' +
                                   'border: 1px solid black;' +
                                   'border-radius: 50%;">&nbsp;</span>';
                    out.description = 'Transparent. See all the colors here: ';
                    out.descriptionMoreURL =
                        'https://developer.getpebble.com/more/color-picker/';
                } else if (colorData !== '') {
                    out.leftLabel = undefined;
                    out.rightLabelHTML = '· <span class="pb-swatch" '+
                            'style="background-color:' + colorData + ';' +
                                   'display: inline-block;' +
                                   'vertical-align: middle;' +
                                   'height: 14px;' +
                                   'width: 14px;' +
                                   'border: 1px solid black;' +
                                   'border-radius: 50%;">&nbsp;</span>';
                    out.description = colorData + '. See all the colors here: ';
                    out.descriptionMoreURL =
                        'https://developer.getpebble.com/more/color-picker/';
                } else {
                    module.exports.applyArgsInfo(out, result[2]);
                    module.exports.applyDocsInfo(out, result[1], documentation);
                }
                return out;
            },
            type: 'define'
        });
        module.exports.processData(fn, suggestions, data, {
            // If you need help debugging this regex:
            //      Just replace // with /, then apply regexr. Good luck!
            regex: ["^((?:const\\s?|struct\\s?)*\\s?\\w+\\*?)?\\s+\\*?" +
                    "\\s?(\\w+) ?(\\([^\\\\\\/\\(\\)]*\\));", "gm"],
            callback: function(result) {
                let out = {
                    'snippet': result[2] + module.exports.snippetize(result[3]),
                    'displayText': result[2],
                    'leftLabel': result[1],
                    'type': 'function'
                };
                module.exports.applyArgsInfo(out, result[3], result[1]);
                module.exports.applyDocsInfo(out, result[2], documentation);
                return out;
            },
            type: 'function'
        });
        module.exports.processDataFromEnumeration(fn, suggestions, data, {
            // If you need help debugging this regex:
            //      Just replace // with /, then apply regexr. Good luck!
            enumerationregex: ["typedef\\s+enum\\s*{([\\s\\S]*?)}\\s*(.*);",
                               "gm"],
            parentDataCallback: function(data) {
                // console.log(data);
                return data[2];
            },
            regex: ["^\\s*(\\w+)", "gm"],
            callback: function(result, parent_result) {
                if (result[1] == 'typedef') {
                    return null;
                }
                let out =  {
                    'text': result[1],
                    'displayText': result[1],
                    'leftLabel': parent_result,
                    'type': 'const',
                    'description': `Part of enum ${parent_result}`
                };
                module.exports.applyDocsInfo(out, result[1], documentation);
                return out;
            },
            type: 'enum'
        });
        return suggestions;
    },

    reloadWarnSuggestions(fn, data, documentation) {
        let suggestions = [];
        module.exports.processData(fn, suggestions, data, {
            regex: ["^#define\\s+(\\w+)(\\(.+?\\))?", "gm"],
            callback: function(result) {
                let colorData = colorProvider.cssClassForString(result[1]);
                var out = {
                    'snippet': '${1:-}',
                    'type': 'class', //because colors
                    'displayText': result[1],
                    'leftLabelHTML': '<span style="color: red;' +
                                     'text-shadow: 0 0 1px red;">Unsupported</span>',
                    'iconHTML': '<i class="icon-circle-slash"></i>'
                };
                return out;
            },
            type: 'define'
        });
        return suggestions;
    },

    reloadHeaders() {
        atom.notifications.addInfo('pb-completions: Reloading headers.',
        {icon: 'ellipsis'});
        let suggestions = {},
            hashes = JSON.parse(localStorage.PbCompletionsStoredItem_Hashes),
            documentation = JSON.parse(localStorage.PbCompletionsStoredItem_Symbols);
        for (let headerLocKey in headerLocations) {
            let location = headerLocations[headerLocKey],
                data;
            try {
                data = fs.readFileSync(location, 'utf8');
            } catch (e) {
                console.log(`pb-completions provider can't load file: ${e}`);
                atom.notifications.addWarning(
                    'pb-completions: Can\'t read header', {
                        dismissable: true,
                        detail: location
                    });
                continue;
            }
            let hash = crypto.createHash('sha256').update(data).digest('hex');
            if (hashes.indexOf(hash) < 0) {
                if (location.includes('unsupported')) {
                    suggestions[hash] =
                        module.exports.reloadWarnSuggestions(location, data, documentation);
                } else {
                    suggestions[hash] =
                        module.exports.reloadSuggestions(location, data, documentation);
                }
                hashes.push(hash);
            }
        }
        localStorage.PbCompletionsStoredItem_Hashes = JSON.stringify(hashes);
        localStorage.PbCompletionsStoredItem_Suggestions = JSON.stringify(suggestions);
        atom.notifications.addSuccess('pb-completions: Reloaded headers.',
        {icon: 'check', detail: 'Locations:\n' + headerLocations.join('\n')});
    },

    reload(symbols=false) {
        if (symbols) {
            atom.notifications.addInfo('pb-completions: Fetching new symbols file', {});
            let req = https.request({
                hostname: 'developer.getpebble.com',
                path: '/docs/symbols.json',
                method: 'get'
            },
            (response) => {
                let str = '';
                response.on('data', (data) => {
                    str += data;
                });
                response.on('end', () => {
                    let data = JSON.parse(str);
                    data = data.filter((x) => x.language == 'c');
                    localStorage.PbCompletionsStoredItem_Symbols = JSON.stringify(data);
                    atom.notifications.addSuccess('pb-completions: Fetched new symbols file! Reloading...', {});
                    module.exports.reloadHeaders();
                });
            });
            req.on('error', (err) => {
                atom.notifications.addWarning('pb-completions: Failed fetching new symbols file! Reloading headers anyway...', {});
                localStorage.PbCompletionsStoredItem_NextFetch = 0;
                module.exports.reloadHeaders();
            });
            req.end();
        } else {
            module.exports.reloadHeaders();
        }
    },

    maybeReload() {
        let hashes = JSON.parse(localStorage.PbCompletionsStoredItem_Hashes);
        let requireReload = false;
        if (localStorage.PbCompletionsStoredItem_NextFetch < (new Date().getTime() / 1000)) {
            localStorage.PbCompletionsStoredItem_NextFetch = (new Date().getTime() / 1000) + 60*60*24*3;
            console.log('pb-completions: Docs are old. Reloading...');
            localStorage.PbCompletionsStoredItem_LastVersion = packageInfo.version;
            module.exports.reload(true);
            console.log('pb-completions: Reloaded.');
            return;
        } else if (packageInfo.version != localStorage.PbCompletionsStoredItem_LastVersion) {
            localStorage.PbCompletionsStoredItem_LastVersion = packageInfo.version;
            console.log('pb-completions: Version has changed. Reloading...');
            module.exports.reload();
            console.log('pb-completions: Reloaded.');
            return;
        }
        for (let headerLocKey in headerLocations) {
            let location = headerLocations[headerLocKey];
            let data;
            try {
                data = fs.readFileSync(location, 'utf8');
            } catch (e) {
                console.log('pb-completions provider can\'t load file: ' + e);
                atom.notifications.addWarning(
                    'pb-completions: Can\'t read header', {
                        dismissable: true,
                        detail: location
                    });
                continue;
            }
            let hash = crypto.createHash('sha256').update(data).digest('hex');
            if (hashes.indexOf(hash) < 0) {
                requireReload = true;
                continue;
            }
        }
        if (requireReload) {
            console.log('pb-completions: Files have changed. Reloading...');
            module.exports.reload();
            console.log('pb-completions: Reloaded.');
        }
    },

    forceReload() {
        console.log('pb-completions: Reloading...');
        localStorage.PbCompletionsStoredItem_Suggestions = JSON.stringify([]);
        localStorage.PbCompletionsStoredItem_Hashes = JSON.stringify([]);
        module.exports.reload();
        console.log('pb-completions: Reloaded.');
    },

    discardHeadersAndForceReload() {
        console.log('pb-completions: Purged documentation data. Reloading all...');
        localStorage.PbCompletionsStoredItem_Suggestions = JSON.stringify([]);
        localStorage.PbCompletionsStoredItem_Hashes = JSON.stringify([]);
        module.exports.reload(true);
        console.log('pb-completions: Reloaded.');
    }
};
