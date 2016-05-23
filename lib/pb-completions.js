'use babel';
'use strict';
/* jshint node: true */
/* jshint esversion: 6 */
/* global localStorage, console, atom, module */

// TODO: Resource IDs
// TODO: #ifdef macros

// Some of this files' contents are based on atom/autocomplete-css.
// See https://github.com/atom/autocomplete-css.

import PbCompletionsProvider from './provider';

let provider = new PbCompletionsProvider();

export function provide() {
    return provider;
}

export const config = {
    headerpaths: {
        title: 'Header Paths',
        type: 'string',
        default: "{{{LIB}}}/default.h{{{AND}}}" +

            "{{{INCLUDE}}}/pebble.h{{{AND}}}" +

            "{{{INCLUDE}}}/pebble_worker.h{{{AND}}}" +

            "{{{INCLUDE}}}/pebble_fonts.h{{{AND}}}" +

            "{{{INCLUDE}}}/gcolor_definitions.h{{{AND}}}" +

            "{{{LIB}}}/unsupported.h",
        description:
            "{{{AND}}}, {{{INCLUDE}}}, and {{{HOME}}} are replaced.\n\n" +
            "After changing this, either run `pb-completions:force-reload` " +
            "or restart atom via window:reload (`cmd-alt-ctrl-l` on mac)"
    },
    ignoreditems: {
        title: 'Ignored Items',
        type: 'string',
        default: '[{"type": ["define"], "regex": "GColor.*ARGB8"}]',
        description: "Input a JSON array containing objects:.\n\n" +
            "type: array of types this applies to (define/function/enum).\n\n" +
            "regex: what the line is matched to.\n\n" +
            "fnregex: what the filename is matched to.\n\n" +
            "ALL characteristics (type, regex, fnregex) must match for the " +
                "line to be ignored."
    }
};
var defaultPath = config.headerpaths.default;
var defaultIgnored = config.ignoreditems.default;



atom.menu.add([
    {
        label: 'Packages',
        submenu: [{
            label: 'Pb-Completions',
            submenu: [{
                label: 'Reload All Completions',
                command: 'pb-completions:force-reload'
            },
            {
                label: 'Reload All Completions (including Documentation)',
                command: 'force-reload-(including-documentation)'
            }]
        }]
    }
]);
    // Add the the reloading menu item


function getHeaderPaths() {
    if (atom.config.get('pb-completions.headerpaths') === undefined) {
        // I'm not sure why this is necessary.
        // I just know that for some reason, it is.
        // It's a HACK, I guess.
        return defaultPath;
    }
    return atom.config.get('pb-completions.headerpaths');
}
function getIgnores() {
    if (atom.config.get('pb-completions.ignoreditems') === undefined) {
        // I'm not sure why this is necessary.
        // I just know that for some reason, it is.
        // It's a HACK, I guess.
        return JSON.parse(defaultIgnored);
    }
    return JSON.parse(atom.config.get('pb-completions.ignoreditems'));
}

atom.commands.add('atom-workspace', 'pb-completions:force-reload', function() {
    provider.init(getHeaderPaths(), getIgnores());
    provider.forceReload();
});

atom.commands.add('atom-workspace', 'pb-completions:force-reload-(including-documentation)', function() {
    provider.init(getHeaderPaths(), getIgnores());
    provider.discardHeadersAndForceReload();
});
    // Add the the reloading command

function reinitProvider() {
    provider.init(getHeaderPaths(), getIgnores());
    provider.maybeReload();
}

atom.config.onDidChange('pb-completions.headerpaths', reinitProvider);
atom.config.onDidChange('pb-completions.ignoreditems', reinitProvider);
reinitProvider();
