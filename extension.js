import St from 'gi://St';
import Soup from 'gi://Soup';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { BingDownload } from './providers/bing.js'

const SCHEMA_ID = 'org.gnome.shell.extensions.podwallpaper';
const IndicatorName = 'PODWallpaperIndicator';

const PODWallpaperIndicator =  GObject.registerClass({
    GTypeName: IndicatorName,
}, class POWWallpaperIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, IndicatorName);
        this.extension = extension;
        this._settings = this.extension.getSettings();
        
        this._setupIcon();

        this._buildMenu();
        this._bindSettings();

        // Register self to GNOME topbar panel
        const position = this._settings.get_int('indicator-position');
        Main.panel.addToStatusArea(this.extension.uuid, this, position, 'right');
    }

    _setupIcon() {
        const iconFile = Gio.File.new_for_path(`${this.extension.path}/icons/photos-symbolic.svg`);
        const gicon = Gio.FileIcon.new(iconFile);

        this.indicatorIcon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon',
        });

        this.add_child(this.indicatorIcon);

        this.visible = !this._settings.get_boolean('hide-indicator'); // set initial state
        this._settings.connect('changed::hide-indicator', () => {
            this.visible = !this._settings.get_boolean('hide-indicator');
        });

    }

    _buildMenu() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh Wallpaper'));
        refreshItem.connect('activate', () => {
            this._fetchNewWallpaper().catch(err => {
                console.error(`[PodWallpaper] Fetch failed: ${err.message}`);
                console.error(err.stack);
            });
        })
        this.menu.addMenuItem(refreshItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const autoSwitch = new PopupMenu.PopupSwitchMenuItem(_('Auto-Change Daily'), true);
        autoSwitch.connect('toggled', (item, state) => {
            console.log(`Auto-change active: ${state}`);
        });
        this.menu.addMenuItem(autoSwitch);

        const settingsItem = new PopupMenu.PopupMenuItem(_('Settings'));
        settingsItem.connect('activate', () => {
            this.extension.openPreferences();
        });
        this.menu.addMenuItem(settingsItem);
    }

    _bindSettings() {
        this._settingsHandler = this._settings.connect(
            'changed::indicator-position',
            () => this._updatePosition()
        );
    }

    _updatePosition() {
        const position = this._settings.get_int('indicator-position');
        const parent = this.container.get_parent();

        // Reposition child container dynamically without re-creating the indicator
        if (parent && typeof parent.set_child_at_index === 'function') {
            parent.set_child_at_index(this.container, position);
        }
    }

    async _fetchNewWallpaper() {
        let provider = this._settings.get_string('pod-website');
        switch (provider) {
            case 'astronomy':
                break;

            case 'bing':
                const xmlUrl = 'https://www.bing.com/HPImageArchive.aspx?format=xml&idx=0&n=1';
                const filePath = await BingDownload(xmlUrl, this._settings.get_string('background-position'));
                console.log(`[podwallpaper] Successfully saved to: ${filePath}`);
                return filePath;

            case 'guardian':
                break;

            case 'nasa':
                break;

            case 'national-geographic':
                break;

            case 'tumblr':
                break;

            case 'wikiart':
                break;

            case 'wikipedia':
                break;
        
            default:
                break;
        }
    }

    destroy() {
        // Disconnect settings listener on tear-down to prevent memory leaks
        if (this._settingsHandler) {
            this._settings.disconnect(this._settingsHandler);
            this._settingsHandler = null;
        }

        this._settings = null;
        super.destroy();
    }
});

export default class PodWallpaperExtension extends Extension {
    enable() {
        this._settings = this.getSettings(SCHEMA_ID);

        this._indicator = new PODWallpaperIndicator(this);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}