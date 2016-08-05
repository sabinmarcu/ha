"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var mapsScriptUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBwC-BzmC2WQwxqWjqCl0ROiloWG68UUVs&callback=initMap";
var endpoint = "http://131.251.176.109:8082/Data/query?query=PREFIX%20wis%3A<http%3A%2F%2Fwww.WISDOM.org%2FWISDOMontology%23>%0APREFIX%20rdf%3A<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>%0ASELECT%20%20%3FXcoord_US%20%3FYcoord_US%20%3FXcoord_DS%20%3FYcoord_DS%0AWHERE%20%7B%20%0A%3FURI%20wis%3AhasUpstreamNode%20%3FUSnode%20.%0A%3FUSnode%20wis%3AhasXcoord%20%3FXcoord_US%20.%0A%3FUSnode%20wis%3AhasYcoord%20%3FYcoord_US%20.%0A%3FURI%20wis%3AhasDownstreamNode%20%3FDSnode%20.%0A%3FDSnode%20wis%3AhasXcoord%20%3FXcoord_DS%20.%0A%3FDSnode%20wis%3AhasYcoord%20%3FYcoord_DS%20.%0A%7D";
var randomColorChannel = function randomColorChannel() {
    return parseInt(Math.random() * 256).toString(16);
};
var randomColor = function randomColor() {
    return "#" + randomColorChannel() + randomColorChannel() + randomColorChannel();
};

window.initMap = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var geocoder, stringToLatLngPlaces, center, map, data, bindings, mapBounds;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    geocoder = new google.maps.Geocoder();

                    // Will get the LatLng object for a string

                    stringToLatLngPlaces = function stringToLatLngPlaces(str) {
                        return new Promise(function (accept, reject) {
                            return geocoder.geocode({ 'address': str }, function (results, status) {
                                if (status === 'OK') {
                                    return accept(results[0].geometry.location);
                                }
                                return reject(status);
                            });
                        });
                    };

                    _context.next = 4;
                    return stringToLatLngPlaces("swansea");

                case 4:
                    center = _context.sent;
                    map = new google.maps.Map(document.getElementById('google-map'), {
                        center: center,
                        zoom: 13
                    });
                    _context.next = 8;
                    return fetch(endpoint).then(function (response) {
                        return response.json();
                    });

                case 8:
                    data = _context.sent;
                    bindings = data.results.bindings.map(function (it) {
                        return [OsGridRef.osGridToLatLon(new OsGridRef(it.Xcoord_US.value, it.Ycoord_US.value)), OsGridRef.osGridToLatLon(new OsGridRef(it.Xcoord_DS.value, it.Ycoord_DS.value))];
                    });
                    mapBounds = new google.maps.LatLngBounds();

                    bindings.map(function (it) {
                        var pointX = new google.maps.LatLng(it[0].lat, it[0].lon);
                        var pointY = new google.maps.LatLng(it[1].lat, it[1].lon);

                        mapBounds.extend(pointX);
                        mapBounds.extend(pointY);

                        new google.maps.Polyline({
                            path: [pointX, pointY],
                            strokeColor: randomColor()
                        }).setMap(map);
                    });

                    map.fitBounds(mapBounds);

                case 13:
                case "end":
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

loadScriptAsync(mapsScriptUrl);
//# sourceMappingURL=app.js.map
