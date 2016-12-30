let map;
//var icon = "http://path/to/icon.png";
const infowindow = new google.maps.InfoWindow();
const LUBLIN_COORDINATES = {
  lat: 51.2464,
  lng: 22.5684
};
const MOCK_MODE = false;
let markers;

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

const bindInfoWindow = (marker, map, infoWindowContent) => {
  google.maps.event.addListener(marker, 'click', () => {
    infowindow.setContent("<a href='" + infoWindowContent.link + "'>" + infoWindowContent.link + "</a>"+ "<br />" +
                  "Data: " + infoWindowContent.data + "<br />" +
                  "Wniosek: " + "<b>" + infoWindowContent.wniosek+ "</b>" + "<br />" +
                  infoWindowContent.pyt +
                  "</p>");
    infowindow.open(map, marker);
  });
};

const getApplications = () => {
  //  $.getJSON(json, function(json1) {
  if(MOCK_MODE) {
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
  } else {
    return httpGet("http://127.0.0.1:5000/wnioski");
  }
};

const httpGet = (theUrl) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
};

const drawMarkers = () => {
  const applications = getApplications();
  applications.map(application =>  geoCodeAddress(application))
};

const geoCodeAddress = (application) => {
  const geocoder = new google.maps.Geocoder();
  const addresses = application.lokalizacja.split('|');
  addresses.map(address => {
      geocoder.geocode({ address: `${address}, Lublin` }, (results, status) => {
      if(status == google.maps.GeocoderStatus.OK) {
        if(results) {
          drawMarker({
            title: results[0].formatted_address,
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            infoWindowContent: {
              link: application.link,
              pyt: application.pyt,
              wniosek: application.wniosek,
              data: application.data
            }
          });
        }
      } else if(status == google.maps.GeocoderStatus.ZERO_RESULTS) {
        console.log("Address " + address + " not found" );
      }
    });
  })
};

const drawMarker = ({ lat, lng, title, infoWindowContent }) => {
  var latLng = new google.maps.LatLng(lat, lng);
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    animation: google.maps.Animation.DROP,
    title: title
  });
  bindInfoWindow(marker, map, infoWindowContent);
};

google.maps.event.addDomListener(window, 'load', initialize);
