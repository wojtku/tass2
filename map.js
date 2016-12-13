var map;
//var icon = "http://path/to/icon.png";
//var json = "http://path/to/universities.json";
const infowindow = new google.maps.InfoWindow();
const LUBLIN_COORDINATES = {
  lat: 51.2464,
  lng: 22.5684
};

const initializeMap = () => {
  const mapProp = {
    center: LUBLIN_COORDINATES,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById("map"), mapProp);
  prepareMarkers(getAddressList());
};

const bindInfoWindow = (marker, map, infowindow, strDescription) => {
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(strDescription);
    infowindow.open(map, marker);
  });
};

const getAddressList = () => {
  //  $.getJSON(json, function(json1) {
  return [{
      "title": "Aberystwyth University",
      "web": "www.aber.ac.uk",
      "phone": "+44 (0)1970 623 111",
      "lat": 52.415524,
      "lng": -4.063066
    }, {
      "title": "Bangor University",
      "web": "www.bangor.ac.uk",
      "phone": "+44 (0)1248 351 151",
      "lat": 53.229520,
      "lng": -4.129987
    }, {
      "title": "Cardiff Metropolitan University",
      "website": "www.cardiffmet.ac.uk",
      "phone": "+44 (0)2920 416 138",
      "lat": 51.482708,
      "lng": -3.165881
    }];
};

const prepareMarkers = (universities) => {
  universities.forEach((key, data) => {
    var latLng = new google.maps.LatLng(data.lat, data.lng);

    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
      // icon: icon,
      title: data.title
    });

    var details = data.website + ", " + data.phone + ".";

    bindInfoWindow(marker, map, infowindow, details);
  });
};

google.maps.event.addDomListener(window, 'load', initializeMap);
