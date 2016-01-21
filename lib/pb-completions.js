'use babel';
'use strict';
let provider = require('./provider');

// Some of this files' contents are based on atom/autocomplete-css.
// See https://github.com/atom/autocomplete-css.

module.exports = {
    provide() {
        return provider;
    }
}

provider.maybeReload();

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
