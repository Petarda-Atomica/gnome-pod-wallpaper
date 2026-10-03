import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup?version=3.0';

// Promisify GJS async operations
Gio._promisify(Soup.Session.prototype, 'send_and_read_async', 'send_and_read_finish');
Gio._promisify(Gio.File.prototype, 'replace_contents_bytes_async', 'replace_contents_finish');

/**
 * Fetches an XML document, extracts root["images"]["image"]["url"], 
 * and downloads the image into ~/.cache/podwallpaper/bing.png.
 * 
 * @param {string} xmlUrl - The URL of the XML document.
 * @param {string} mode - The desktop image display mode.
 * @returns {Promise<string>} The local file path where the image was saved.
 */
export async function BingDownload(xmlUrl, mode) {
    // 1. Ensure target directory (~/.cache/podwallpaper) exists
    const cacheDir = GLib.get_user_cache_dir();
    const targetFolder = GLib.build_filenamev([cacheDir, 'podwallpaper']);
    GLib.mkdir_with_parents(targetFolder, 0o755);

    const session = new Soup.Session();

    // 2. HTTP GET request for XML
    const xmlMessage = Soup.Message.new('GET', xmlUrl);
    if (!xmlMessage) {
        throw new Error(`Invalid XML URL: ${xmlUrl}`);
    }
    xmlMessage.request_headers.append('User-Agent', 'Mozilla/5.0 (GNOME Shell Extension)');

    const xmlBytes = await session.send_and_read_async(
        xmlMessage,
        GLib.PRIORITY_DEFAULT,
        null
    );

    if (xmlMessage.get_status() !== Soup.Status.OK) {
        throw new Error(`XML fetch failed with status: ${xmlMessage.get_status()}`);
    }

    const xmlDecoder = new TextDecoder('utf-8');
    const xmlText = xmlDecoder.decode(xmlBytes.get_data());

    // 3. Extract <images><image><url>...</url> node content
    const urlMatch = xmlText.match(/<images>[\s\S]*?<image>[\s\S]*?<url>(.*?)<\/url>/i);
    if (!urlMatch || !urlMatch[1]) {
        throw new Error('Element root["images"]["image"]["url"] not found in XML response');
    }

    // Clean XML HTML entities
    const rawImageUrl = urlMatch[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Resolve relative image path without using `new URL()`
    let imageUrl = rawImageUrl;
    if (!rawImageUrl.startsWith('http://') && !rawImageUrl.startsWith('https://')) {
        imageUrl = rawImageUrl.startsWith('/')
            ? `https://www.bing.com${rawImageUrl}`
            : `https://www.bing.com/${rawImageUrl}`;
    }

    // 4. Download Image
    const imgMessage = Soup.Message.new('GET', imageUrl);
    if (!imgMessage) {
        throw new Error(`Invalid image URL: ${imageUrl}`);
    }
    imgMessage.request_headers.append('User-Agent', 'Mozilla/5.0 (GNOME Shell Extension)');

    const imgBytes = await session.send_and_read_async(
        imgMessage,
        GLib.PRIORITY_DEFAULT,
        null
    );

    if (imgMessage.get_status() !== Soup.Status.OK) {
        throw new Error(`Image download failed with status: ${imgMessage.get_status()}`);
    }

    // 5. Save file to disk as ~/.cache/podwallpaper/wallpaper.png
    const filePath = GLib.build_filenamev([targetFolder, 'wallpaper.png']);
    const destinationFile = Gio.File.new_for_path(filePath);

    await destinationFile.replace_contents_bytes_async(
        imgBytes,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
    );

    // 6. Set as background
    const bkg_settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.background' });
    const fileUri = filePath.startsWith('file://')
        ? filePath
        : Gio.File.new_for_path(filePath).get_uri();
    bkg_settings.set_string('picture-uri', fileUri);
    bkg_settings.set_string('picture-uri-dark', fileUri);
    bkg_settings.set_string('picture-options', mode)

    return filePath;
}