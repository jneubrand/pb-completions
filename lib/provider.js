'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module */
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import color_provider from './color-provider';

var colorProvider = new color_provider.PbColorProvider();
var packageInfo = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json')));

localStorage.suggestions = localStorage.suggestions || JSON.stringify([]);
localStorage.hashes = localStorage.hashes || JSON.stringify([]);
localStorage.lastVersion = localStorage.lastVersion || packageInfo.version;

// Useful for debugging:
// localStorage.suggestions = JSON.stringify([]);
// localStorage.hashes = JSON.stringify([]);

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
    suggestionPriority: 3, // Because autocomplete-snippets likes printf
    excludeLowerPriority: false,

    getSuggestions(obj) {
        let prefix = obj.prefix;
        return new Promise(function(resolve) {
            let data = JSON.parse(localStorage.suggestions);
            let possible = [];
            for (let k_itemList in data) {
                let itemList = data[k_itemList];
                for (let k_item in itemList) {
                    let item = itemList[k_item];
                    if ((item.displayText || item.text)
                            .toLowerCase()
                            .indexOf(prefix.toLowerCase()) != -1) {
                        possible.push(JSON.parse(JSON.stringify(item)));
                    }
                }
            }
            // console.log(possible);
            return resolve(possible);
        });
    },

    snippetize(str) {
        if (str === undefined)
            return '';
        let tmp = str.substr(1, str.length - 2);
        tmp = tmp.replace(/[\s\n]+/g, ' ');
        tmp = tmp.replace(/void/, '');
        let counter = 1;
        let args = tmp.split(',').map(x => x.trim());
        args = args.map(x => '${' + (counter++) + ':' + x + '}');
        // console.log('(' + args.join(', ') + ')');
        return '(' + args.join(', ') + ')';
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
                    out.push(options.callback(temp, parent_data));
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

    reloadSuggestions(fn, data) {
        let suggestions = [];
        module.exports.processData(fn, suggestions, data, {
            regex: ["^#define\\s+(\\w+)(\\(.+?\\))?", "gm"],
            callback: function(result) {
                let colorData = colorProvider.cssClassForString(result[1]);
                var out = {
                    'snippet': result[1] + module.exports.snippetize(result[2]),
                    'displayText': result[1],
                    'leftLabel': '#define',
                    'type': (result[2] === undefined ? 'constant' : 'function')
                };
                if (colorData == 'clear') {
                    out.leftLabel = undefined;
                    out.rightLabelHTML = '<span class="pb-swatch" '+
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
                } else if (colorData !== '') {
                    out.leftLabel = undefined;
                    out.rightLabelHTML = '<span class="pb-swatch" '+
                            'style="background-color:' + colorData + ';' +
                                   'display: inline-block;' +
                                   'vertical-align: middle;' +
                                   'height: 14px;' +
                                   'width: 14px;' +
                                   'border: 1px solid black;' +
                                   'border-radius: 50%;">&nbsp;</span>';
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
                console.log(result);
                return {
                    'snippet': result[2] + module.exports.snippetize(result[3]),
                    'displayText': result[2],
                    'leftLabel': result[1],
                    'type': 'function'
                };
            },
            type: 'function'
        });
        module.exports.processDataFromEnumeration(fn, suggestions, data, {
            // If you need help debugging this regex:
            //      Just replace // with /, then apply regexr. Good luck!
            enumerationregex: ["typedef\\s+enum\\s*{([\\s\\S]*?)}\\s*(.*);",
                               "gm"],
            parentDataCallback: function(data) {
                return data[2];
            },
            regex: ["^\\s*(\\w+)", "gm"],
            callback: function(result, parent_result) {
                return {
                    'text': result[1],
                    'leftLabel': parent_result,
                    'type': 'const'
                };
            },
            type: 'enum'
        });
        return suggestions;
    },

    reloadWarnSuggestions(fn, data) {
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
        console.log(suggestions);
        return suggestions;
    },

    reload() {
        atom.notifications.addInfo("Pb-Completions: Reloading headers.",
        {icon: 'ellipsis'});
        let suggestions = {},
            hashes = JSON.parse(localStorage.hashes);
        for (let headerLocKey in headerLocations) {
            let location = headerLocations[headerLocKey],
                data;
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
                if (location.includes('unsupported')) {
                    console.error(location);
                    suggestions[hash] =
                        module.exports.reloadWarnSuggestions(location, data);
                } else {
                    suggestions[hash] =
                        module.exports.reloadSuggestions(location, data);
                }
                hashes.push(hash);
            }
        }
        localStorage.hashes = JSON.stringify(hashes);
        localStorage.suggestions = JSON.stringify(suggestions);
        atom.notifications.addSuccess("Pb-Completions: Reloaded headers.",
        {icon: 'check', detail: 'Locations:\n' + headerLocations.join('\n')});
    },

    maybeReload() {
        let hashes = JSON.parse(localStorage.hashes);
        let requireReload = false;
        if (packageInfo.version != localStorage.lastVersion) {
            localStorage.lastVersion = packageInfo.version;
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
        localStorage.suggestions = JSON.stringify([]);
        localStorage.hashes = JSON.stringify([]);
        module.exports.reload();
        console.log('pb-completions: Reloaded.');
    }
};
