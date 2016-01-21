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
        description: "Default is `" + defaultPath +
            "`. {{{AND}}} and {{{HOME}}} are replaced. You'll need to change " +
            "this to something else on linux; try `pebble sdk include-path " +
            "[aplite/basalt/chalk]`\n\nReopen the window (try )",
        order: 1
    }
}

atom.commands.add('atom-workspace', 'pb-completions:force-reload', provider.forceReload);

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

if (atom.config.get('pb-completions.headerpaths') === undefined) {
    // I'm not sure why this is necessary.
    // I just know that for some reason, it is.
    // HACK
    atom.config.set('pb-completions.headerpaths', defaultPath)
}
import provider from './provider';
provider.init(defaultPath);
provider.maybeReload();
