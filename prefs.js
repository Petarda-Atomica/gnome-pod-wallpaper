import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PodWallpaperPreferences extends ExtensionPreferences {
    /**
     * Called automatically by GNOME when the preferences window is opened.
     * @param {Adw.PreferencesWindow} window
     */
    fillPreferencesWindow(window) {
        // Load the extension settings schema
        const settings = this.getSettings('org.gnome.shell.extensions.podwallpaper');

        //! Create a General Page
        const pageGeneral = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'applications-system-symbolic',
        });
        window.add(pageGeneral);

        //! Create Indicator Preferences Group
        const indicatorGroup = new Adw.PreferencesGroup({
            title: _('Indicator Settings'),
            description: _('Configure indicator placement on the top bar'),
        });
        pageGeneral.add(indicatorGroup);

        // Indicator visibility
        const hideIndicatorRow = new Adw.SwitchRow({
            title: _('Hide indicator'),
            subtitle: _('Hide the wallpaper icon on the top bar')
        });
        indicatorGroup.add(hideIndicatorRow);

        settings.bind(
            'hide-indicator',
            hideIndicatorRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        // Indicator position
        const positionRow = new Adw.SpinRow({
            title: _('Indicator Position'),
            subtitle: _('Order index on the right side of the panel'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 10,
                step_increment: 1,
            }),
        });
        indicatorGroup.add(positionRow);

        settings.bind(
            'indicator-position',
            positionRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        //! Create Picture Preferences Group
        const pictureGroup = new Adw.PreferencesGroup({
            title: _('Picture settings'),
            description: _('Configure how pictures are downloaded and displayed'),
        });
        pageGeneral.add(pictureGroup);

        // Picture provider
        const availableProviders = [
            { label: _("Astronomy"), value: "astronomy"},
            { label: _("Bing"), value: "bing"},
            { label: _("Guardian"), value: "guardian"},
            { label: _("NASA"), value: "nasa"},
            { label: _("National Geographic"), value: "national-geographic"},
            { label: _("Tumblr"), value: "tumblr"},
            { label: _("Wikiart"), value: "wikiart"},
            { label: _("Wikipedia"), value: "wikipedia"},
        ];
        const providerRow = new Adw.ComboRow({
            title: _("Picture provider"),
            subtitle: _("From who to get the picture of the day"),
            model: new Gtk.StringList({
                strings: availableProviders.map(opt => opt.label),
            }),
        });
        pictureGroup.add(providerRow);
        
        const providerInitialIndex = availableProviders.findIndex(opt => opt.value === settings.get_string('pod-website'));
        if (providerInitialIndex !== -1) {
            providerRow.selected = providerInitialIndex;
        }

        providerRow.connect('notify::selected', () => {
            const selectedValue = availableProviders[providerRow.selected].value;
            settings.set_string('pod-website', selectedValue);
        });

        // Background position
        const availableBkgMode = [
            { label: _("Centered"), value: "centered"},
            { label: _("Scaled"), value: "scaled"},
            { label: _("Spanned"), value: "spanned"},
            { label: _("Stretched"), value: "stretched"},
            { label: _("Wallpaper"), value: "wallpaper"},
            { label: _("Zoom"), value: "zoom"},
        ];
        const bkgModeRow = new Adw.ComboRow({
            title: _("Background position"),
            subtitle: _("How the backgorund is positioned"),
            model: new Gtk.StringList({
                strings: availableBkgMode.map(opt => opt.label),
            }),
        });
        pictureGroup.add(bkgModeRow);
        
        const bkgModeInitialIndex = availableBkgMode.findIndex(opt => opt.value === settings.get_string('background-position'));
        if (bkgModeInitialIndex !== -1) {
            bkgModeRow.selected = bkgModeInitialIndex;
        }

        bkgModeRow.connect('notify::selected', () => {
            const selectedValue = availableBkgMode[bkgModeRow.selected].value;
            settings.set_string('background-position', selectedValue);
        });

        // Metered download
        const meteredDownloadRow = new Adw.SwitchRow({
            title: _('Auto refresh on metered networks'),
            subtitle: _('Automatically refresh on metered networks')
        });
        pictureGroup.add(meteredDownloadRow);

        settings.bind(
            'refresh-on-metered',
            meteredDownloadRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        //! Create a Notifications Page
        const pageNotifications = new Adw.PreferencesPage({
            title: _('Notifications'),
            icon_name: 'mail-mark-notjunk-symbolic',
        });
        window.add(pageNotifications);

        //! Create Notifications Preferences Group
        const notificationsGroup = new Adw.PreferencesGroup({
            title: _('Notification Settings'),
            description: _('Configure how notifications appear and behave'),
        });
        pageNotifications.add(notificationsGroup);

        // Notification on new image
        const notificationOnNewRow = new Adw.SwitchRow({
            title: _('Notify when a new image is downloaded'),
            subtitle: _('A notification will appear with the explanation of the day')
        });
        notificationsGroup.add(notificationOnNewRow);

        settings.bind(
            'notification-new',
            notificationOnNewRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        // Notification - Transent
        const notificationTransientRow = new Adw.SwitchRow({
            title: _('Use transient notifications'),
            subtitle: _('Just hover with your mouse to dismiss it')
        });
        notificationsGroup.add(notificationTransientRow);

        settings.bind(
            'notification-transient',
            notificationTransientRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        //! Create a Misc Page
        const pageMisc = new Adw.PreferencesPage({
            title: _('Misc'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(pageMisc);

        //! Create Misc Preferences Group
        const miscGroup = new Adw.PreferencesGroup({
            title: _('Misc Settings'),
            description: _("Settings that didn't fit in any other category"),
        });
        pageMisc.add(miscGroup);

        // Download video thumbnails
        const downloadThumbnailRow = new Adw.SwitchRow({
            title: _('Download video thumbnails'),
            subtitle: _('If the requested image of the day is a video, donwload its thumbnail')
        });
        miscGroup.add(downloadThumbnailRow);

        settings.bind(
            'download-video-thumbnails',
            downloadThumbnailRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        //! Create a API keys Page
        const pageAPIs = new Adw.PreferencesPage({
            title: _('API Keys'),
            icon_name: 'dialog-password-symbolic',
        });
        window.add(pageAPIs);

        //! Create API Keys Preferences Group
        const apiGroup = new Adw.PreferencesGroup({
            title: _('API Keys'),
        });
        pageAPIs.add(apiGroup);

        // NASA Key
        const NASAKeyRow = new Adw.EntryRow({
            title: _("NASA API Key"),
        });
        apiGroup.add(NASAKeyRow);

        settings.bind(
            'nasa-api-key',
            NASAKeyRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT,
        );

        //! Create a About Page
        const pageAbout = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'starred-symbolic',
        });
        window.add(pageAbout);
        this._aboutPage(pageAbout);
    }

    _aboutPage(page) {
        // 1. Header Group (Extension Title, Version, and Icon)
        const headerGroup = new Adw.PreferencesGroup();
        page.add(headerGroup);

        const headerRow = new Adw.ActionRow({
            title: this.metadata.name,
            subtitle: `Version ${this.metadata.version || '1.0'}`,
        });

        headerRow.add_prefix(new Gtk.Image({
            icon_name: 'help-about-symbolic',
            pixel_size: 32,
        }));
        headerGroup.add(headerRow);

        // 2. Description Group (Pulls from metadata.json)
        if (this.metadata.description) {
            const descGroup = new Adw.PreferencesGroup({
                title: _('Description'),
            });
            descGroup.add(new Adw.ActionRow({
                title: this.metadata.description,
            }));
            page.add(descGroup);
        }

        // 3. External Links Group
        const linksGroup = new Adw.PreferencesGroup({
            title: _('Links & Support'),
        });
        page.add(linksGroup);

        // Helper to construct clickable URL rows
        const createLinkRow = (title, subtitle, url) => {
            const row = new Adw.ActionRow({
                title: title,
                subtitle: subtitle,
                activatable: true,
            });

            row.add_suffix(new Gtk.Image({
                icon_name: 'external-link-symbolic',
            }));

            row.connect('activated', () => {
                Gio.AppInfo.launch_default_for_uri(url, null);
            });

            return row;
        };

        // Homepage from metadata.json
        if (this.metadata.url) {
            linksGroup.add(createLinkRow(
                _('Project Homepage'),
                this.metadata.url,
                this.metadata.url
            ));
        }

        // Issue Tracker
        linksGroup.add(createLinkRow(
            _('Report an Issue'),
            _('Submit bug reports or feature requests'),
            'https://github.com/Petarda-Atomica/gnome-pod-wallpaper/issues'
        ));

        // 4. Credits & Legal Group
        const creditsGroup = new Adw.PreferencesGroup({
            title: _('Credits & Legal'),
        });
        page.add(creditsGroup);

        creditsGroup.add(new Adw.ActionRow({
            title: _('Developer'),
            subtitle: 'Petarda Atomica <petarda@tuta.io>',
        }));

        creditsGroup.add(new Adw.ActionRow({
            title: _('License'),
            subtitle: 'GPL-3.0 license',
        }));
    }
}