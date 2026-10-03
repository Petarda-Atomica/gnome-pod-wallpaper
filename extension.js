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

const SCHEMA_ID = 'org.gnome.shell.extensions.podwallpaper';
const IndicatorName = 'PODWallpaperIndicator';

const PODWallpaperIndicator =  GObject.registerClass({
    GTypeName: IndicatorName,
}, class POWWallpaperIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, IndicatorName);
        this.extension = extension;
        this._settings = this.extension.getSettings();

        const iconFile = Gio.File.new_for_path(`${this.extension.path}/icons/photos-symbolic.svg`);
        const gicon = Gio.FileIcon.new(iconFile);

        this.indicatorIcon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon',
        });

        this.add_child(this.indicatorIcon);
    }
});

export default class PodWallpaperExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._indicator = new PODWallpaperIndicator(this);
        let position = this._settings.get_int('indicator-position');
        Main.panel.addToStatusArea(this.uuid, this._indicator, position, 'right');
    }

    disable() {
        // this._indicator?.stop();
        this._indicator?.destroy();
        this._indicator = null;
    }
}