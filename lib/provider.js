'use babel';
'use strict';
const fs = require('fs'),
      path = require('path'),
      os = require('os'),
      crypto = require('crypto');

localStorage.suggestions = localStorage.suggestions || JSON.stringify([]);
localStorage.hashes = localStorage.hashes || JSON.stringify([]);

// Useful for debugging:
// localStorage.suggestions = JSON.stringify([]);
// localStorage.hashes = JSON.stringify([]);

var headerLocations = [];

module.exports = {
    init(defaultPath) {
        console.log(atom.config);
        console.log(atom.config.getAll());
        console.log(atom.config.get('pb-completions.headerpaths'));
        // headerLocations = atom.config.get('pb-completions.headerpaths')
        //         .replace(/\{\{\{HOME\}\}\}/g, os.homedir())
        //         .split("{{{AND}}}");
        headerLocations = defaultPath
                .replace(/\{\{\{HOME\}\}\}/g, os.homedir())
                .split("{{{AND}}}");
    },
    selector: '.source.c, .source.h',
    disableForSelector: '.source.c .comment, .source.h .comment',
    inclusionPriority: 100,
    excludeLowerPriority: false,

    getSuggestions(obj) {
        let prefix = obj.prefix;
        return new Promise(function(resolve) {
            let data = JSON.parse(localStorage.suggestions)
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

    reloadSuggestions(data) {
        let suggestions = [];

        let defines_regex = /^#define\s+(\w+)(\(.+?\))?/gm,
            define_matches = data.match(defines_regex);
        for (var define_match in define_matches) {
            let regex = /^#define\s+(\w+)(\(.+?\))?/gm;
            let temp = regex.exec(define_matches[define_match]);
            if (temp !== null) {
                suggestions.push({'snippet': temp[1] + module.exports.snippetize(temp[2]), 'displayText': temp[1], 'leftLabel': '#define', 'type': (temp[2] === undefined ? 'constant' : 'function')});
            }
        }

        let functions_regex = /^((?:const\s?|struct\s?)*\s?\w+\*?)?\s+\*?\s?(\w+)(\([^\\\/\(\)]*\));/gm;
        let function_matches = data.match(functions_regex);
        for (var functions_match in function_matches) {
            let regex = /^((?:const\s?|struct\s?)*\s?\w+\*?)?\s+\*?\s?(\w+)(\([^\\\/\(\)]*\));/gm;
            let temp = regex.exec(function_matches[functions_match]);
            if (temp !== null) {
                suggestions.push({'snippet': temp[2] + module.exports.snippetize(temp[3]), 'displayText': temp[2], 'leftLabel': temp[1], 'type': 'function'});
            }
        }

        let enums_regex = /typedef\s+enum\s*{([\s\S]*?)}\s*(.*);/gm;
        let enum_matches = data.match(enums_regex);
        for (let enums_match in enum_matches) {
            let enums_info_regex = /typedef\s+enum\s*{([\s\S]*?)}\s*(.*);/gm;
            let enum_info = enums_info_regex.exec(enum_matches[enums_match]);
            console.log(enum_info);
            let regex1 = /^\s*[^ \/\n(typedef)}].*/gm; // extract non-comment lines
            let matchedLines = enum_matches[enums_match].match(regex1);
            for (let line in matchedLines) {
                let regex2 = /^\s*(\w+)/gm;
                let temp = regex2.exec(matchedLines[line]);
                if (temp !== null) {
                    suggestions.push({'text': temp[1], 'leftLabel': enum_info[2], 'type': 'const'});
                }
            }
        }
        return suggestions;
    },

    reload() {
        atom.notifications.addInfo("Pb-Completions: Reloading headers.",
        {icon: 'ellipsis'});
        let suggestions = {},
            hashes = JSON.parse(localStorage.hashes);
        for (let headerLocKey in headerLocations) {
            let location = headerLocations[headerLocKey]
            let data = fs.readFileSync(location, 'utf8');
            let hash = crypto.createHash('sha256').update(data).digest('hex');
            if (hashes.indexOf(hash) < 0) {
                suggestions[hash] = module.exports.reloadSuggestions(data);
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
        for (let headerLocKey in headerLocations) {
            let location = headerLocations[headerLocKey]
            let data = fs.readFileSync(location, 'utf8');
            let hash = crypto.createHash('sha256').update(data).digest('hex');
            if (hashes.indexOf(hash) < 0) {
                requireReload = true;
                continue;
            }
        }
        if (requireReload) {
            console.log('pb-completions: Reloading...')
            module.exports.reload();
            console.log('pb-completions: Reloaded.')
        }
    },

    forceReload() {
        console.log('pb-completions: Reloading...')
        localStorage.suggestions = JSON.stringify([]);
        localStorage.hashes = JSON.stringify([]);
        module.exports.reload();
        console.log('pb-completions: Reloaded.')
    }
};
