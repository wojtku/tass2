let map;
//var icon = "http://path/to/icon.png";
const infowindow = new google.maps.InfoWindow();
const LUBLIN_COORDINATES = {
  lat: 51.2464,
  lng: 22.5684
};

const initialize = () => {
  initializeMap();
  initializeDatePicker();
  drawMarkers();
};

const initializeDatePicker = () => {
  $(() => {
    $('input[name="daterange"]').daterangepicker();
  });
};

const initializeMap = () => {
  const mapProp = {
    center: LUBLIN_COORDINATES,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    },
    navigationControl: true
  };

  map = new google.maps.Map(document.getElementById("map"), mapProp);
};

const bindInfoWindow = (marker, map, infowindow, strDescription) => {
  google.maps.event.addListener(marker, 'click', () => {
    infowindow.setContent(strDescription);
    infowindow.open(map, marker);
  });
};

const getApplications = () => {
  //  $.getJSON(json, function(json1) {
  return [{
    "address": "ul. Kraszewskiego 53",
    "description": "www.aber.ac.uk",
    "date": "13-09-2016"
  }, {
    "address": "ul. Staszica 8",
    "description": "www.bangor.ac.uk",
    "date": "13-09-2016"
  }, {
    "address": "al. Solidarności",
    "description": "",
    "date": "28-09-2016",
    "id": "273172"
  }];
};

const drawMarkers = () => {
  const applications = getApplications();
  applications.map(application =>  geoCodeAddress(application.address))
};

const geoCodeAddress = (address) => {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: `${address}, Lublin` }, (results, status) => {
    if(status == google.maps.GeocoderStatus.OK) {
      if(results) {
        drawMarker({
          text: results[0].formatted_addres,
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        });
      }
    } else if(status == google.maps.GeocoderStatus.ZERO_RESULTS) {
      console.log("Address " + address + " not found" );
    }
  });
};

const drawMarker = ({ lat, lng, text }) => {
  var latLng = new google.maps.LatLng(lat, lng);
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    // icon: icon,
    title: text
  });
  bindInfoWindow(marker, map, infowindow, "dupa");
};

google.maps.event.addDomListener(window, 'load', initialize);
