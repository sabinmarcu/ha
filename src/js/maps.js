const loadScriptAsync = (src) => new Promise((accept, reject) => {
    const scr = document.createElement("script");
    scr.src = src;
    scr.onload = () => {
        accept();
    }
    document.head.appendChild(scr);
});

loadScriptAsync("js/vendor.js").then(loadScriptAsync("js/bower.js")).then(() => {
    const mapsScriptUrl = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBwC-BzmC2WQwxqWjqCl0ROiloWG68UUVs&callback=initMap";
    const endpoint = "http://131.251.176.109:8082/Data/query?query=PREFIX%20wis%3A<http%3A%2F%2Fwww.WISDOM.org%2FWISDOMontology%23>%0APREFIX%20rdf%3A<http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23>%0ASELECT%20%20%3FXcoord_US%20%3FYcoord_US%20%3FXcoord_DS%20%3FYcoord_DS%0AWHERE%20%7B%20%0A%3FURI%20wis%3AhasUpstreamNode%20%3FUSnode%20.%0A%3FUSnode%20wis%3AhasXcoord%20%3FXcoord_US%20.%0A%3FUSnode%20wis%3AhasYcoord%20%3FYcoord_US%20.%0A%3FURI%20wis%3AhasDownstreamNode%20%3FDSnode%20.%0A%3FDSnode%20wis%3AhasXcoord%20%3FXcoord_DS%20.%0A%3FDSnode%20wis%3AhasYcoord%20%3FYcoord_DS%20.%0A%7D";
    const randomColorChannel = () => parseInt(Math.random() * 256).toString(16);
    const randomColor = () => `#${randomColorChannel()}${randomColorChannel()}${randomColorChannel()}`;

    window.initMap = async function() {
        const geocoder = new google.maps.Geocoder();

        // Will get the LatLng object for a string
        const stringToLatLngPlaces = function(str) {
            return new Promise((accept, reject) =>
                geocoder.geocode({'address': str}, function(results, status) {
                    if (status === 'OK') {
                        return accept(results[0].geometry.location);
                    }
                    return reject(status);
                })
            );
        }

        const center = await stringToLatLngPlaces("swansea");
        const map = new google.maps.Map(document.getElementById('google-map'), {
            center: center,
            zoom: 13
        });

        const data = await fetch(endpoint).then(response => response.json());

        const bindings = data.results.bindings
            .map(it =>
                [
                    OsGridRef.osGridToLatLon(
                        new OsGridRef(it.Xcoord_US.value, it.Ycoord_US.value)
                    ),
                    OsGridRef.osGridToLatLon(
                        new OsGridRef(it.Xcoord_DS.value, it.Ycoord_DS.value)
                    )
                ]
        )

        let mapBounds = new google.maps.LatLngBounds();
        bindings.map(it =>{
            const pointX = new google.maps.LatLng(it[0].lat, it[0].lon);
            const pointY = new google.maps.LatLng(it[1].lat, it[1].lon);

            mapBounds.extend(pointX);
            mapBounds.extend(pointY);

            (new google.maps.Polyline({
                path: [pointX, pointY],
                strokeColor: randomColor()
            })).setMap(map);

        });

        map.fitBounds(mapBounds);

    }

    loadScriptAsync(mapsScriptUrl);
}).catch(e => console.log("Could not load", e));
