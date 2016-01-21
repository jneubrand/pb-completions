'use babel';
'use strict';

// Some of this files' contents are based on atom/autocomplete-css.
// See https://github.com/atom/autocomplete-css.

var defaultPath = "{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/" +
    "current/sdk-core/pebble/aplite/include/pebble.h{{{AND}}}" +

    "{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/" +
    "current/sdk-core/pebble/aplite/include/pebble_worker.h{{{AND}}}" +

    "{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/" +
    "current/sdk-core/pebble/aplite/include/pebble_fonts.h";

export function provide() {
    return provider;
};
export const config = {
    headerpaths: {
        // title: "Header Paths (special: {{{HOME}}}; {{{AND}}})",
        // type: "string",
        // default: "{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/current/sdk-core/pebble/aplite/include/pebble.h{{{AND}}}{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/current/sdk-core/pebble/aplite/include/pebble_worker.h{{{AND}}}{{{HOME}}}/Library/Application Support/Pebble SDK/SDKs/current/sdk-core/pebble/aplite/include/pebble_fonts.h",
        // order: 1
        title: 'Header Paths',
        type: 'string',
        default: defaultPath,
        description: "Default is `" + defaultPath + "`.\n\n" +
            "{{{AND}}} and {{{HOME}}} are replaced.\n\n" +
            "You'll need to change this on linux: " +
            "try `pebble sdk include-path [aplite/basalt/chalk]`\n\n" +
            "After changing this, either run `pb-completions:force-reload` " +
            "or restart atom via window:reload (`cmd-alt-ctrl-l` on mac)",
        order: 1
    }
}

atom.commands.add('atom-workspace', 'pb-completions:force-reload',
                  provider.forceReload);
    // Add the the reloading command


atom.menu.add([
    {
        label: 'Packages',
        submenu: [{
            label: 'Pb-Completions',
            submenu: [{
                label: 'Reload All Completions',
                command: 'pb-completions:force-reload'
            }]
        }]
    }
]);
    // Add the the reloading menu item

if (atom.config.get('pb-completions.headerpaths') === undefined) {
    // I'm not sure why this is necessary.
    // I just know that for some reason, it is.
    // It's a HACK, I guess.
    atom.config.set('pb-completions.headerpaths', defaultPath)
}

import provider from './provider';
provider.init(atom.config.get('pb-completions.headerpaths'));
atom.config.observe('pb-completions.headerpaths', (x) => provider.init(x));
provider.maybeReload();
