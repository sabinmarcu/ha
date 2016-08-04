var map;

function initMap() {
    var chicago = new google.maps.LatLng(41.850, -87.650);

    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById('google-map'), {
        center: chicago,
        zoom: 18
    });

    directionsDisplay.setMap(map);

    var stringToLatLngPlaces = function(str, cb) {
        geocoder.geocode({'address': str}, function(results, status) {
            if (status === 'OK') {
                var place = results[0].geometry.location;
                cb && cb(place);
            }
        });
    }
    
    stringToLatLngPlaces("chicago", function(start) {
        stringToLatLngPlaces("new york", function(end) {
            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, function(result, status) {
                console.log(status, result);
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(result);
                }
            });

        });
    });

}
