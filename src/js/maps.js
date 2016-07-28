var map;

function initMap() {
  var chicago = new google.maps.LatLng(41.850, -87.650);

  map = new google.maps.Map(document.getElementById('google-map'), {
    center: chicago,
    zoom: 18
  });
}