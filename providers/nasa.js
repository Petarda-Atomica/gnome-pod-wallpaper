import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup?version=3.0';

// Promisify GJS async operations
Gio._promisify(Soup.Session.prototype, 'send_and_read_async', 'send_and_read_finish');
Gio._promisify(Gio.File.prototype, 'replace_contents_bytes_async', 'replace_contents_finish');

/**
 * Fetches NASA APOD JSON metadata, extracts the image URL,
 * and downloads the image into ~/.cache/podwallpaper/nasa.png.
 * 
 * @param {string} apiKey - API key for the NASA APOD API service.
 * @param {boolean} downloadYT - Wether to download YouTube thumbnail or not.
 * @returns {Promise<string>} The local file path where the image was saved.
 */
export async function NasaDownload(apiKey, downloadYT) {
    // 1. Ensure target directory (~/.cache/podwallpaper) exists
    const cacheDir = GLib.get_user_cache_dir();
    const targetFolder = GLib.build_filenamev([cacheDir, 'podwallpaper']);
    GLib.mkdir_with_parents(targetFolder, 0o755);

    const session = new Soup.Session();

    // 2. HTTP GET request
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length <= 3) {
        apiKey = 'DEMO_KEY';
    }
    const response = Soup.Message.new('GET', `https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=${apiKey}`);
    if (!response) {
        throw new Error("Invalid API link. Open an issue on Github.");
        
    }
    response.request_headers.append('User-Agent', 'Mozilla/5.0 (GNOME Shell Extension)');

    const jsonBytes = await session.send_and_read_async(
        response,
        GLib.PRIORITY_DEFAULT,
        null
    );

    if (response.get_status() !== Soup.Status.OK) {
        if(apiKey !== "DEMO_KEY") return NasaDownload("DEMO_KEY");
        else throw new Error("NASA APOD API unreacheable or exceeded DEMO_KEY limits.");
    }

    // 3. Extract image link
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(jsonBytes.get_data());
    const data = JSON.parse(jsonString);
    const item = Array.isArray(data) ? data[0] : data;
    let imageUrl = item?.hdurl;

    // 3.1. If it was a youtube video, download the thumbnail, if allowed
    if (!imageUrl) {
        if (!downloadYT) throw new Error("Settings don't allow the download of YouTube thumbnails. Aborted wallpaper change.");
        
        const fullVideoLink = item.basic_html.match(/src="(https:\/\/www\.youtube\.com\/watch[^"]+)"/)?.[1];
        const videoID = fullVideoLink.split('v=')[1];
        imageUrl = `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`;
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

    // 5. Save file to disk as ~/.cache/podwallpaper/nasa.png
    const filePath = GLib.build_filenamev([targetFolder, 'nasa.png']);
    const destinationFile = Gio.File.new_for_path(filePath);

    await destinationFile.replace_contents_bytes_async(
        imgBytes,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
    );

    console.log(`Saved file to ${filePath}`);
    return filePath;
}