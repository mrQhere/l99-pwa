import ExifReader from 'exifreader';

/**
 * Extract EXIF metadata from an image file.
 * Runs entirely client-side — no server needed.
 *
 * @param {File|Blob} file - Image file
 * @returns {Promise<Object>} Parsed EXIF metadata
 */
export async function parseExif(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    const exif = tags.exif || {};
    const image = tags.file || {};

    return {
      camera: exif.Model?.description || 'Unknown',
      make: exif.Make?.description || 'Unknown',
      focalLength: exif.FocalLength?.description || null,
      aperture: exif.FNumber?.description || null,
      iso: exif.ISOSpeedRatings?.value || null,
      exposureTime: exif.ExposureTime?.description || null,
      flash: exif.Flash?.description || null,
      dateTime: exif.DateTimeOriginal?.description || exif.DateTime?.description || null,
      width: image['Image Width']?.value || null,
      height: image['Image Height']?.value || null,
      orientation: exif.Orientation?.value || 1,
      software: exif.Software?.description || null,
      gps: extractGPS(tags.gps),
      raw: exif,
    };
  } catch (err) {
    console.warn('EXIF extraction failed:', err.message);
    return {
      camera: 'Unknown',
      make: 'Unknown',
      focalLength: null,
      aperture: null,
      iso: null,
      exposureTime: null,
      flash: null,
      dateTime: null,
      width: null,
      height: null,
      orientation: 1,
      software: null,
      gps: null,
      raw: {},
    };
  }
}

function extractGPS(gps) {
  if (!gps || !gps.Latitude || !gps.Longitude) return null;
  return {
    latitude: gps.Latitude,
    longitude: gps.Longitude,
    altitude: gps.Altitude || null,
  };
}
