/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Geodesy representation conversion functions                        (c) Chris Veness 2002-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong.html                                                    */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-dms.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
/* eslint no-irregular-whitespace: [2, { skipComments: true }] */

/**
 * Latitude/longitude points may be represented as decimal degrees, or subdivided into sexagesimal
 * minutes and seconds.
 *
 * @module dms
 */

/**
 * Functions for parsing and representing degrees / minutes / seconds.
 * @class Dms
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var Dms = {};

// note Unicode Degree = U+00B0. Prime = U+2032, Double prime = U+2033


/**
 * Parses string representing degrees/minutes/seconds into numeric degrees.
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3° 37′ 09″W).
 * Seconds and minutes may be omitted.
 *
 * @param   {string|number} dmsStr - Degrees or deg/min/sec in variety of formats.
 * @returns {number} Degrees as decimal number.
 *
 * @example
 *     var lat = Dms.parseDMS('51° 28′ 40.12″ N');
 *     var lon = Dms.parseDMS('000° 00′ 05.31″ W');
 *     var p1 = new LatLon(lat, lon); // 51.4778°N, 000.0015°W
 */
Dms.parseDMS = function (dmsStr) {
  // check for signed decimal degrees without NSEW, if so return it directly
  if (typeof dmsStr == 'number' && isFinite(dmsStr)) return Number(dmsStr);

  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr).trim().replace(/^-/, '').replace(/[NSEW]$/i, '').split(/[^0-9.,]+/);
  if (dms[dms.length - 1] == '') dms.splice(dms.length - 1); // from trailing symbol

  if (dms == '') return NaN;

  // and convert to decimal degrees...
  var deg;
  switch (dms.length) {
    case 3:
      // interpret 3-part result as d/m/s
      deg = dms[0] / 1 + dms[1] / 60 + dms[2] / 3600;
      break;
    case 2:
      // interpret 2-part result as d/m
      deg = dms[0] / 1 + dms[1] / 60;
      break;
    case 1:
      // just d (possibly decimal) or non-separated dddmmss
      deg = dms[0];
      // check for fixed-width unseparated format eg 0033709W
      //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
      break;
    default:
      return NaN;
  }
  if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve

  return Number(deg);
};

/**
 * Separator character to be used to separate degrees, minutes, seconds, and cardinal directions.
 *
 * Set to '\u202f' (narrow no-break space) for improved formatting.
 *
 * @example
 *   var p = new LatLon(51.2, 0.33);  // 51°12′00.0″N, 000°19′48.0″E
 *   Dms.separator = '\u202f';        // narrow no-break space
 *   var pʹ = new LatLon(51.2, 0.33); // 51° 12′ 00.0″ N, 000° 19′ 48.0″ E
 */
Dms.separator = '';

/**
 * Converts decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added.
 *
 * @private
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Dms.toDMS = function (deg, format, dp) {
  if (isNaN(deg)) return null; // give up here if we can't make a number from deg

  // default values
  if (format === undefined) format = 'dms';
  if (dp === undefined) {
    switch (format) {
      case 'd':case 'deg':
        dp = 4;break;
      case 'dm':case 'deg+min':
        dp = 2;break;
      case 'dms':case 'deg+min+sec':
        dp = 0;break;
      default:
        format = 'dms';dp = 0; // be forgiving on invalid format
    }
  }

  deg = Math.abs(deg); // (unsigned result ready for appending compass dir'n)

  var dms, d, m, s;
  switch (format) {
    default: // invalid format spec!
    case 'd':case 'deg':
      d = deg.toFixed(dp); // round degrees
      if (d < 100) d = '0' + d; // pad with leading zeros
      if (d < 10) d = '0' + d;
      dms = d + '°';
      break;
    case 'dm':case 'deg+min':
      var min = (deg * 60).toFixed(dp); // convert degrees to minutes & round
      d = Math.floor(min / 60); // get component deg/min
      m = (min % 60).toFixed(dp); // pad with trailing zeros
      if (d < 100) d = '0' + d; // pad with leading zeros
      if (d < 10) d = '0' + d;
      if (m < 10) m = '0' + m;
      dms = d + '°' + Dms.separator + m + '′';
      break;
    case 'dms':case 'deg+min+sec':
      var sec = (deg * 3600).toFixed(dp); // convert degrees to seconds & round
      d = Math.floor(sec / 3600); // get component deg/min/sec
      m = Math.floor(sec / 60) % 60;
      s = (sec % 60).toFixed(dp); // pad with trailing zeros
      if (d < 100) d = '0' + d; // pad with leading zeros
      if (d < 10) d = '0' + d;
      if (m < 10) m = '0' + m;
      if (s < 10) s = '0' + s;
      dms = d + '°' + Dms.separator + m + '′' + Dms.separator + s + '″';
      break;
  }

  return dms;
};

/**
 * Converts numeric degrees to deg/min/sec latitude (2-digit degrees, suffixed with N/S).
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Dms.toLat = function (deg, format, dp) {
  var lat = Dms.toDMS(deg, format, dp);
  return lat === null ? '–' : lat.slice(1) + Dms.separator + (deg < 0 ? 'S' : 'N'); // knock off initial '0' for lat!
};

/**
 * Convert numeric degrees to deg/min/sec longitude (3-digit degrees, suffixed with E/W)
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Dms.toLon = function (deg, format, dp) {
  var lon = Dms.toDMS(deg, format, dp);
  return lon === null ? '–' : lon + Dms.separator + (deg < 0 ? 'W' : 'E');
};

/**
 * Converts numeric degrees to deg/min/sec as a bearing (0°..360°)
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms' for deg, deg+min, deg+min+sec.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Dms.toBrng = function (deg, format, dp) {
  deg = (Number(deg) + 360) % 360; // normalise -ve values to 180°..360°
  var brng = Dms.toDMS(deg, format, dp);
  return brng === null ? '–' : brng.replace('360', '0'); // just in case rounding took us up to 360°!
};

/**
 * Returns compass point (to given precision) for supplied bearing.
 *
 * @param   {number} bearing - Bearing in degrees from north.
 * @param   {number} [precision=3] - Precision (1:cardinal / 2:intercardinal / 3:secondary-intercardinal).
 * @returns {string} Compass point for supplied bearing.
 *
 * @example
 *   var point = Dms.compassPoint(24);    // point = 'NNE'
 *   var point = Dms.compassPoint(24, 1); // point = 'N'
 */
Dms.compassPoint = function (bearing, precision) {
  if (precision === undefined) precision = 3;
  // note precision = max length of compass point; it could be extended to 4 for quarter-winds
  // (eg NEbN), but I think they are little used

  bearing = (bearing % 360 + 360) % 360; // normalise to 0..360

  var point;

  switch (precision) {
    case 1:
      // 4 compass points
      switch (Math.round(bearing * 4 / 360) % 4) {
        case 0:
          point = 'N';break;
        case 1:
          point = 'E';break;
        case 2:
          point = 'S';break;
        case 3:
          point = 'W';break;
      }
      break;
    case 2:
      // 8 compass points
      switch (Math.round(bearing * 8 / 360) % 8) {
        case 0:
          point = 'N';break;
        case 1:
          point = 'NE';break;
        case 2:
          point = 'E';break;
        case 3:
          point = 'SE';break;
        case 4:
          point = 'S';break;
        case 5:
          point = 'SW';break;
        case 6:
          point = 'W';break;
        case 7:
          point = 'NW';break;
      }
      break;
    case 3:
      // 16 compass points
      switch (Math.round(bearing * 16 / 360) % 16) {
        case 0:
          point = 'N';break;
        case 1:
          point = 'NNE';break;
        case 2:
          point = 'NE';break;
        case 3:
          point = 'ENE';break;
        case 4:
          point = 'E';break;
        case 5:
          point = 'ESE';break;
        case 6:
          point = 'SE';break;
        case 7:
          point = 'SSE';break;
        case 8:
          point = 'S';break;
        case 9:
          point = 'SSW';break;
        case 10:
          point = 'SW';break;
        case 11:
          point = 'WSW';break;
        case 12:
          point = 'W';break;
        case 13:
          point = 'WNW';break;
        case 14:
          point = 'NW';break;
        case 15:
          point = 'NNW';break;
      }
      break;
    default:
      throw new RangeError('Precision must be between 1 and 3');
  }

  return point;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/** Polyfill String.trim for old browsers
 *  (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (String.prototype.trim === undefined) {
  String.prototype.trim = function () {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Dms; // ≡ export default Dms

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Geodesy tools for an ellipsoidal earth model                       (c) Chris Veness 2005-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong-convert-coords.html                                     */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-latlon-ellipsoidal.html                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
if (typeof module != 'undefined' && module.exports) var Vector3d = require('./vector3d.js'); // ≡ import Vector3d from 'vector3d.js'
if (typeof module != 'undefined' && module.exports) var Dms = require('./dms.js'); // ≡ import Dms from 'dms.js'


/**
 * Library of geodesy functions for operations on an ellipsoidal earth model.
 *
 * Includes ellipsoid parameters and datums for different coordinate systems, and methods for
 * converting between them and to cartesian coordinates.
 *
 * q.v. Ordnance Survey ‘A guide to coordinate systems in Great Britain’ Section 6
 * www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf.
 *
 * @module   latlon-ellipsoidal
 * @requires dms
 */

/**
 * Creates lat/lon (polar) point with latitude & longitude values, on a specified datum.
 *
 * @constructor
 * @param {number}       lat - Geodetic latitude in degrees.
 * @param {number}       lon - Longitude in degrees.
 * @param {LatLon.datum} [datum=WGS84] - Datum this point is defined within.
 *
 * @example
 *     var p1 = new LatLon(51.4778, -0.0016, LatLon.datum.WGS84);
 */
function LatLon(lat, lon, datum) {
  // allow instantiation without 'new'
  if (!(this instanceof LatLon)) return new LatLon(lat, lon, datum);

  if (datum === undefined) datum = LatLon.datum.WGS84;

  this.lat = Number(lat);
  this.lon = Number(lon);
  this.datum = datum;
}

/**
 * Ellipsoid parameters; major axis (a), minor axis (b), and flattening (f) for each ellipsoid.
 */
LatLon.ellipsoid = {
  WGS84: { a: 6378137, b: 6356752.31425, f: 1 / 298.257223563 },
  GRS80: { a: 6378137, b: 6356752.31414, f: 1 / 298.257222101 },
  Airy1830: { a: 6377563.396, b: 6356256.909, f: 1 / 299.3249646 },
  AiryModified: { a: 6377340.189, b: 6356034.448, f: 1 / 299.3249646 },
  Intl1924: { a: 6378388, b: 6356911.946, f: 1 / 297 },
  Bessel1841: { a: 6377397.155, b: 6356078.963, f: 1 / 299.152815351 }
};

/**
 * Datums; with associated ellipsoid, and Helmert transform parameters to convert from WGS 84 into
 * given datum.
 *
 * More are available from earth-info.nga.mil/GandG/coordsys/datums/NATO_DT.pdf,
 * www.fieldenmaps.info/cconv/web/cconv_params.js
 */
LatLon.datum = {
  /* eslint key-spacing: 0, comma-dangle: 0 */
  WGS84: {
    ellipsoid: LatLon.ellipsoid.WGS84,
    transform: { tx: 0.0, ty: 0.0, tz: 0.0, // m
      rx: 0.0, ry: 0.0, rz: 0.0, // sec
      s: 0.0 } // ppm
  },
  NAD83: { // (2009); functionally ≡ WGS84 - www.uvm.edu/giv/resources/WGS84_NAD83.pdf
    ellipsoid: LatLon.ellipsoid.GRS80,
    transform: { tx: 1.004, ty: -1.910, tz: -0.515, // m
      rx: 0.0267, ry: 0.00034, rz: 0.011, // sec
      s: -0.0015 } // ppm
  }, // note: if you *really* need to convert WGS84<->NAD83, you need more knowledge than this!
  OSGB36: { // www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf
    ellipsoid: LatLon.ellipsoid.Airy1830,
    transform: { tx: -446.448, ty: 125.157, tz: -542.060, // m
      rx: -0.1502, ry: -0.2470, rz: -0.8421, // sec
      s: 20.4894 } // ppm
  },
  ED50: { // www.gov.uk/guidance/oil-and-gas-petroleum-operations-notices#pon-4
    ellipsoid: LatLon.ellipsoid.Intl1924,
    transform: { tx: 89.5, ty: 93.8, tz: 123.1, // m
      rx: 0.0, ry: 0.0, rz: 0.156, // sec
      s: -1.2 } // ppm
  },
  Irl1975: { // osi.ie/OSI/media/OSI/Content/Publications/transformations_booklet.pdf
    ellipsoid: LatLon.ellipsoid.AiryModified,
    transform: { tx: -482.530, ty: 130.596, tz: -564.557, // m
      rx: -1.042, ry: -0.214, rz: -0.631, // sec
      s: -8.150 } // ppm
  }, // note: many sources have opposite sign to rotations - to be checked!
  TokyoJapan: { // www.geocachingtoolbox.com?page=datumEllipsoidDetails
    ellipsoid: LatLon.ellipsoid.Bessel1841,
    transform: { tx: 148, ty: -507, tz: -685, // m
      rx: 0, ry: 0, rz: 0, // sec
      s: 0 } // ppm
  }
};

/**
 * Converts ‘this’ lat/lon coordinate to new coordinate system.
 *
 * @param   {LatLon.datum} toDatum - Datum this coordinate is to be converted to.
 * @returns {LatLon} This point converted to new datum.
 *
 * @example
 *     var pWGS84 = new LatLon(51.4778, -0.0016, LatLon.datum.WGS84);
 *     var pOSGB = pWGS84.convertDatum(LatLon.datum.OSGB36); // 51.4773°N, 000.0000°E
 */
LatLon.prototype.convertDatum = function (toDatum) {
  var oldLatLon = this;
  var transform;

  if (oldLatLon.datum == LatLon.datum.WGS84) {
    // converting from WGS 84
    transform = toDatum.transform;
  }
  if (toDatum == LatLon.datum.WGS84) {
    // converting to WGS 84; use inverse transform (don't overwrite original!)
    transform = {};
    for (var param in oldLatLon.datum.transform) {
      if (oldLatLon.datum.transform.hasOwnProperty(param)) {
        transform[param] = -oldLatLon.datum.transform[param];
      }
    }
  }
  if (transform === undefined) {
    // neither this.datum nor toDatum are WGS84: convert this to WGS84 first
    oldLatLon = this.convertDatum(LatLon.datum.WGS84);
    transform = toDatum.transform;
  }

  var oldCartesian = oldLatLon.toCartesian(); // convert polar to cartesian...
  var newCartesian = oldCartesian.applyTransform(transform); // ...apply transform...
  var newLatLon = newCartesian.toLatLonE(toDatum); // ...and convert cartesian to polar

  return newLatLon;
};

/**
 * Converts ‘this’ point from (geodetic) latitude/longitude coordinates to (geocentric) cartesian
 * (x/y/z) coordinates.
 *
 * @returns {Vector3d} Vector pointing to lat/lon point, with x, y, z in metres from earth centre.
 */
LatLon.prototype.toCartesian = function () {
  var φ = this.lat.toRadians(),
      λ = this.lon.toRadians();
  var h = 0; // height above ellipsoid - not currently used
  var a = this.datum.ellipsoid.a,
      f = this.datum.ellipsoid.f;

  var sinφ = Math.sin(φ),
      cosφ = Math.cos(φ);
  var sinλ = Math.sin(λ),
      cosλ = Math.cos(λ);

  var eSq = 2 * f - f * f; // 1st eccentricity squared ≡ (a²-b²)/a²
  var ν = a / Math.sqrt(1 - eSq * sinφ * sinφ); // radius of curvature in prime vertical

  var x = (ν + h) * cosφ * cosλ;
  var y = (ν + h) * cosφ * sinλ;
  var z = (ν * (1 - eSq) + h) * sinφ;

  var point = new Vector3d(x, y, z);

  return point;
};

/**
 * Converts ‘this’ (geocentric) cartesian (x/y/z) point to (ellipsoidal geodetic) latitude/longitude
 * coordinates on specified datum.
 *
 * Uses Bowring’s (1985) formulation for μm precision in concise form.
 *
 * @param {LatLon.datum.transform} datum - Datum to use when converting point.
 */
Vector3d.prototype.toLatLonE = function (datum) {
  var x = this.x,
      y = this.y,
      z = this.z;
  var a = datum.ellipsoid.a,
      b = datum.ellipsoid.b,
      f = datum.ellipsoid.f;

  var e2 = 2 * f - f * f; // 1st eccentricity squared ≡ (a²-b²)/a²
  var ε2 = e2 / (1 - e2); // 2nd eccentricity squared ≡ (a²-b²)/b²
  var p = Math.sqrt(x * x + y * y); // distance from minor axis
  var R = Math.sqrt(p * p + z * z); // polar radius

  // parametric latitude (Bowring eqn 17, replacing tanβ = z·a / p·b)
  var tanβ = b * z / (a * p) * (1 + ε2 * b / R);
  var sinβ = tanβ / Math.sqrt(1 + tanβ * tanβ);
  var cosβ = sinβ / tanβ;

  // geodetic latitude (Bowring eqn 18: tanφ = z+ε²bsin³β / p−e²cos³β)
  var φ = isNaN(cosβ) ? 0 : Math.atan2(z + ε2 * b * sinβ * sinβ * sinβ, p - e2 * a * cosβ * cosβ * cosβ);

  // longitude
  var λ = Math.atan2(y, x);

  // height above ellipsoid (Bowring eqn 7) [not currently used]
  var sinφ = Math.sin(φ),
      cosφ = Math.cos(φ);
  var ν = a / Math.sqrt(1 - e2 * sinφ * sinφ); // length of the normal terminated by the minor axis
  var h = p * cosφ + z * sinφ - a * a / ν;

  var point = new LatLon(φ.toDegrees(), λ.toDegrees(), datum);

  return point;
};

/**
 * Applies Helmert transform to ‘this’ point using transform parameters t.
 *
 * @private
 * @param {LatLon.datum.transform} t - Transform to apply to this point.
 */
Vector3d.prototype.applyTransform = function (t) {
  var x1 = this.x,
      y1 = this.y,
      z1 = this.z;

  var tx = t.tx,
      ty = t.ty,
      tz = t.tz;
  var rx = (t.rx / 3600).toRadians(); // normalise seconds to radians
  var ry = (t.ry / 3600).toRadians(); // normalise seconds to radians
  var rz = (t.rz / 3600).toRadians(); // normalise seconds to radians
  var s1 = t.s / 1e6 + 1; // normalise ppm to (s+1)

  // apply transform
  var x2 = tx + x1 * s1 - y1 * rz + z1 * ry;
  var y2 = ty + x1 * rz + y1 * s1 - z1 * rx;
  var z2 = tz - x1 * ry + y1 * rx + z1 * s1;

  var point = new Vector3d(x2, y2, z2);

  return point;
};

/**
 * Returns a string representation of ‘this’ point, formatted as degrees, degrees+minutes, or
 * degrees+minutes+seconds.
 *
 * @param   {string} [format=dms] - Format point as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use - default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Comma-separated latitude/longitude.
 */
LatLon.prototype.toString = function (format, dp) {
  return Dms.toLat(this.lat, format, dp) + ', ' + Dms.toLon(this.lon, format, dp);
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/** Extend Number object with method to convert numeric degrees to radians */
if (Number.prototype.toRadians === undefined) {
  Number.prototype.toRadians = function () {
    return this * Math.PI / 180;
  };
}

/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (Number.prototype.toDegrees === undefined) {
  Number.prototype.toDegrees = function () {
    return this * 180 / Math.PI;
  };
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = LatLon, module.exports.Vector3d = Vector3d; // ≡ export { LatLon as default, Vector3d }

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Ordnance Survey Grid Reference functions                           (c) Chris Veness 2005-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/latlong-gridref.html                                            */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-osgridref.html                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';
if (typeof module != 'undefined' && module.exports) var LatLon = require('./latlon-ellipsoidal.js'); // ≡ import LatLon from 'latlon-ellipsoidal.js'


/**
 * Convert OS grid references to/from OSGB latitude/longitude points.
 *
 * Formulation implemented here due to Thomas, Redfearn, etc is as published by OS, but is inferior
 * to Krüger as used by e.g. Karney 2011.
 *
 * www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf.
 *
 * @module   osgridref
 * @requires latlon-ellipsoidal
 */
/*
 * Converted 2015 to work with WGS84 by default, OSGB36 as option;
 * www.ordnancesurvey.co.uk/blog/2014/12/confirmation-on-changes-to-latitude-and-longitude
 */

/**
 * Creates an OsGridRef object.
 *
 * @constructor
 * @param {number} easting - Easting in metres from OS false origin.
 * @param {number} northing - Northing in metres from OS false origin.
 *
 * @example
 *   var grid = new OsGridRef(651409, 313177);
 */
function OsGridRef(easting, northing) {
  // allow instantiation without 'new'
  if (!(this instanceof OsGridRef)) return new OsGridRef(easting, northing);

  this.easting = Number(easting);
  this.northing = Number(northing);
}

/**
 * Converts latitude/longitude to Ordnance Survey grid reference easting/northing coordinate.
 *
 * Note formulation implemented here due to Thomas, Redfearn, etc is as published by OS, but is
 * inferior to Krüger as used by e.g. Karney 2011.
 *
 * @param   {LatLon}    point - latitude/longitude.
 * @returns {OsGridRef} OS Grid Reference easting/northing.
 *
 * @example
 *   var p = new LatLon(52.65798, 1.71605);
 *   var grid = OsGridRef.latLonToOsGrid(p); // grid.toString(): TG 51409 13177
 *   // for conversion of (historical) OSGB36 latitude/longitude point:
 *   var p = new LatLon(52.65757, 1.71791, LatLon.datum.OSGB36);
 */
OsGridRef.latLonToOsGrid = function (point) {
  if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');

  // if necessary convert to OSGB36 first
  if (point.datum != LatLon.datum.OSGB36) point = point.convertDatum(LatLon.datum.OSGB36);

  var φ = point.lat.toRadians();
  var λ = point.lon.toRadians();

  var a = 6377563.396,
      b = 6356256.909; // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717; // NatGrid scale factor on central meridian
  var φ0 = 49 .toRadians(),
      λ0 = (-2).toRadians(); // NatGrid true origin is 49°N,2°W
  var N0 = -100000,
      E0 = 400000; // northing & easting of true origin, metres
  var e2 = 1 - b * b / (a * a); // eccentricity squared
  var n = (a - b) / (a + b),
      n2 = n * n,
      n3 = n * n * n; // n, n², n³

  var cosφ = Math.cos(φ),
      sinφ = Math.sin(φ);
  var ν = a * F0 / Math.sqrt(1 - e2 * sinφ * sinφ); // nu = transverse radius of curvature
  var ρ = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinφ * sinφ, 1.5); // rho = meridional radius of curvature
  var η2 = ν / ρ - 1; // eta = ?

  var Ma = (1 + n + 5 / 4 * n2 + 5 / 4 * n3) * (φ - φ0);
  var Mb = (3 * n + 3 * n * n + 21 / 8 * n3) * Math.sin(φ - φ0) * Math.cos(φ + φ0);
  var Mc = (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * (φ - φ0)) * Math.cos(2 * (φ + φ0));
  var Md = 35 / 24 * n3 * Math.sin(3 * (φ - φ0)) * Math.cos(3 * (φ + φ0));
  var M = b * F0 * (Ma - Mb + Mc - Md); // meridional arc

  var cos3φ = cosφ * cosφ * cosφ;
  var cos5φ = cos3φ * cosφ * cosφ;
  var tan2φ = Math.tan(φ) * Math.tan(φ);
  var tan4φ = tan2φ * tan2φ;

  var I = M + N0;
  var II = ν / 2 * sinφ * cosφ;
  var III = ν / 24 * sinφ * cos3φ * (5 - tan2φ + 9 * η2);
  var IIIA = ν / 720 * sinφ * cos5φ * (61 - 58 * tan2φ + tan4φ);
  var IV = ν * cosφ;
  var V = ν / 6 * cos3φ * (ν / ρ - tan2φ);
  var VI = ν / 120 * cos5φ * (5 - 18 * tan2φ + tan4φ + 14 * η2 - 58 * tan2φ * η2);

  var Δλ = λ - λ0;
  var Δλ2 = Δλ * Δλ,
      Δλ3 = Δλ2 * Δλ,
      Δλ4 = Δλ3 * Δλ,
      Δλ5 = Δλ4 * Δλ,
      Δλ6 = Δλ5 * Δλ;

  var N = I + II * Δλ2 + III * Δλ4 + IIIA * Δλ6;
  var E = E0 + IV * Δλ + V * Δλ3 + VI * Δλ5;

  N = Number(N.toFixed(3)); // round to mm precision
  E = Number(E.toFixed(3));

  return new OsGridRef(E, N); // gets truncated to SW corner of 1m grid square
};

/**
 * Converts Ordnance Survey grid reference easting/northing coordinate to latitude/longitude
 * (SW corner of grid square).
 *
 * Note formulation implemented here due to Thomas, Redfearn, etc is as published by OS, but is
 * inferior to Krüger as used by e.g. Karney 2011.
 *
 * @param   {OsGridRef}    gridref - Grid ref E/N to be converted to lat/long (SW corner of grid square).
 * @param   {LatLon.datum} [datum=WGS84] - Datum to convert grid reference into.
 * @returns {LatLon}       Latitude/longitude of supplied grid reference.
 *
 * @example
 *   var gridref = new OsGridRef(651409.903, 313177.270);
 *   var pWgs84 = OsGridRef.osGridToLatLon(gridref);                     // 52°39′28.723″N, 001°42′57.787″E
 *   // to obtain (historical) OSGB36 latitude/longitude point:
 *   var pOsgb = OsGridRef.osGridToLatLon(gridref, LatLon.datum.OSGB36); // 52°39′27.253″N, 001°43′04.518″E
 */
OsGridRef.osGridToLatLon = function (gridref, datum) {
  if (!(gridref instanceof OsGridRef)) throw new TypeError('gridref is not OsGridRef object');
  if (datum === undefined) datum = LatLon.datum.WGS84;

  var E = gridref.easting;
  var N = gridref.northing;

  var a = 6377563.396,
      b = 6356256.909; // Airy 1830 major & minor semi-axes
  var F0 = 0.9996012717; // NatGrid scale factor on central meridian
  var φ0 = 49 .toRadians(),
      λ0 = (-2).toRadians(); // NatGrid true origin is 49°N,2°W
  var N0 = -100000,
      E0 = 400000; // northing & easting of true origin, metres
  var e2 = 1 - b * b / (a * a); // eccentricity squared
  var n = (a - b) / (a + b),
      n2 = n * n,
      n3 = n * n * n; // n, n², n³

  var φ = φ0,
      M = 0;
  do {
    φ = (N - N0 - M) / (a * F0) + φ;

    var Ma = (1 + n + 5 / 4 * n2 + 5 / 4 * n3) * (φ - φ0);
    var Mb = (3 * n + 3 * n * n + 21 / 8 * n3) * Math.sin(φ - φ0) * Math.cos(φ + φ0);
    var Mc = (15 / 8 * n2 + 15 / 8 * n3) * Math.sin(2 * (φ - φ0)) * Math.cos(2 * (φ + φ0));
    var Md = 35 / 24 * n3 * Math.sin(3 * (φ - φ0)) * Math.cos(3 * (φ + φ0));
    M = b * F0 * (Ma - Mb + Mc - Md); // meridional arc
  } while (N - N0 - M >= 0.00001); // ie until < 0.01mm

  var cosφ = Math.cos(φ),
      sinφ = Math.sin(φ);
  var ν = a * F0 / Math.sqrt(1 - e2 * sinφ * sinφ); // nu = transverse radius of curvature
  var ρ = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinφ * sinφ, 1.5); // rho = meridional radius of curvature
  var η2 = ν / ρ - 1; // eta = ?

  var tanφ = Math.tan(φ);
  var tan2φ = tanφ * tanφ,
      tan4φ = tan2φ * tan2φ,
      tan6φ = tan4φ * tan2φ;
  var secφ = 1 / cosφ;
  var ν3 = ν * ν * ν,
      ν5 = ν3 * ν * ν,
      ν7 = ν5 * ν * ν;
  var VII = tanφ / (2 * ρ * ν);
  var VIII = tanφ / (24 * ρ * ν3) * (5 + 3 * tan2φ + η2 - 9 * tan2φ * η2);
  var IX = tanφ / (720 * ρ * ν5) * (61 + 90 * tan2φ + 45 * tan4φ);
  var X = secφ / ν;
  var XI = secφ / (6 * ν3) * (ν / ρ + 2 * tan2φ);
  var XII = secφ / (120 * ν5) * (5 + 28 * tan2φ + 24 * tan4φ);
  var XIIA = secφ / (5040 * ν7) * (61 + 662 * tan2φ + 1320 * tan4φ + 720 * tan6φ);

  var dE = E - E0,
      dE2 = dE * dE,
      dE3 = dE2 * dE,
      dE4 = dE2 * dE2,
      dE5 = dE3 * dE2,
      dE6 = dE4 * dE2,
      dE7 = dE5 * dE2;
  φ = φ - VII * dE2 + VIII * dE4 - IX * dE6;
  var λ = λ0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7;

  var point = new LatLon(φ.toDegrees(), λ.toDegrees(), LatLon.datum.OSGB36);
  if (datum != LatLon.datum.OSGB36) point = point.convertDatum(datum);

  return point;
};

/**
 * Parses grid reference to OsGridRef object.
 *
 * Accepts standard grid references (eg 'SU 387 148'), with or without whitespace separators, from
 * two-digit references up to 10-digit references (1m × 1m square), or fully numeric comma-separated
 * references in metres (eg '438700,114800').
 *
 * @param   {string}    gridref - Standard format OS grid reference.
 * @returns {OsGridRef} Numeric version of grid reference in metres from false origin (SW corner of
 *   supplied grid square).
 * @throws Error on Invalid grid reference.
 *
 * @example
 *   var grid = OsGridRef.parse('TG 51409 13177'); // grid: { easting: 651409, northing: 313177 }
 */
OsGridRef.parse = function (gridref) {
  gridref = String(gridref).trim();

  // check for fully numeric comma-separated gridref format
  var match = gridref.match(/^(\d+),\s*(\d+)$/);
  if (match) return new OsGridRef(match[1], match[2]);

  // validate format
  match = gridref.match(/^[A-Z]{2}\s*[0-9]+\s*[0-9]+$/i);
  if (!match) throw new Error('Invalid grid reference');

  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
  // shuffle down letters after 'I' since 'I' is not used in grid:
  if (l1 > 7) l1--;
  if (l2 > 7) l2--;

  // convert grid letters into 100km-square indexes from false origin (grid square SV):
  var e100km = (l1 - 2) % 5 * 5 + l2 % 5;
  var n100km = 19 - Math.floor(l1 / 5) * 5 - Math.floor(l2 / 5);

  // skip grid letters to get numeric (easting/northing) part of ref
  var en = gridref.slice(2).trim().split(/\s+/);
  // if e/n not whitespace separated, split half way
  if (en.length == 1) en = [en[0].slice(0, en[0].length / 2), en[0].slice(en[0].length / 2)];

  // validation
  if (e100km < 0 || e100km > 6 || n100km < 0 || n100km > 12) throw new Error('Invalid grid reference');
  if (en.length != 2) throw new Error('Invalid grid reference');
  if (en[0].length != en[1].length) throw new Error('Invalid grid reference');

  // standardise to 10-digit refs (metres)
  en[0] = (en[0] + '00000').slice(0, 5);
  en[1] = (en[1] + '00000').slice(0, 5);

  var e = e100km + en[0];
  var n = n100km + en[1];

  return new OsGridRef(e, n);
};

/**
 * Converts ‘this’ numeric grid reference to standard OS grid reference.
 *
 * @param   {number} [digits=10] - Precision of returned grid reference (10 digits = metres).
 * @returns {string} This grid reference in standard format.
 */
OsGridRef.prototype.toString = function (digits) {
  digits = digits === undefined ? 10 : Number(digits);
  if (isNaN(digits)) throw new Error('Invalid precision');

  var e = this.easting;
  var n = this.northing;
  if (isNaN(e) || isNaN(n)) throw new Error('Invalid grid reference');

  // use digits = 0 to return numeric format (in metres)
  if (digits == 0) return e.pad(6) + ',' + n.pad(6);

  // get the 100km-grid indices
  var e100k = Math.floor(e / 100000),
      n100k = Math.floor(n / 100000);

  if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) return '';

  // translate those into numeric equivalents of the grid letters
  var l1 = 19 - n100k - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
  var l2 = (19 - n100k) * 5 % 25 + e100k % 5;

  // compensate for skipped 'I' and build grid letter-pairs
  if (l1 > 7) l1++;
  if (l2 > 7) l2++;
  var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));

  // strip 100km-grid indices from easting & northing, and reduce precision
  e = Math.floor(e % 100000 / Math.pow(10, 5 - digits / 2));
  n = Math.floor(n % 100000 / Math.pow(10, 5 - digits / 2));

  var gridRef = letPair + ' ' + e.pad(digits / 2) + ' ' + n.pad(digits / 2);

  return gridRef;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/** Polyfill String.trim for old browsers
 *  (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (String.prototype.trim === undefined) {
  String.prototype.trim = function () {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };
}

/** Extend Number object with method to pad with leading zeros to make it w chars wide
 *  (q.v. stackoverflow.com/questions/2998784 */
if (Number.prototype.pad === undefined) {
  Number.prototype.pad = function (w) {
    var n = this.toString();
    while (n.length < w) {
      n = '0' + n;
    }return n;
  };
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = OsGridRef; // ≡ export default OsGridRef

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Vector handling functions                                          (c) Chris Veness 2011-2016  */
/*                                                                                   MIT Licence  */
/* www.movable-type.co.uk/scripts/geodesy/docs/module-vector3d.html                               */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

/**
 * Library of 3-d vector manipulation routines.
 *
 * In a geodesy context, these vectors may be used to represent:
 *  - n-vector representing a normal to point on Earth's surface
 *  - earth-centered, earth fixed vector (≡ Gade’s ‘p-vector’)
 *  - great circle normal to vector (on spherical earth model)
 *  - motion vector on Earth's surface
 *  - etc
 *
 * Functions return vectors as return results, so that operations can be chained.
 * @example var v = v1.cross(v2).dot(v3) // ≡ v1×v2⋅v3
 *
 * @module vector3d
 */

/**
 * Creates a 3-d vector.
 *
 * The vector may be normalised, or use x/y/z values for eg height relative to the sphere or
 * ellipsoid, distance from earth centre, etc.
 *
 * @constructor
 * @param {number} x - X component of vector.
 * @param {number} y - Y component of vector.
 * @param {number} z - Z component of vector.
 */
function Vector3d(x, y, z) {
  // allow instantiation without 'new'
  if (!(this instanceof Vector3d)) return new Vector3d(x, y, z);

  this.x = Number(x);
  this.y = Number(y);
  this.z = Number(z);
}

/**
 * Adds supplied vector to ‘this’ vector.
 *
 * @param   {Vector3d} v - Vector to be added to this vector.
 * @returns {Vector3d} Vector representing sum of this and v.
 */
Vector3d.prototype.plus = function (v) {
  if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object');

  return new Vector3d(this.x + v.x, this.y + v.y, this.z + v.z);
};

/**
 * Subtracts supplied vector from ‘this’ vector.
 *
 * @param   {Vector3d} v - Vector to be subtracted from this vector.
 * @returns {Vector3d} Vector representing difference between this and v.
 */
Vector3d.prototype.minus = function (v) {
  if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object');

  return new Vector3d(this.x - v.x, this.y - v.y, this.z - v.z);
};

/**
 * Multiplies ‘this’ vector by a scalar value.
 *
 * @param   {number}   x - Factor to multiply this vector by.
 * @returns {Vector3d} Vector scaled by x.
 */
Vector3d.prototype.times = function (x) {
  x = Number(x);

  return new Vector3d(this.x * x, this.y * x, this.z * x);
};

/**
 * Divides ‘this’ vector by a scalar value.
 *
 * @param   {number}   x - Factor to divide this vector by.
 * @returns {Vector3d} Vector divided by x.
 */
Vector3d.prototype.dividedBy = function (x) {
  x = Number(x);

  return new Vector3d(this.x / x, this.y / x, this.z / x);
};

/**
 * Multiplies ‘this’ vector by the supplied vector using dot (scalar) product.
 *
 * @param   {Vector3d} v - Vector to be dotted with this vector.
 * @returns {number} Dot product of ‘this’ and v.
 */
Vector3d.prototype.dot = function (v) {
  if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object');

  return this.x * v.x + this.y * v.y + this.z * v.z;
};

/**
 * Multiplies ‘this’ vector by the supplied vector using cross (vector) product.
 *
 * @param   {Vector3d} v - Vector to be crossed with this vector.
 * @returns {Vector3d} Cross product of ‘this’ and v.
 */
Vector3d.prototype.cross = function (v) {
  if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object');

  var x = this.y * v.z - this.z * v.y;
  var y = this.z * v.x - this.x * v.z;
  var z = this.x * v.y - this.y * v.x;

  return new Vector3d(x, y, z);
};

/**
 * Negates a vector to point in the opposite direction
 *
 * @returns {Vector3d} Negated vector.
 */
Vector3d.prototype.negate = function () {
  return new Vector3d(-this.x, -this.y, -this.z);
};

/**
 * Length (magnitude or norm) of ‘this’ vector
 *
 * @returns {number} Magnitude of this vector.
 */
Vector3d.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

/**
 * Normalizes a vector to its unit vector
 * – if the vector is already unit or is zero magnitude, this is a no-op.
 *
 * @returns {Vector3d} Normalised version of this vector.
 */
Vector3d.prototype.unit = function () {
  var norm = this.length();
  if (norm == 1) return this;
  if (norm == 0) return this;

  var x = this.x / norm;
  var y = this.y / norm;
  var z = this.z / norm;

  return new Vector3d(x, y, z);
};

/**
 * Calculates the angle between ‘this’ vector and supplied vector.
 *
 * @param   {Vector3d} v
 * @param   {Vector3d} [vSign] - If supplied (and out of plane of this and v), angle is signed +ve if
 *     this->v is clockwise looking along vSign, -ve in opposite direction (otherwise unsigned angle).
 * @returns {number} Angle (in radians) between this vector and supplied vector.
 */
Vector3d.prototype.angleTo = function (v, vSign) {
  if (!(v instanceof Vector3d)) throw new TypeError('v is not Vector3d object');

  var sinθ = this.cross(v).length();
  var cosθ = this.dot(v);

  if (vSign !== undefined) {
    if (!(vSign instanceof Vector3d)) throw new TypeError('vSign is not Vector3d object');
    // use vSign as reference to get sign of sinθ
    sinθ = this.cross(v).dot(vSign) < 0 ? -sinθ : sinθ;
  }

  return Math.atan2(sinθ, cosθ);
};

/**
 * Rotates ‘this’ point around an axis by a specified angle.
 *
 * @param   {Vector3d} axis - The axis being rotated around.
 * @param   {number}   theta - The angle of rotation (in radians).
 * @returns {Vector3d} The rotated point.
 */
Vector3d.prototype.rotateAround = function (axis, theta) {
  if (!(axis instanceof Vector3d)) throw new TypeError('axis is not Vector3d object');

  // en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
  // en.wikipedia.org/wiki/Quaternions_and_spatial_rotation#Quaternion-derived_rotation_matrix
  var p1 = this.unit();
  var p = [p1.x, p1.y, p1.z]; // the point being rotated
  var a = axis.unit(); // the axis being rotated around
  var s = Math.sin(theta);
  var c = Math.cos(theta);
  // quaternion-derived rotation matrix
  var q = [[a.x * a.x * (1 - c) + c, a.x * a.y * (1 - c) - a.z * s, a.x * a.z * (1 - c) + a.y * s], [a.y * a.x * (1 - c) + a.z * s, a.y * a.y * (1 - c) + c, a.y * a.z * (1 - c) - a.x * s], [a.z * a.x * (1 - c) - a.y * s, a.z * a.y * (1 - c) + a.x * s, a.z * a.z * (1 - c) + c]];
  // multiply q × p
  var qp = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      qp[i] += q[i][j] * p[j];
    }
  }
  var p2 = new Vector3d(qp[0], qp[1], qp[2]);
  return p2;
  // qv en.wikipedia.org/wiki/Rodrigues'_rotation_formula...
};

/**
 * String representation of vector.
 *
 * @param   {number} [precision=3] - Number of decimal places to be used.
 * @returns {string} Vector represented as [x,y,z].
 */
Vector3d.prototype.toString = function (precision) {
  var p = precision === undefined ? 3 : Number(precision);

  var str = '[' + this.x.toFixed(p) + ',' + this.y.toFixed(p) + ',' + this.z.toFixed(p) + ']';

  return str;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Vector3d; // ≡ export default Vector3d

(function (self) {
  'use strict';

  if (self.fetch) {
    return;
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function next() {
        var value = items.shift();
        return { done: value === undefined, value: value };
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function () {
        return iterator;
      };
    }

    return iterator;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var list = this.map[name];
    if (!list) {
      list = [];
      this.map[name] = list;
    }
    list.push(value);
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    var values = this.map[normalizeName(name)];
    return values ? values[0] : null;
  };

  Headers.prototype.getAll = function (name) {
    return this.map[normalizeName(name)] || [];
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)];
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function (name) {
      this.map[name].forEach(function (value) {
        callback.call(thisArg, value, name, this);
      }, this);
    }, this);
  };

  Headers.prototype.keys = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push(name);
    });
    return iteratorFor(items);
  };

  Headers.prototype.values = function () {
    var items = [];
    this.forEach(function (value) {
      items.push(value);
    });
    return iteratorFor(items);
  };

  Headers.prototype.entries = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items);
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    return fileReaderReady(reader);
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    reader.readAsText(blob);
    return fileReaderReady(reader);
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (!body) {
        this._bodyText = '';
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type');
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        return this.blob().then(readBlobAsArrayBuffer);
      };

      this.text = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob);
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text');
        } else {
          return Promise.resolve(this._bodyText);
        }
      };
    } else {
      this.text = function () {
        var rejected = consumed(this);
        return rejected ? rejected : Promise.resolve(this._bodyText);
      };
    }

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = input;
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this);
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function headers(xhr) {
    var head = new Headers();
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n');
    pairs.forEach(function (header) {
      var split = header.trim().split(':');
      var key = split.shift().trim();
      var value = split.join(':').trim();
      head.append(key, value);
    });
    return head;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText;
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      var request;
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var xhr = new XMLHttpRequest();

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL;
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL');
        }

        return;
      }

      xhr.onload = function () {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        };
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : undefined);

/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.0.2
 */

(function () {
  "use strict";

  function lib$es6$promise$utils$$objectOrFunction(x) {
    return typeof x === 'function' || (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' && x !== null;
  }

  function lib$es6$promise$utils$$isFunction(x) {
    return typeof x === 'function';
  }

  function lib$es6$promise$utils$$isMaybeThenable(x) {
    return (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' && x !== null;
  }

  var lib$es6$promise$utils$$_isArray;
  if (!Array.isArray) {
    lib$es6$promise$utils$$_isArray = function lib$es6$promise$utils$$_isArray(x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    };
  } else {
    lib$es6$promise$utils$$_isArray = Array.isArray;
  }

  var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
  var lib$es6$promise$asap$$len = 0;
  var lib$es6$promise$asap$$toString = {}.toString;
  var lib$es6$promise$asap$$vertxNext;
  var lib$es6$promise$asap$$customSchedulerFn;

  var lib$es6$promise$asap$$asap = function asap(callback, arg) {
    lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
    lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
    lib$es6$promise$asap$$len += 2;
    if (lib$es6$promise$asap$$len === 2) {
      // If len is 2, that means that we need to schedule an async flush.
      // If additional callbacks are queued before the queue is flushed, they
      // will be processed by this flush that we are scheduling.
      if (lib$es6$promise$asap$$customSchedulerFn) {
        lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
      } else {
        lib$es6$promise$asap$$scheduleFlush();
      }
    }
  };

  function lib$es6$promise$asap$$setScheduler(scheduleFn) {
    lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
  }

  function lib$es6$promise$asap$$setAsap(asapFn) {
    lib$es6$promise$asap$$asap = asapFn;
  }

  var lib$es6$promise$asap$$browserWindow = typeof window !== 'undefined' ? window : undefined;
  var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
  var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
  var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

  // test for web worker but not in IE10
  var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

  // node
  function lib$es6$promise$asap$$useNextTick() {
    // node version 0.10.x displays a deprecation warning when nextTick is used recursively
    // see https://github.com/cujojs/when/issues/410 for details
    return function () {
      process.nextTick(lib$es6$promise$asap$$flush);
    };
  }

  // vertx
  function lib$es6$promise$asap$$useVertxTimer() {
    return function () {
      lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
    };
  }

  function lib$es6$promise$asap$$useMutationObserver() {
    var iterations = 0;
    var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
    var node = document.createTextNode('');
    observer.observe(node, { characterData: true });

    return function () {
      node.data = iterations = ++iterations % 2;
    };
  }

  // web worker
  function lib$es6$promise$asap$$useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = lib$es6$promise$asap$$flush;
    return function () {
      channel.port2.postMessage(0);
    };
  }

  function lib$es6$promise$asap$$useSetTimeout() {
    return function () {
      setTimeout(lib$es6$promise$asap$$flush, 1);
    };
  }

  var lib$es6$promise$asap$$queue = new Array(1000);
  function lib$es6$promise$asap$$flush() {
    for (var i = 0; i < lib$es6$promise$asap$$len; i += 2) {
      var callback = lib$es6$promise$asap$$queue[i];
      var arg = lib$es6$promise$asap$$queue[i + 1];

      callback(arg);

      lib$es6$promise$asap$$queue[i] = undefined;
      lib$es6$promise$asap$$queue[i + 1] = undefined;
    }

    lib$es6$promise$asap$$len = 0;
  }

  function lib$es6$promise$asap$$attemptVertx() {
    try {
      var r = require;
      var vertx = r('vertx');
      lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
      return lib$es6$promise$asap$$useVertxTimer();
    } catch (e) {
      return lib$es6$promise$asap$$useSetTimeout();
    }
  }

  var lib$es6$promise$asap$$scheduleFlush;
  // Decide what async method to use to triggering processing of queued callbacks:
  if (lib$es6$promise$asap$$isNode) {
    lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
  } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
    lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
  } else if (lib$es6$promise$asap$$isWorker) {
    lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
  } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
    lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
  } else {
    lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
  }

  function lib$es6$promise$$internal$$noop() {}

  var lib$es6$promise$$internal$$PENDING = void 0;
  var lib$es6$promise$$internal$$FULFILLED = 1;
  var lib$es6$promise$$internal$$REJECTED = 2;

  var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

  function lib$es6$promise$$internal$$selfFulfillment() {
    return new TypeError("You cannot resolve a promise with itself");
  }

  function lib$es6$promise$$internal$$cannotReturnOwn() {
    return new TypeError('A promises callback cannot return that same promise.');
  }

  function lib$es6$promise$$internal$$getThen(promise) {
    try {
      return promise.then;
    } catch (error) {
      lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
      return lib$es6$promise$$internal$$GET_THEN_ERROR;
    }
  }

  function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
    try {
      then.call(value, fulfillmentHandler, rejectionHandler);
    } catch (e) {
      return e;
    }
  }

  function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
    lib$es6$promise$asap$$asap(function (promise) {
      var sealed = false;
      var error = lib$es6$promise$$internal$$tryThen(then, thenable, function (value) {
        if (sealed) {
          return;
        }
        sealed = true;
        if (thenable !== value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, value);
        }
      }, function (reason) {
        if (sealed) {
          return;
        }
        sealed = true;

        lib$es6$promise$$internal$$reject(promise, reason);
      }, 'Settle: ' + (promise._label || ' unknown promise'));

      if (!sealed && error) {
        sealed = true;
        lib$es6$promise$$internal$$reject(promise, error);
      }
    }, promise);
  }

  function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
    if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
      lib$es6$promise$$internal$$fulfill(promise, thenable._result);
    } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
      lib$es6$promise$$internal$$reject(promise, thenable._result);
    } else {
      lib$es6$promise$$internal$$subscribe(thenable, undefined, function (value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }, function (reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      });
    }
  }

  function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
    if (maybeThenable.constructor === promise.constructor) {
      lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
    } else {
      var then = lib$es6$promise$$internal$$getThen(maybeThenable);

      if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
      } else if (then === undefined) {
        lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
      } else if (lib$es6$promise$utils$$isFunction(then)) {
        lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
      }
    }
  }

  function lib$es6$promise$$internal$$resolve(promise, value) {
    if (promise === value) {
      lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
    } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
      lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
    } else {
      lib$es6$promise$$internal$$fulfill(promise, value);
    }
  }

  function lib$es6$promise$$internal$$publishRejection(promise) {
    if (promise._onerror) {
      promise._onerror(promise._result);
    }

    lib$es6$promise$$internal$$publish(promise);
  }

  function lib$es6$promise$$internal$$fulfill(promise, value) {
    if (promise._state !== lib$es6$promise$$internal$$PENDING) {
      return;
    }

    promise._result = value;
    promise._state = lib$es6$promise$$internal$$FULFILLED;

    if (promise._subscribers.length !== 0) {
      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
    }
  }

  function lib$es6$promise$$internal$$reject(promise, reason) {
    if (promise._state !== lib$es6$promise$$internal$$PENDING) {
      return;
    }
    promise._state = lib$es6$promise$$internal$$REJECTED;
    promise._result = reason;

    lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
  }

  function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
    var subscribers = parent._subscribers;
    var length = subscribers.length;

    parent._onerror = null;

    subscribers[length] = child;
    subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
    subscribers[length + lib$es6$promise$$internal$$REJECTED] = onRejection;

    if (length === 0 && parent._state) {
      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
    }
  }

  function lib$es6$promise$$internal$$publish(promise) {
    var subscribers = promise._subscribers;
    var settled = promise._state;

    if (subscribers.length === 0) {
      return;
    }

    var child,
        callback,
        detail = promise._result;

    for (var i = 0; i < subscribers.length; i += 3) {
      child = subscribers[i];
      callback = subscribers[i + settled];

      if (child) {
        lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
      } else {
        callback(detail);
      }
    }

    promise._subscribers.length = 0;
  }

  function lib$es6$promise$$internal$$ErrorObject() {
    this.error = null;
  }

  var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

  function lib$es6$promise$$internal$$tryCatch(callback, detail) {
    try {
      return callback(detail);
    } catch (e) {
      lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
      return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
    }
  }

  function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
    var hasCallback = lib$es6$promise$utils$$isFunction(callback),
        value,
        error,
        succeeded,
        failed;

    if (hasCallback) {
      value = lib$es6$promise$$internal$$tryCatch(callback, detail);

      if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
        failed = true;
        error = value.error;
        value = null;
      } else {
        succeeded = true;
      }

      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
        return;
      }
    } else {
      value = detail;
      succeeded = true;
    }

    if (promise._state !== lib$es6$promise$$internal$$PENDING) {
      // noop
    } else if (hasCallback && succeeded) {
      lib$es6$promise$$internal$$resolve(promise, value);
    } else if (failed) {
      lib$es6$promise$$internal$$reject(promise, error);
    } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
      lib$es6$promise$$internal$$fulfill(promise, value);
    } else if (settled === lib$es6$promise$$internal$$REJECTED) {
      lib$es6$promise$$internal$$reject(promise, value);
    }
  }

  function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
    try {
      resolver(function resolvePromise(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }, function rejectPromise(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      });
    } catch (e) {
      lib$es6$promise$$internal$$reject(promise, e);
    }
  }

  function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
    var enumerator = this;

    enumerator._instanceConstructor = Constructor;
    enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

    if (enumerator._validateInput(input)) {
      enumerator._input = input;
      enumerator.length = input.length;
      enumerator._remaining = input.length;

      enumerator._init();

      if (enumerator.length === 0) {
        lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
      } else {
        enumerator.length = enumerator.length || 0;
        enumerator._enumerate();
        if (enumerator._remaining === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        }
      }
    } else {
      lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
    }
  }

  lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function (input) {
    return lib$es6$promise$utils$$isArray(input);
  };

  lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function () {
    return new Error('Array Methods must be provided an Array');
  };

  lib$es6$promise$enumerator$$Enumerator.prototype._init = function () {
    this._result = new Array(this.length);
  };

  var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

  lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function () {
    var enumerator = this;

    var length = enumerator.length;
    var promise = enumerator.promise;
    var input = enumerator._input;

    for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
      enumerator._eachEntry(input[i], i);
    }
  };

  lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function (entry, i) {
    var enumerator = this;
    var c = enumerator._instanceConstructor;

    if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
      if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
        entry._onerror = null;
        enumerator._settledAt(entry._state, i, entry._result);
      } else {
        enumerator._willSettleAt(c.resolve(entry), i);
      }
    } else {
      enumerator._remaining--;
      enumerator._result[i] = entry;
    }
  };

  lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function (state, i, value) {
    var enumerator = this;
    var promise = enumerator.promise;

    if (promise._state === lib$es6$promise$$internal$$PENDING) {
      enumerator._remaining--;

      if (state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      } else {
        enumerator._result[i] = value;
      }
    }

    if (enumerator._remaining === 0) {
      lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
    }
  };

  lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function (promise, i) {
    var enumerator = this;

    lib$es6$promise$$internal$$subscribe(promise, undefined, function (value) {
      enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
    }, function (reason) {
      enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
    });
  };
  function lib$es6$promise$promise$all$$all(entries) {
    return new lib$es6$promise$enumerator$$default(this, entries).promise;
  }
  var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
  function lib$es6$promise$promise$race$$race(entries) {
    /*jshint validthis:true */
    var Constructor = this;

    var promise = new Constructor(lib$es6$promise$$internal$$noop);

    if (!lib$es6$promise$utils$$isArray(entries)) {
      lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
      return promise;
    }

    var length = entries.length;

    function onFulfillment(value) {
      lib$es6$promise$$internal$$resolve(promise, value);
    }

    function onRejection(reason) {
      lib$es6$promise$$internal$$reject(promise, reason);
    }

    for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
      lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
    }

    return promise;
  }
  var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
  function lib$es6$promise$promise$resolve$$resolve(object) {
    /*jshint validthis:true */
    var Constructor = this;

    if (object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.constructor === Constructor) {
      return object;
    }

    var promise = new Constructor(lib$es6$promise$$internal$$noop);
    lib$es6$promise$$internal$$resolve(promise, object);
    return promise;
  }
  var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
  function lib$es6$promise$promise$reject$$reject(reason) {
    /*jshint validthis:true */
    var Constructor = this;
    var promise = new Constructor(lib$es6$promise$$internal$$noop);
    lib$es6$promise$$internal$$reject(promise, reason);
    return promise;
  }
  var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

  var lib$es6$promise$promise$$counter = 0;

  function lib$es6$promise$promise$$needsResolver() {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  function lib$es6$promise$promise$$needsNew() {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
  /**
    Promise objects represent the eventual result of an asynchronous operation. The
    primary way of interacting with a promise is through its `then` method, which
    registers callbacks to receive either a promise's eventual value or the reason
    why the promise cannot be fulfilled.
     Terminology
    -----------
     - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
    - `thenable` is an object or function that defines a `then` method.
    - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
    - `exception` is a value that is thrown using the throw statement.
    - `reason` is a value that indicates why a promise was rejected.
    - `settled` the final resting state of a promise, fulfilled or rejected.
     A promise can be in one of three states: pending, fulfilled, or rejected.
     Promises that are fulfilled have a fulfillment value and are in the fulfilled
    state.  Promises that are rejected have a rejection reason and are in the
    rejected state.  A fulfillment value is never a thenable.
     Promises can also be said to *resolve* a value.  If this value is also a
    promise, then the original promise's settled state will match the value's
    settled state.  So a promise that *resolves* a promise that rejects will
    itself reject, and a promise that *resolves* a promise that fulfills will
    itself fulfill.
      Basic Usage:
    ------------
     ```js
    var promise = new Promise(function(resolve, reject) {
      // on success
      resolve(value);
       // on failure
      reject(reason);
    });
     promise.then(function(value) {
      // on fulfillment
    }, function(reason) {
      // on rejection
    });
    ```
     Advanced Usage:
    ---------------
     Promises shine when abstracting away asynchronous interactions such as
    `XMLHttpRequest`s.
     ```js
    function getJSON(url) {
      return new Promise(function(resolve, reject){
        var xhr = new XMLHttpRequest();
         xhr.open('GET', url);
        xhr.onreadystatechange = handler;
        xhr.responseType = 'json';
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send();
         function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              resolve(this.response);
            } else {
              reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
            }
          }
        };
      });
    }
     getJSON('/posts.json').then(function(json) {
      // on fulfillment
    }, function(reason) {
      // on rejection
    });
    ```
     Unlike callbacks, promises are great composable primitives.
     ```js
    Promise.all([
      getJSON('/posts'),
      getJSON('/comments')
    ]).then(function(values){
      values[0] // => postsJSON
      values[1] // => commentsJSON
       return values;
    });
    ```
     @class Promise
    @param {function} resolver
    Useful for tooling.
    @constructor
  */
  function lib$es6$promise$promise$$Promise(resolver) {
    this._id = lib$es6$promise$promise$$counter++;
    this._state = undefined;
    this._result = undefined;
    this._subscribers = [];

    if (lib$es6$promise$$internal$$noop !== resolver) {
      if (!lib$es6$promise$utils$$isFunction(resolver)) {
        lib$es6$promise$promise$$needsResolver();
      }

      if (!(this instanceof lib$es6$promise$promise$$Promise)) {
        lib$es6$promise$promise$$needsNew();
      }

      lib$es6$promise$$internal$$initializePromise(this, resolver);
    }
  }

  lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
  lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
  lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
  lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
  lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
  lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
  lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

  lib$es6$promise$promise$$Promise.prototype = {
    constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.
       ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```
       Chaining
      --------
       The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.
       ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });
       findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
       ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```
       Assimilation
      ------------
       Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```
       If the assimliated promise rejects, then the downstream promise will also reject.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```
       Simple Example
      --------------
       Synchronous Example
       ```javascript
      var result;
       try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```
       Advanced Example
      --------------
       Synchronous Example
       ```javascript
      var author, books;
       try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
       function foundBooks(books) {
       }
       function failure(reason) {
       }
       findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```
       @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
    then: function then(onFulfillment, onRejection) {
      var parent = this;
      var state = parent._state;

      if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
        return this;
      }

      var child = new this.constructor(lib$es6$promise$$internal$$noop);
      var result = parent._result;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function () {
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.
       ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }
       // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }
       // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```
       @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
    'catch': function _catch(onRejection) {
      return this.then(null, onRejection);
    }
  };
  function lib$es6$promise$polyfill$$polyfill() {
    var local;

    if (typeof global !== 'undefined') {
      local = global;
    } else if (typeof self !== 'undefined') {
      local = self;
    } else {
      try {
        local = Function('return this')();
      } catch (e) {
        throw new Error('polyfill failed because global object is unavailable in this environment');
      }
    }

    var P = local.Promise;

    if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
      return;
    }

    local.Promise = lib$es6$promise$promise$$default;
  }
  var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

  var lib$es6$promise$umd$$ES6Promise = {
    'Promise': lib$es6$promise$promise$$default,
    'polyfill': lib$es6$promise$polyfill$$default
  };

  /* global define:true module:true window: true */
  if (typeof define === 'function' && define['amd']) {
    define(function () {
      return lib$es6$promise$umd$$ES6Promise;
    });
  } else if (typeof module !== 'undefined' && module['exports']) {
    module['exports'] = lib$es6$promise$umd$$ES6Promise;
  } else if (typeof this !== 'undefined') {
    this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
  }

  lib$es6$promise$polyfill$$default();
}).call(undefined);
//# sourceMappingURL=vendor.js.map
