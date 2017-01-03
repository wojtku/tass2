let map;
const icon = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
const infowindow = new google.maps.InfoWindow();
const LUBLIN_COORDINATES = {
  lat: 51.2464,
  lng: 22.5684
};
const MOCK_MODE = false;
const dateRange = $('input[name="daterange"]');
let markers = [];

const initialize = () => {
  initializeDatePicker();
  initializeMap();
  drawMarkers(getApplications());
};

const initializeDatePicker = () => {
  const startDate = moment().subtract(30, 'days');
  const endDate = moment();
  $(() => {
    dateRange.daterangepicker({
      locale: {
        format: 'DD-MM-YYYY'
      },
      startDate,
      endDate
    });
  });
};

dateRange.on('apply.daterangepicker', (ev, picker) => {
  $(this).val(picker.startDate.format('DD-MM-YYYY') + ' - ' + picker.endDate.format('DD-MM-YYYY'));
  const dateFrom = picker.startDate.format('DD-MM-YYYY');
  const dateTo = picker.endDate.format('DD-MM-YYYY');
  getApplicationsWithDateRange(dateFrom, dateTo);
});

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
  const toggleBounce = () => {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
      infowindow.close();
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };
  //marker.addListener('click', toggleBounce);
};

const toggleBounce = () => {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
};

const getApplications = (dateFrom = moment().subtract(30, 'days').format('DD-MM-YYYY'), dateTo = moment().format('DD-MM-YYYY')) => {
  if(MOCK_MODE) {
    return mock;
  } else {
    return httpGet(`http://127.0.0.1:5000/wnioski?date_from=${dateFrom}&date_to=${dateTo}`);
  }
};

const getApplicationsWithDateRange = (dateFrom, dateTo) => {
  const applications = getApplications(dateFrom, dateTo);
  clearMarkers();
  initializeMap();
  drawMarkers(applications);
};

const httpGet = (theUrl) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
};

const drawMarkers = (applications) => {
  applications.map(application =>  prepareMarkers(application));
  markers.map(marker =>  bindInfoWindow(marker, map, marker.infoWindowContent));
  //const markerCluster = new MarkerClusterer(map, markers,
    //{imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
};

const clearMarkers = () => {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
};

// funkcja do usunięcia - geolokalizacja będzie po stronie pythona
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

const prepareMarkers = (application) => {
  const infoWindowContent = {
    link: application.link,
    pyt: application.pyt,
    wniosek: application.wniosek,
    data: application.data
  };
  const marker = new google.maps.Marker({
    position: new google.maps.LatLng(application.latitude, application.longitude),
    map,
    icon,
    animation: google.maps.Animation.DROP,
    title: application.lokalizacja,
    infoWindowContent
  });
  marker.setMap(map);
  markers.push(marker);
};

google.maps.event.addDomListener(window, 'load', initialize);

const mock = [
  {
    "data": "22-5-2015",
    "id": 245111,
    "kom_org": "GD",
    "latitude": 51.2357495,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245111",
    "lokalizacja": "ul. Pana Balcera",
    "longitude": 22.5268025,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej dotycz\u0105cej ceny zakupu przez Gmin\u0119 Lublin trzech dzia\u0142ek od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego sp. z o.o. - Urz\u0105d Miasta Lublin Wydzia\u0142 Geodezji informuje, \u017ce dzia\u0142ki nr 34/192, 34/195 i 34/198 (Obr 28 Rury Jezuickie, ark. 2), zosta\u0142y przej\u0119te na w\u0142asno\u015b\u0107 Gminy Lublin na mocy decyzji Prezydenta Miasta Lublin z dnia 12 sierpnia 2013 r. nr 967/13 o zezwoleniu na realizacj\u0119 inwestycji drogowej pod nazw\u0105:- rozbudowa drogi gminnej nr 106885L &ndash; ul. Jana Sawy na odcinku od istniej\u0105cej ul. Jana Sawy o symbolu 7KDD-G do ul. Pana Balcera wraz z o\u015bwietleniem drogowym, odwodnieniem do sieci kanalizacji deszczowej i przebudow\u0105 hydrantu p-po\u017c.- budowa i przebudowa drogi gminnej nr 106884L &ndash; ul. Pana Balcera na odcinku od ul. Jana Sawy do ul. Filaret&oacute;w wraz z o\u015bwietleniem drogowym, odwodnieniem do sieci kanalizacji deszczowej,- rozbudowa drogi powiatowej nr 2344L &ndash; ul. Filaret&oacute;w w rejonie skrzy\u017cowania z ul. Pana Balcera.Za przej\u0119te dzia\u0142ki dotychczasowemu w\u0142a\u015bcicielowi przys\u0142uguje odszkodowanie, o czym stanowi art. 12 ust. 4f ustawy z dnia 10 kwietnia 2003 r. o szczeg&oacute;lnych zasadach przygotowania i realizacji inwestycji w zakresie dr&oacute;g publicznych oraz art. 128 ust. 1 ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bci.Do dnia dzisiejszego odszkodowanie nie zosta\u0142o ustalone.",
    "pyt": "Wnosz\u0119 o udzielenie informacji dotycz\u0105cej koszt&oacute;w zakupu/wykupu 3 dzia\u0142ek gruntu przez&nbsp; Gmin\u0119 Lublin od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego Sp. z o.o. pod drog\u0119&nbsp; \u0142\u0105cz\u0105c\u0105 ul. Pana Balcera z ul. Jana Sawy (budynki 8 i 10) w s\u0105siedztwie apartamentowca&nbsp; Metropolitan Park.",
    "wniosek": "zakupu przez Gmin\u0119 Lublin dzia\u0142ek od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego sp. z o.o."
  },
  {
    "data": "22-5-2015",
    "id": 245111,
    "kom_org": "GD",
    "latitude": 51.2370846,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245111",
    "lokalizacja": "ul. Jana Sawy",
    "longitude": 22.5234677,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej dotycz\u0105cej ceny zakupu przez Gmin\u0119 Lublin trzech dzia\u0142ek od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego sp. z o.o. - Urz\u0105d Miasta Lublin Wydzia\u0142 Geodezji informuje, \u017ce dzia\u0142ki nr 34/192, 34/195 i 34/198 (Obr 28 Rury Jezuickie, ark. 2), zosta\u0142y przej\u0119te na w\u0142asno\u015b\u0107 Gminy Lublin na mocy decyzji Prezydenta Miasta Lublin z dnia 12 sierpnia 2013 r. nr 967/13 o zezwoleniu na realizacj\u0119 inwestycji drogowej pod nazw\u0105:- rozbudowa drogi gminnej nr 106885L &ndash; ul. Jana Sawy na odcinku od istniej\u0105cej ul. Jana Sawy o symbolu 7KDD-G do ul. Pana Balcera wraz z o\u015bwietleniem drogowym, odwodnieniem do sieci kanalizacji deszczowej i przebudow\u0105 hydrantu p-po\u017c.- budowa i przebudowa drogi gminnej nr 106884L &ndash; ul. Pana Balcera na odcinku od ul. Jana Sawy do ul. Filaret&oacute;w wraz z o\u015bwietleniem drogowym, odwodnieniem do sieci kanalizacji deszczowej,- rozbudowa drogi powiatowej nr 2344L &ndash; ul. Filaret&oacute;w w rejonie skrzy\u017cowania z ul. Pana Balcera.Za przej\u0119te dzia\u0142ki dotychczasowemu w\u0142a\u015bcicielowi przys\u0142uguje odszkodowanie, o czym stanowi art. 12 ust. 4f ustawy z dnia 10 kwietnia 2003 r. o szczeg&oacute;lnych zasadach przygotowania i realizacji inwestycji w zakresie dr&oacute;g publicznych oraz art. 128 ust. 1 ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bci.Do dnia dzisiejszego odszkodowanie nie zosta\u0142o ustalone.",
    "pyt": "Wnosz\u0119 o udzielenie informacji dotycz\u0105cej koszt&oacute;w zakupu/wykupu 3 dzia\u0142ek gruntu przez&nbsp; Gmin\u0119 Lublin od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego Sp. z o.o. pod drog\u0119&nbsp; \u0142\u0105cz\u0105c\u0105 ul. Pana Balcera z ul. Jana Sawy (budynki 8 i 10) w s\u0105siedztwie apartamentowca&nbsp; Metropolitan Park.",
    "wniosek": "zakupu przez Gmin\u0119 Lublin dzia\u0142ek od syndyka masy upad\u0142o\u015bci Funduszu Mieszkaniowego sp. z o.o."
  },
  {
    "data": "7-7-2015",
    "id": 245436,
    "kom_org": "GM",
    "latitude": 51.2400057,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245436",
    "lokalizacja": "ul. Wallenroda 2E",
    "longitude": 22.5281694,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w zakresie zg\u0142oszonych roszcze\u0144 reprywatyzacyjnych, kt&oacute;ry wp\u0142yn\u0105\u0142 do Urz\u0119du Miasta Lublin w dniu 7 lipca 2015 r. informuj\u0119, \u017ce do kompetencji Prezydenta Miasta Lublin na podstawie art. 142 ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami (Dz. U. z 2015 r. poz. 728) nale\u017cy rozpatrywanie spraw o zwrot nieruchomo\u015bci w trybie przepis&oacute;w rozdzia\u0142u 6 dzia\u0142u III tej ustawy. W pozosta\u0142ym zakresie dotycz\u0105cym roszcze\u0144 reprywatyzacyjnych oraz post\u0119powa\u0144 dotycz\u0105cych prawid\u0142owo\u015bci nabycia, w zale\u017cno\u015bci od podstawy uzyskania tytu\u0142u prawnego do nieruchomo\u015bci, orzekaj\u0105 w\u0142a\u015bciwe s\u0105dy, wojewodowie i ministrowie. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz. 782, z p&oacute;\u017an. zm.) obowi\u0105zane do jej udost\u0119pnienia s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci.Bior\u0105c pod uwag\u0119 powy\u017csze, stosownie do kompetencji Prezydenta Miasta Lublin informuj\u0119, \u017ce w stosunku do nieruchomo\u015bci po\u0142o\u017conych w Lublinie przy ul. Wallenroda 2E i 2F, oznaczonych jako dzia\u0142ka nr 9/40 (obr. 21, ark. 10) o pow. 0,0886 ha, dla kt&oacute;rej S\u0105d Rejonowy Lublin &ndash; Zach&oacute;d w Lublinie X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 nr -------- oraz dzia\u0142ka nr 9/44 (obr. 21, ark. 10) o pow. 0,0867 ha, dla kt&oacute;rej S\u0105d Rejonowy Lublin &ndash; Zach&oacute;d w Lublinie X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 nr ---------, w okresie od 2012 r. do chwili obecnej nie toczy\u0142o i nie toczy si\u0119 post\u0119powanie o zwrot nieruchomo\u015bci w trybie okre\u015blonym w przepisach rozdzia\u0142u 6 dzia\u0142u III ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami (Dz. U. z 2015 r. poz. 728).Jednocze\u015bnie wyja\u015bniam, \u017ce informacje dotycz\u0105ce post\u0119powa\u0144 zako\u0144czonych przed 2012 r. stanowi\u0105 informacje przetworzone. Akta spraw zako\u0144czonych przed wskazan\u0105 wy\u017cej dat\u0105, stosownie do &sect; 63 rozporz\u0105dzenia Prezesa Rady Ministr&oacute;w z dnia 18 stycznia 2011 r. w sprawie instrukcji kancelaryjnej, jednolitych rzeczowych wykaz&oacute;w akt oraz instrukcji w sprawie organizacji i zakresu dzia\u0142ania archiw&oacute;w zak\u0142adowych, s\u0105 przekazywane do archiwum zak\u0142adowego. Tym samym udzielenie informacji dotycz\u0105cej takich post\u0119powa\u0144 wymaga dokonania kwerendy archiwalnych dokument&oacute;w, co wymaga u\u017cycia dodatkowych si\u0142 i \u015brodk&oacute;w.W zwi\u0105zku z tym wzywam do wykazania, stosownie do art. 3 ust. 1 pkt 1 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz. 782, z p&oacute;\u017an. zm.), w terminie 14 dni, w jakim zakresie udost\u0119pnienie informacji przetworzonej jest szczeg&oacute;lnie istotne dla interesu publicznego. ",
    "pyt": "Wnosz\u0119 o udzielenie informacji, czy przed Prezydentem Miasta Lublin toczy lub toczy\u0142o si\u0119 jakiekolwiek post\u0119powanie, w tym m.in. dotycz\u0105ce prawid\u0142owo\u015bci nabycia lub roszcze\u0144 reprywatyzacyjnych, w przedmiocie:nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/40,nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/44.",
    "wniosek": "roszcze\u0144 reprywatyzacyjnych"
  },
  {
    "data": "7-7-2015",
    "id": 245436,
    "kom_org": "GM",
    "latitude": 51.2398547,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245436",
    "lokalizacja": "ul. Wallenroda 2F",
    "longitude": 22.5286475,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w zakresie zg\u0142oszonych roszcze\u0144 reprywatyzacyjnych, kt&oacute;ry wp\u0142yn\u0105\u0142 do Urz\u0119du Miasta Lublin w dniu 7 lipca 2015 r. informuj\u0119, \u017ce do kompetencji Prezydenta Miasta Lublin na podstawie art. 142 ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami (Dz. U. z 2015 r. poz. 728) nale\u017cy rozpatrywanie spraw o zwrot nieruchomo\u015bci w trybie przepis&oacute;w rozdzia\u0142u 6 dzia\u0142u III tej ustawy. W pozosta\u0142ym zakresie dotycz\u0105cym roszcze\u0144 reprywatyzacyjnych oraz post\u0119powa\u0144 dotycz\u0105cych prawid\u0142owo\u015bci nabycia, w zale\u017cno\u015bci od podstawy uzyskania tytu\u0142u prawnego do nieruchomo\u015bci, orzekaj\u0105 w\u0142a\u015bciwe s\u0105dy, wojewodowie i ministrowie. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz. 782, z p&oacute;\u017an. zm.) obowi\u0105zane do jej udost\u0119pnienia s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci.Bior\u0105c pod uwag\u0119 powy\u017csze, stosownie do kompetencji Prezydenta Miasta Lublin informuj\u0119, \u017ce w stosunku do nieruchomo\u015bci po\u0142o\u017conych w Lublinie przy ul. Wallenroda 2E i 2F, oznaczonych jako dzia\u0142ka nr 9/40 (obr. 21, ark. 10) o pow. 0,0886 ha, dla kt&oacute;rej S\u0105d Rejonowy Lublin &ndash; Zach&oacute;d w Lublinie X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 nr -------- oraz dzia\u0142ka nr 9/44 (obr. 21, ark. 10) o pow. 0,0867 ha, dla kt&oacute;rej S\u0105d Rejonowy Lublin &ndash; Zach&oacute;d w Lublinie X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 nr ---------, w okresie od 2012 r. do chwili obecnej nie toczy\u0142o i nie toczy si\u0119 post\u0119powanie o zwrot nieruchomo\u015bci w trybie okre\u015blonym w przepisach rozdzia\u0142u 6 dzia\u0142u III ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami (Dz. U. z 2015 r. poz. 728).Jednocze\u015bnie wyja\u015bniam, \u017ce informacje dotycz\u0105ce post\u0119powa\u0144 zako\u0144czonych przed 2012 r. stanowi\u0105 informacje przetworzone. Akta spraw zako\u0144czonych przed wskazan\u0105 wy\u017cej dat\u0105, stosownie do &sect; 63 rozporz\u0105dzenia Prezesa Rady Ministr&oacute;w z dnia 18 stycznia 2011 r. w sprawie instrukcji kancelaryjnej, jednolitych rzeczowych wykaz&oacute;w akt oraz instrukcji w sprawie organizacji i zakresu dzia\u0142ania archiw&oacute;w zak\u0142adowych, s\u0105 przekazywane do archiwum zak\u0142adowego. Tym samym udzielenie informacji dotycz\u0105cej takich post\u0119powa\u0144 wymaga dokonania kwerendy archiwalnych dokument&oacute;w, co wymaga u\u017cycia dodatkowych si\u0142 i \u015brodk&oacute;w.W zwi\u0105zku z tym wzywam do wykazania, stosownie do art. 3 ust. 1 pkt 1 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz. 782, z p&oacute;\u017an. zm.), w terminie 14 dni, w jakim zakresie udost\u0119pnienie informacji przetworzonej jest szczeg&oacute;lnie istotne dla interesu publicznego. ",
    "pyt": "Wnosz\u0119 o udzielenie informacji, czy przed Prezydentem Miasta Lublin toczy lub toczy\u0142o si\u0119 jakiekolwiek post\u0119powanie, w tym m.in. dotycz\u0105ce prawid\u0142owo\u015bci nabycia lub roszcze\u0144 reprywatyzacyjnych, w przedmiocie:nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/40,nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/44.",
    "wniosek": "roszcze\u0144 reprywatyzacyjnych"
  },
  {
    "data": "2-7-2015",
    "id": 245440,
    "kom_org": "AB",
    "latitude": 51.2470824,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245440",
    "lokalizacja": "ul. Wojciechowskiej",
    "longitude": 22.5018747,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w sprawie czy na dzia\u0142ce nr 11/1 zlokalizowanej przy ul Wojciechowskiej wydane zosta\u0142o pozwolenie na budow\u0119 obiektu handlowego (stokrotka) wraz z udost\u0119pnieniem pozwolenia na budow\u0119, informuj\u0119 \u017ce do dnia dzisiejszego w przedmiotowej sprawie nie zosta\u0142o wydane pozwolenie na budow\u0119.",
    "pyt": "Wnosz\u0119 o udzielenie informacji: czy udzielone zosta\u0142o pozwolenie na budow\u0119 obiektu handlowego na dzia\u0142ce przy ul. Wojciechowskiej.",
    "wniosek": "pozwolenia na budow\u0119 obiektu handlowego przy ul. Wojciechowskiej"
  },
  {
    "data": "7-7-2015",
    "id": 245920,
    "kom_org": "MKZ",
    "latitude": 51.2400057,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245920",
    "lokalizacja": "ul. Wallenroda 2E",
    "longitude": 22.5281694,
    "odp": "W odpowiedzi na wniosek o udzielenie informacji publicznej dotycz\u0105cej nieruchomo\u015bci po\u0142o\u017conej w Lublinie:  przy \tul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka \tgruntu o numerze ewidencyjnym 9/40, dla kt&oacute;rej S\u0105d Rejonowy \tLublin-Zach&oacute;d, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 \twieczyst\u0105 numer LU1I/00166541/3, \tprzy \tul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka \tgruntu o numerze ewidencyjnym 9/44, dla kt&oacute;rej S\u0105d Rejonowy \tLublin-Zach&oacute;d, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 \twieczyst\u0105 numer LU1I/00169902/3,  \t \t \tMiejski \tKonserwator Zabytk&oacute;w w Lublinie informuje: \t \t1. \tWskazane we wniosku nieruchomo\u015bci nie podlegaj\u0105 ochronie \tkonserwatorskiej na podstawie ustawy z dnia 23 lipca o ochronie \tzabytk&oacute;w i opiece nad zabytkami (Dz. U. 2014, poz. 1446, t.j.). Na \tprzedmiotowych dzia\u0142kach brak jest obiekt&oacute;w zabytkowych uj\u0119tych w \tGminnej Ewidencji Zabytk&oacute;w Miasta Lublin (GEZ). Wg aktualnej (na \tdzie\u0144 niniejszego pisma) wiedzy pracownik&oacute;w Biura MKZ, opartej na \tinformacjach jakie dotychczas zosta\u0142y oficjalnie przekazane z \tWojew&oacute;dzkiego Urz\u0119du Ochrony Zabytk&oacute;w w Lublinie, w Wojew&oacute;dzkiej \tEwidencji Zabytk&oacute;w, a co za tym idzie w GEZ, nie ma \u017cadnych \tstanowisk archeologicznych na obszarze dzia\u0142ek, kt&oacute;rych dotyczy \tprzedmiotowy wniosek. \t \t2. \tNie jest planowane obj\u0119cie ochron\u0105 konserwatorsk\u0105 przedmiotowych \tnieruchomo\u015bci. \t \t3. \tPrzedmiotowy teren le\u017cy na obszarze miasta posiadaj\u0105cym \tobowi\u0105zuj\u0105cy plan zagospodarowania przestrzennego &ndash; Uchwa\u0142a nr \t1688/LV/2002 z dnia 26 wrze\u015bnia 2002 r. ws. uchwalenia miejscowego \tplanu zagospodarowania przestrzennego miasta Lublin &ndash; cz\u0119\u015b\u0107 II \t(Dziennik Urz\u0119dowy Wojew&oacute;dztwa Lubelskiego z dnia 14 sierpnia 2008 \tr., Nr 97, poz. 2519), dost\u0119pna na stronie: \thttp://www.lublin.eu/Miejscowy_Plan_Zagospodarowania_Przestrzennego-1-663-3-344_397.html. \tJe\u017celi s\u0105 Pa\u0144stwo zainteresowani wyrysem i wypisem z mpzp nale\u017cy \tzwr&oacute;ci\u0107 si\u0119 do Wydzia\u0142u Planowania Urz\u0119du Miasta Lublin, ul. \tWieniawska 14, 20-071 Lublin. Wszelkie informacje dotycz\u0105ce tak\u017ce \twniesienia stosownej op\u0142aty znajd\u0105 Pa\u0144stwo na stronie: \thttp://www.um.lublin.eu/um/index.php?t=200&amp;id=50488.&nbsp;",
    "pyt": "Wnosz\u0119 o udzielenie informacji publicznej dotycz\u0105cej:- nieruchomo\u015bci po\u0142o\u017conej w Lublinie, przy ul. Wallenroda 2E- nieruchomo\u015bci po\u0142o\u017conej w Lublinie, przy ul. Wallenroda 2Fczy nieruchomo\u015bci wpisane s\u0105 do Gminnej Ewidencji Zabytk&oacute;w (GEZ) lub znajduj\u0105 si\u0119 na obszarze wpisanym do Gminnej Ewidencji Zabytk&oacute;w, lub czy planowane jest wpisanie nieruchomo\u015bci do GEZ lub obszaru na kt&oacute;rym znajduj\u0105 si\u0119 nieruchomo\u015bci?czy nieruchomo\u015bci obj\u0119te s\u0105 jakimkolwiek innym zakresem ochrony?czy rozwa\u017cane lub planowane jest obj\u0119cie nieruchomo\u015bci ochron\u0105 w jakiejkolwiek formie?",
    "wniosek": "nieruchomo\u015bci wpisanej do Gminnej Ewidencji Zabytk\u00f3w"
  },
  {
    "data": "7-7-2015",
    "id": 245920,
    "kom_org": "MKZ",
    "latitude": 51.2398547,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245920",
    "lokalizacja": "ul. Wallenroda 2F",
    "longitude": 22.5286475,
    "odp": "W odpowiedzi na wniosek o udzielenie informacji publicznej dotycz\u0105cej nieruchomo\u015bci po\u0142o\u017conej w Lublinie:  przy \tul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka \tgruntu o numerze ewidencyjnym 9/40, dla kt&oacute;rej S\u0105d Rejonowy \tLublin-Zach&oacute;d, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 \twieczyst\u0105 numer LU1I/00166541/3, \tprzy \tul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka \tgruntu o numerze ewidencyjnym 9/44, dla kt&oacute;rej S\u0105d Rejonowy \tLublin-Zach&oacute;d, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 \twieczyst\u0105 numer LU1I/00169902/3,  \t \t \tMiejski \tKonserwator Zabytk&oacute;w w Lublinie informuje: \t \t1. \tWskazane we wniosku nieruchomo\u015bci nie podlegaj\u0105 ochronie \tkonserwatorskiej na podstawie ustawy z dnia 23 lipca o ochronie \tzabytk&oacute;w i opiece nad zabytkami (Dz. U. 2014, poz. 1446, t.j.). Na \tprzedmiotowych dzia\u0142kach brak jest obiekt&oacute;w zabytkowych uj\u0119tych w \tGminnej Ewidencji Zabytk&oacute;w Miasta Lublin (GEZ). Wg aktualnej (na \tdzie\u0144 niniejszego pisma) wiedzy pracownik&oacute;w Biura MKZ, opartej na \tinformacjach jakie dotychczas zosta\u0142y oficjalnie przekazane z \tWojew&oacute;dzkiego Urz\u0119du Ochrony Zabytk&oacute;w w Lublinie, w Wojew&oacute;dzkiej \tEwidencji Zabytk&oacute;w, a co za tym idzie w GEZ, nie ma \u017cadnych \tstanowisk archeologicznych na obszarze dzia\u0142ek, kt&oacute;rych dotyczy \tprzedmiotowy wniosek. \t \t2. \tNie jest planowane obj\u0119cie ochron\u0105 konserwatorsk\u0105 przedmiotowych \tnieruchomo\u015bci. \t \t3. \tPrzedmiotowy teren le\u017cy na obszarze miasta posiadaj\u0105cym \tobowi\u0105zuj\u0105cy plan zagospodarowania przestrzennego &ndash; Uchwa\u0142a nr \t1688/LV/2002 z dnia 26 wrze\u015bnia 2002 r. ws. uchwalenia miejscowego \tplanu zagospodarowania przestrzennego miasta Lublin &ndash; cz\u0119\u015b\u0107 II \t(Dziennik Urz\u0119dowy Wojew&oacute;dztwa Lubelskiego z dnia 14 sierpnia 2008 \tr., Nr 97, poz. 2519), dost\u0119pna na stronie: \thttp://www.lublin.eu/Miejscowy_Plan_Zagospodarowania_Przestrzennego-1-663-3-344_397.html. \tJe\u017celi s\u0105 Pa\u0144stwo zainteresowani wyrysem i wypisem z mpzp nale\u017cy \tzwr&oacute;ci\u0107 si\u0119 do Wydzia\u0142u Planowania Urz\u0119du Miasta Lublin, ul. \tWieniawska 14, 20-071 Lublin. Wszelkie informacje dotycz\u0105ce tak\u017ce \twniesienia stosownej op\u0142aty znajd\u0105 Pa\u0144stwo na stronie: \thttp://www.um.lublin.eu/um/index.php?t=200&amp;id=50488.&nbsp;",
    "pyt": "Wnosz\u0119 o udzielenie informacji publicznej dotycz\u0105cej:- nieruchomo\u015bci po\u0142o\u017conej w Lublinie, przy ul. Wallenroda 2E- nieruchomo\u015bci po\u0142o\u017conej w Lublinie, przy ul. Wallenroda 2Fczy nieruchomo\u015bci wpisane s\u0105 do Gminnej Ewidencji Zabytk&oacute;w (GEZ) lub znajduj\u0105 si\u0119 na obszarze wpisanym do Gminnej Ewidencji Zabytk&oacute;w, lub czy planowane jest wpisanie nieruchomo\u015bci do GEZ lub obszaru na kt&oacute;rym znajduj\u0105 si\u0119 nieruchomo\u015bci?czy nieruchomo\u015bci obj\u0119te s\u0105 jakimkolwiek innym zakresem ochrony?czy rozwa\u017cane lub planowane jest obj\u0119cie nieruchomo\u015bci ochron\u0105 w jakiejkolwiek formie?",
    "wniosek": "nieruchomo\u015bci wpisanej do Gminnej Ewidencji Zabytk\u00f3w"
  },
  {
    "data": "7-7-2015",
    "id": 245921,
    "kom_org": "O\u015a",
    "latitude": 51.2398547,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245921",
    "lokalizacja": "ul. Wallenroda 2F",
    "longitude": 22.5286475,
    "odp": "Nawi\u0105zuj\u0105c do wniosku w sprawie udzielenia informacji publicznej o nieruchomo\u015bciach po\u0142o\u017conych przy ul. Wallenroda 2E i ul. Wallenroda 2F w Lublinie informuj\u0119, \u017ce dla powy\u017cszych nieruchomo\u015bci nie by\u0142a wydawana decyzja o \u015brodowiskowych uwarunkowaniach.&nbsp; ",
    "pyt": "Wnosz\u0119 o udzielenie informacji publicznej:- czy w odniesieniu do nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallendroda 2E i nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2F wydano jak\u0105kolwiek decyzj\u0119 o \u015brodowiskowych uwarunkowaniach.",
    "wniosek": "decyzji o \u015brodowiskowych uwarunkowaniach"
  },
  {
    "data": "7-7-2015",
    "id": 245921,
    "kom_org": "O\u015a",
    "latitude": 51.2400057,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=245921",
    "lokalizacja": "ul. Wallendroda 2E",
    "longitude": 22.5281694,
    "odp": "Nawi\u0105zuj\u0105c do wniosku w sprawie udzielenia informacji publicznej o nieruchomo\u015bciach po\u0142o\u017conych przy ul. Wallenroda 2E i ul. Wallenroda 2F w Lublinie informuj\u0119, \u017ce dla powy\u017cszych nieruchomo\u015bci nie by\u0142a wydawana decyzja o \u015brodowiskowych uwarunkowaniach.&nbsp; ",
    "pyt": "Wnosz\u0119 o udzielenie informacji publicznej:- czy w odniesieniu do nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallendroda 2E i nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Wallenroda 2F wydano jak\u0105kolwiek decyzj\u0119 o \u015brodowiskowych uwarunkowaniach.",
    "wniosek": "decyzji o \u015brodowiskowych uwarunkowaniach"
  },
  {
    "data": "30-6-2015",
    "id": 246617,
    "kom_org": "IR",
    "latitude": 51.2255443,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246617",
    "lokalizacja": "ul. Krochmalnej",
    "longitude": 22.5510918,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej dotycz\u0105cej realizacji zadania pod nazw\u0105: Budowa stadionu miejskiego w  Lublinie wraz z zagospodarowaniem przylegaj\u0105cego terenu w za\u0142\u0105czeniu przekazujemy nast\u0119puj\u0105ce dokumenty z zakresu dotycz\u0105cego:- &bdquo;zrealizowanych koszt&oacute;w ( budowy, wykonania ) - Zestawienie um&oacute;w wraz z kwotami na poszczeg&oacute;lne etapy realizacji (  dokumentacja, roboty budowlane, wyposa\u017cenie ) - &bdquo; planowanych koszt&oacute;w ( modernizacji, utrzymania )  - Studium wykonalno\u015bci wraz z aneksem oraz analiza finansowa. Odno\u015bnie zakresu dotycz\u0105cego &bdquo; realizowanych i planowanych przychod&oacute;w z tytu\u0142u u\u017cywania obiektu&rdquo; informujemy,&nbsp; \u017ce obiekt zosta\u0142 przekazany w u\u017cytkowanie operatorowi  - MOSiR &bdquo;Bystrzyca&rdquo; w Lublinie Sp. z o.o.  z siedzib\u0105 w Lublinie, ul. Filaret&oacute;w 44.&nbsp; W zwi\u0105zku z tym wszelkie wnioskowane informacje dotycz\u0105ce u\u017cytkowania obiektu  s\u0105 w posiadaniu operatora.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w nast\u0119puj\u0105cym zakresie: zrealizowane koszty (budowy i wykonania) i planowane koszty (modernizacji, utrzymania Stadionu Miejskiego w Lublinie przy ul. Krochmalnej oraz zrealizowane i planowane przychody z tytu\u0142u u\u017cywania obiektu.",
    "wniosek": "stadionu miejskiego przy ul. Krochmalnej"
  },
  {
    "data": "9-7-2015",
    "id": 246736,
    "kom_org": "AB",
    "latitude": 51.2119677,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246736",
    "lokalizacja": "ul. Romera 18",
    "longitude": 22.5434708,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w sprawie zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych (budowy ogrodzenia nieruchomo\u015bci) przez Wsp&oacute;lnot\u0119 Mieszkaniow\u0105 budynku mieszkalnego wielorodzinnego przy ul. Romera 18 przekazuje w za\u0142\u0105czeniu kopi\u0119 potwierdzenia przyj\u0119cia zg\u0142oszenia o przyst\u0105pieniu do rob&oacute;t budowlanych z dnia 19 czerwca 2012 r. znak: AB-ZA.6743.1.261.2012.   Informuj\u0119 jednocze\u015bnie, \u017ce pozosta\u0142e dokumenty znajduj\u0105ce si\u0119 w aktach sprawy mog\u0105 by\u0107 udost\u0119pnione tylko stronom post\u0119powania na podstawie art. 73 ustawy z dnia 14 czerwca 1960 r. Kodeks post\u0119powania administracyjnego (tekst jednolity Dz. U. 2013.267). Dotyczy to m.in. zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych. W sprawie  udost\u0119pniania zg\u0142oszenia zamiaru wykonania rob&oacute;t budowlanych wypowiedzia\u0142 si\u0119 Naczelny Sad Administracyjny, kt&oacute;ry w wyroku z dnia 12 czerwca 2013 r. I OSK 488/13 (Lex 1423875) uzna\u0142, \u017ce ww. zg\u0142oszenie nie ma cech dokumentu urz\u0119dowego i nie stanowi informacji publicznej w rozumieniu ustawy o dost\u0119pie do informacji publicznej.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej dotycz\u0105cej zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych znak: AB-ZA.6743.1.261.2012 z dnia 19.06.2012 r. z\u0142o\u017cone przez Wsp&oacute;lnot\u0119 Mieszkaniow\u0105 budynku mieszkalnego wielorodzinnego przy ul. Romera 18 w Lublinie.",
    "wniosek": "zg\u0142oszenia przyst\u0105pienia do rob\u00f3t budowlanych budynku mieszkalnego wielorodzinnego przy ul. Romera 18"
  },
  {
    "data": "17-7-2015",
    "id": 246773,
    "kom_org": "AB",
    "latitude": 51.2703551,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246773",
    "lokalizacja": "ul. Jemio\u0142owej",
    "longitude": 22.503112,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w sprawie wydanych pozwole\u0144 o warunkach zabudowy i pozwole\u0144 na budowy przekazuj\u0119 w za\u0142\u0105czeniu kopie decyzji o ustaleniu warunk&oacute;w zabudowy, dotycz\u0105cych dzia\u0142ek znajduj\u0105cych si\u0119 przy ul. Zbo\u017cowej /r&oacute;g ul. Jemio\u0142owej w latach 2012-1015:1) nr 211/13 z dnia 16 kwietnia 2013 r. znak: AB-LA-I.6730.615.2012,2) nr 361/14 z dnia 18 lipca 2014 r. znak: AB-LA-I.6730.214.2014,3) nr 581/14 z dnia 29 pa\u017adziernika 2014 r. znak: AB-LA_I.6730.344.2014,4) nr 253/15 z dnia 22 maja 2015 r. znak: AB-LA-I.6730.127.2015.",
    "pyt": "Czy w ci\u0105gu ostatnich 3 lat by\u0142y wydawane decyzje o warunkach zabudowy i decyzje o udzieleni pozwolenia na budow\u0119 dotycz\u0105ce dzia\u0142ek inwestycyjnych, znajduj\u0105cych si\u0119 w Lublinie przy ul. Zbo\u017cowej/r&oacute;g ul. Jemio\u0142owej ?Je\u015bli tak, prosz\u0119 o przes\u0142anie kopii wydanych decyzji lub udost\u0119pnienie do wgl\u0105du w urz\u0119dzie, w uzgodnionym terminie akt post\u0119powa\u0144 administracyjnych poprzedzaj\u0105cych wydanie tych decyzji.",
    "wniosek": "decyzji o warunkach zabudowy i udzieleniu pozwolenia na budow\u0119"
  },
  {
    "data": "17-7-2015",
    "id": 246773,
    "kom_org": "AB",
    "latitude": 51.2700508,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246773",
    "lokalizacja": "ul. Zbo\u017cowej",
    "longitude": 22.5053698,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji publicznej w sprawie wydanych pozwole\u0144 o warunkach zabudowy i pozwole\u0144 na budowy przekazuj\u0119 w za\u0142\u0105czeniu kopie decyzji o ustaleniu warunk&oacute;w zabudowy, dotycz\u0105cych dzia\u0142ek znajduj\u0105cych si\u0119 przy ul. Zbo\u017cowej /r&oacute;g ul. Jemio\u0142owej w latach 2012-1015:1) nr 211/13 z dnia 16 kwietnia 2013 r. znak: AB-LA-I.6730.615.2012,2) nr 361/14 z dnia 18 lipca 2014 r. znak: AB-LA-I.6730.214.2014,3) nr 581/14 z dnia 29 pa\u017adziernika 2014 r. znak: AB-LA_I.6730.344.2014,4) nr 253/15 z dnia 22 maja 2015 r. znak: AB-LA-I.6730.127.2015.",
    "pyt": "Czy w ci\u0105gu ostatnich 3 lat by\u0142y wydawane decyzje o warunkach zabudowy i decyzje o udzieleni pozwolenia na budow\u0119 dotycz\u0105ce dzia\u0142ek inwestycyjnych, znajduj\u0105cych si\u0119 w Lublinie przy ul. Zbo\u017cowej/r&oacute;g ul. Jemio\u0142owej ?Je\u015bli tak, prosz\u0119 o przes\u0142anie kopii wydanych decyzji lub udost\u0119pnienie do wgl\u0105du w urz\u0119dzie, w uzgodnionym terminie akt post\u0119powa\u0144 administracyjnych poprzedzaj\u0105cych wydanie tych decyzji.",
    "wniosek": "decyzji o warunkach zabudowy i udzieleniu pozwolenia na budow\u0119"
  },
  {
    "data": "7-7-2015",
    "id": 246794,
    "kom_org": "AB",
    "latitude": 51.2400057,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246794",
    "lokalizacja": "ul. Wallenroda 2E",
    "longitude": 22.5281694,
    "odp": "W odpowiedzi na wniosek o udzielenie informacji publicznej o nieruchomo\u015bciach po\u0142o\u017conych w Lublinie przy ul Wallenroda 2E i Wallenroda 2F przesy\u0142am w za\u0142\u0105czeniu kopie decyzji znajduj\u0105cych si\u0119 w zasobie akt budowlanych Wydzia\u0142u Architektury i Budownictwa:1) nr 383 z dnia 26 czerwca 2002 r. o ustaleniu warunk&oacute;w zabudowy i zagospodarowania terenu&nbsp; przy ul. Wallenroda 2E(znak: AAB.1.TW/733/565/200 /182),2) nr 146 z dnia 10 kwietnia 2003 r. w sprawie zatwierdzenia projektu budowlanego i udzielenia pozwolenia na budow\u0119 budynku biurowous\u0142ugowego przy ul. Wallenroda 2E (znak: AAB.II-1.ED/7353/85/03),3) nr 144/223 z dnia 15 marca 2004 r. w sprawie zmiany decyzji nr 146 w zakresie przedstawionym w projekcie zamiennymznak: AAB.II.ED.1.7353/287/04),4) nr 269/425 z dnia 26 kwietnia 2004 r. w sprawie zatwierdzenia projektu budowlanego i udzielenia pozwolenia na budow\u0119 budynku biurowous\u0142ugowego przy ul. Wallenroda 2F (znak: AAB.II-1.ED/7353/404/04),5) z dnia 23 listopada 2004 r. w sprawie przeniesienia warunk&oacute;w zawartych w decyzji nr 269/425 z dnia 26 kwietnia 2004 r.(znak: AAB.ED.II-1.7353/1091/04),6) nr 305/525 z dnia 30 maja 2005 r. w sprawie zmiany decyzji nr 269/425 w zakresie przedstawionym w projekcie zamiennym (znak:AAB.II.ED.1.7353/469/05).W przypadku decyzji nr 383 i 146 udost\u0119pnienie nast\u0119puje po dokonaniu anonimizacji danych osobowych.Informuj\u0119 ponadto, \u017ce dla ww. nieruchomo\u015bci po\u0142o\u017conych przy ul. Walleroda niewydano decyzji o ustaleniu lokalizacji inwestycji celu publicznego. Rejon ul. Walleroda zosta\u0142 obj\u0119ty w listopadzie 2002 r. miejscowym planem zagospodarowania przestrzennego uchwalonym w dniu 26 wrze\u015bnia 2002 r. przez Rad\u0119 Miejsk\u0105 w Lublinie (Uchwa\u0142a Nr 1688/LV/2002 w sprawie Miejscowego planu zagospodarowania przestrzennego miasta Lublina - cz\u0119\u015b\u0107 II, Dz. Urz. Wojew&oacute;dztwa Lubelskiego 2002.124.2671 z dnia 24 pa\u017adziernika 2002 r. - http://bip.lublin.eu/bip/um/index.php?t=200&amp;id=22028). Po wej\u015bciu w \u017cycie ww. planu zagospodarowania przestrzennego nie s\u0105 wydawane decyzje o ustaleniu warunk&oacute;w zabudowy i zagospodarowania terenu.",
    "pyt": "Czy w odniesieniu do nieruchomo\u015bci po\u0142o\u017conej w Lublinie:- przy ul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/40, dla kt&oacute;rej S\u0105d Rejonowy Lublin-zach&oacute;d w Lublinie, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 numer LU1I/00166541/3,- przy ul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze  ewidencyjnym 9/444, dla kt&oacute;rej S\u0105d Rejonowy Lublin-zach&oacute;d w Lublinie, X  Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 numer  LU1I/00169902/3,wydano decyzj\u0119 o zatwierdzeniu projektu budowlanego lub decyzj\u0119 o warunkach zabudowy lub decyzj\u0119 o wydaniu pozwolenia na budow\u0119/rozbi&oacute;rk\u0119 obiekt&oacute;w znajduj\u0105cych si\u0119 na nieruchomo\u015bciach?&nbsp; Wnosz\u0119 r&oacute;wnie\u017c o udzielenie informacji czy w odniesieniu do nieruchomo\u015bci wydano decyzj\u0119 o ustaleniu lokalizacji inwestycji celu publicznego.Jednocze\u015bnie prosz\u0119 o przekazanie kopii rzeczonych dokument&oacute;w. &nbsp;",
    "wniosek": "nieruchomo\u015bci przy ul. Wallenroda 2E i Wallenroda 2F"
  },
  {
    "data": "7-7-2015",
    "id": 246794,
    "kom_org": "AB",
    "latitude": 51.2398547,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246794",
    "lokalizacja": "ul. Wallenroda 2F",
    "longitude": 22.5286475,
    "odp": "W odpowiedzi na wniosek o udzielenie informacji publicznej o nieruchomo\u015bciach po\u0142o\u017conych w Lublinie przy ul Wallenroda 2E i Wallenroda 2F przesy\u0142am w za\u0142\u0105czeniu kopie decyzji znajduj\u0105cych si\u0119 w zasobie akt budowlanych Wydzia\u0142u Architektury i Budownictwa:1) nr 383 z dnia 26 czerwca 2002 r. o ustaleniu warunk&oacute;w zabudowy i zagospodarowania terenu&nbsp; przy ul. Wallenroda 2E(znak: AAB.1.TW/733/565/200 /182),2) nr 146 z dnia 10 kwietnia 2003 r. w sprawie zatwierdzenia projektu budowlanego i udzielenia pozwolenia na budow\u0119 budynku biurowous\u0142ugowego przy ul. Wallenroda 2E (znak: AAB.II-1.ED/7353/85/03),3) nr 144/223 z dnia 15 marca 2004 r. w sprawie zmiany decyzji nr 146 w zakresie przedstawionym w projekcie zamiennymznak: AAB.II.ED.1.7353/287/04),4) nr 269/425 z dnia 26 kwietnia 2004 r. w sprawie zatwierdzenia projektu budowlanego i udzielenia pozwolenia na budow\u0119 budynku biurowous\u0142ugowego przy ul. Wallenroda 2F (znak: AAB.II-1.ED/7353/404/04),5) z dnia 23 listopada 2004 r. w sprawie przeniesienia warunk&oacute;w zawartych w decyzji nr 269/425 z dnia 26 kwietnia 2004 r.(znak: AAB.ED.II-1.7353/1091/04),6) nr 305/525 z dnia 30 maja 2005 r. w sprawie zmiany decyzji nr 269/425 w zakresie przedstawionym w projekcie zamiennym (znak:AAB.II.ED.1.7353/469/05).W przypadku decyzji nr 383 i 146 udost\u0119pnienie nast\u0119puje po dokonaniu anonimizacji danych osobowych.Informuj\u0119 ponadto, \u017ce dla ww. nieruchomo\u015bci po\u0142o\u017conych przy ul. Walleroda niewydano decyzji o ustaleniu lokalizacji inwestycji celu publicznego. Rejon ul. Walleroda zosta\u0142 obj\u0119ty w listopadzie 2002 r. miejscowym planem zagospodarowania przestrzennego uchwalonym w dniu 26 wrze\u015bnia 2002 r. przez Rad\u0119 Miejsk\u0105 w Lublinie (Uchwa\u0142a Nr 1688/LV/2002 w sprawie Miejscowego planu zagospodarowania przestrzennego miasta Lublina - cz\u0119\u015b\u0107 II, Dz. Urz. Wojew&oacute;dztwa Lubelskiego 2002.124.2671 z dnia 24 pa\u017adziernika 2002 r. - http://bip.lublin.eu/bip/um/index.php?t=200&amp;id=22028). Po wej\u015bciu w \u017cycie ww. planu zagospodarowania przestrzennego nie s\u0105 wydawane decyzje o ustaleniu warunk&oacute;w zabudowy i zagospodarowania terenu.",
    "pyt": "Czy w odniesieniu do nieruchomo\u015bci po\u0142o\u017conej w Lublinie:- przy ul. Wallenroda 2E, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze ewidencyjnym 9/40, dla kt&oacute;rej S\u0105d Rejonowy Lublin-zach&oacute;d w Lublinie, X Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 numer LU1I/00166541/3,- przy ul. Wallenroda 2F, oznaczonej w rejestrze grunt&oacute;w jako dzia\u0142ka gruntu o numerze  ewidencyjnym 9/444, dla kt&oacute;rej S\u0105d Rejonowy Lublin-zach&oacute;d w Lublinie, X  Wydzia\u0142 Ksi\u0105g Wieczystych prowadzi ksi\u0119g\u0119 wieczyst\u0105 numer  LU1I/00169902/3,wydano decyzj\u0119 o zatwierdzeniu projektu budowlanego lub decyzj\u0119 o warunkach zabudowy lub decyzj\u0119 o wydaniu pozwolenia na budow\u0119/rozbi&oacute;rk\u0119 obiekt&oacute;w znajduj\u0105cych si\u0119 na nieruchomo\u015bciach?&nbsp; Wnosz\u0119 r&oacute;wnie\u017c o udzielenie informacji czy w odniesieniu do nieruchomo\u015bci wydano decyzj\u0119 o ustaleniu lokalizacji inwestycji celu publicznego.Jednocze\u015bnie prosz\u0119 o przekazanie kopii rzeczonych dokument&oacute;w. &nbsp;",
    "wniosek": "nieruchomo\u015bci przy ul. Wallenroda 2E i Wallenroda 2F"
  },
  {
    "data": "10-7-2015",
    "id": 246827,
    "kom_org": "GM",
    "latitude": 51.243497,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=246827",
    "lokalizacja": "ul. Dolnej Panny",
    "longitude": 22.5610553,
    "odp": "W odpowiedzi na wniosek&nbsp; o dost\u0119pie do informacji publicznej w sprawie zaleg\u0142o\u015bci czynszowych za dzier\u017caw\u0119 nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Dolnej Panny Marii informuj\u0119 \u017ce:By\u0142y dzier\u017cawca nieruchomo\u015bci po\u0142o\u017conej przy ul. Dolnej Panny Marii, oznaczonej w ewidencji grunt&oacute;w miasta Lublin jako: cz. dz. nr 128/1, dz. 128/2, cz. dz. nr 128/5, (obr. 34, ark. 7) przeznaczonej na prowadzenie p\u0142atnego parkingu strze\u017conego, posiada na dzie\u0144 21.07.2015 roku zaleg\u0142o\u015bci czynszowe, nale\u017cno\u015b\u0107 g\u0142&oacute;wna w wysoko\u015bci&nbsp; 79816,86 z\u0142 (s\u0142ownie: siedemdziesi\u0105t dziewi\u0119\u0107 tysi\u0119cy osiemset szesna\u015bcie z\u0142otych 86/100) plus odsetki w wysoko\u015bci 8200,89 z\u0142 (s\u0142ownie: osiem tysi\u0119cy dwie\u015bcie z\u0142otych 89/100).Wyja\u015bniam, \u017ce Gmina Lublin, w oparciu o przepisy kodeksu cywilnego, podj\u0119\u0142a na drodze s\u0105dowej, dzia\u0142ania dotycz\u0105ce wyegzekwowania nale\u017cnych Gminie Lublin po\u017cytk&oacute;w oraz wydania nieruchomo\u015bci.",
    "pyt": "Czy istnieje zaleg\u0142o\u015b\u0107 w op\u0142atach czynszowych za dzier\u017caw\u0119 parkingu przy ul. Dolnej Panny Marii oraz w jakiej jest wysoko\u015bci ?",
    "wniosek": "zaleg\u0142o\u015bci czynszowych za dzier\u017caw\u0119 nieruchomo\u015bci przy ul. Dolnej Panny Marii"
  },
  {
    "data": "6-8-2015",
    "id": 247912,
    "kom_org": "O\u015a",
    "latitude": 51.4693153,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=247912",
    "lokalizacja": "ul. Zwyci\u0119stwa 58",
    "longitude": 22.5885046,
    "odp": "Odpowiadaj\u0105c na wniosek o udost\u0119pnienie informacji publicznej z dnia 6 sierpnia 2015 r. w sprawie wsp&oacute;\u0142pracy z Inspektoratem Towarzystwa Ochrony Zwierz\u0105t &bdquo;ANIMALS&rdquo; w Bia\u0142ogardzie, ul. Zwyci\u0119stwa 58 informuj\u0119, \u017ce Gmina Lublin nie posiada \u017cadnych um&oacute;w podpisanych z ww. podmiotem, jak r&oacute;wnie\u017c nie by\u0142y mu udzielane \u017cadne dotacje na dzia\u0142alno\u015b\u0107 zwi\u0105zan\u0105 z ochron\u0105 zwierz\u0105t. ",
    "pyt": "W zwi\u0105zku z rozwi\u0105zaniem porozumienia dotycz\u0105cego prowadzenia schroniska na terenie Miasta Bia\u0142ogard, zwracam si\u0119 z pro\u015bb\u0105 o udost\u0119pnienie nast\u0119puj\u0105cej informacji publicznej:- czy Urz\u0105d ma podpisan\u0105, jak\u0105kolwiek umow\u0119, dotacj\u0119 z Inspektoratem Towarzystwa Ochrony Zwierz\u0105t &bdquo;ANIMALS&rdquo; w Bia\u0142ogardzie, ul. Zwyci\u0119stwa 58,- je\u017celi Urz\u0105d podpisa\u0142 tak\u0105 umow\u0119 to, na jaki okres zosta\u0142a ona podpisana i na jak\u0105 kwot\u0119 &ndash; prosz\u0119 o skan takiej umowy,- je\u017celi Urz\u0105d podpisa\u0142 tak\u0105 umow\u0119 to prosz\u0119 o informacj\u0119, jakie Pa\u0144stwo podejm\u0105 kroki w zwi\u0105zku z pismem de facto zabraniaj\u0105cym Inspektorat Towarzystwa Ochrony Zwierz\u0105t &bdquo;ANIMALS&rdquo; w Bia\u0142ogardzie, ul. Zwyci\u0119stwa 58 prowadzenie schroniska, a co za tym idzie wo\u017cenia do Miasta Bia\u0142ogard ps&oacute;w z Pa\u0144stwa terenu - je\u017celi kroki b\u0119d\u0105 podj\u0119te w okresie p&oacute;\u017aniejszym to prosz\u0119 o tak\u0105 informacj\u0119 wraz z skanem dokument&oacute;w przes\u0142anych do Inspektorat Towarzystwa Ochrony Zwierz\u0105t &bdquo;ANIMALS&rdquo; w Bia\u0142ogardzie, ul. Zwyci\u0119stwa 58.",
    "wniosek": "schroniska dla zwierz\u0105t na terenie miasta Bia\u0142ograd"
  },
  {
    "data": "18-8-2015",
    "id": 248066,
    "kom_org": "GM",
    "latitude": 51.242399,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248066",
    "lokalizacja": "ul. Rogi\u0144skiego 25",
    "longitude": 22.4960756,
    "odp": "Odpowiadaj\u0105c na wniosek o udost\u0119pnienie informacji publicznej w sprawie post\u0119powa\u0144 o zwrot nieruchomo\u015bci stanowi\u0105cej w\u0142asno\u015b\u0107 Gminy Lublin, po\u0142o\u017conej w Lublinie przy ul. Rogi\u0144skiego 25, oznaczonej jako dzia\u0142ka ewidencyjna nr 149/2 (obr\u0119b 25, arkusz 5) informuj\u0119, ze toczy si\u0119 jedno post\u0119powanie o zwrot przedmiotowej nieruchomo\u015bci w trybie okre\u015blonym w przepisach rozdzia\u0142u 6 dzia\u0142u III ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami.Jednocze\u015bnie wyja\u015bniam, \u017ce stosownie do art. 142 ust. 2 ustawy o gospodarce nieruchomo\u015bciami, w sprawach zwrot&oacute;w wyw\u0142aszczonych nieruchomo\u015bci, zwrot&oacute;w odszkodowania, w tym tak\u017ce nieruchomo\u015bci zamiennej oraz rozlicze\u0144 z tytu\u0142u zwrotu i termin&oacute;w zwrotu, w kt&oacute;rych stron\u0105 post\u0119powania jest gmina lub powiat, prezydent miasta na prawach powiatu sprawuj\u0105cy funkcj\u0119 starosty podlega wy\u0142\u0105czeniu na zasadach okre\u015blonych w rozdziale 5 dzia\u0142u I Kodeksu post\u0119powania administracyjnego. Na tej podstawie Wojewoda Lubelski wy\u0142\u0105czy\u0142 Prezydenta Miasta Lublin od prowadzenia post\u0119powania o zwrot nieruchomo\u015bci Gminy Lublin, stanowi\u0105cej dzia\u0142k\u0119 nr 149/2 i wyznaczy\u0142 do jej prowadzenia Starost\u0119 Lubelskiego. Gmina Lublin, zgodnie z art. 28 k.p.a., jest stron\u0105 post\u0119powania o zwrot w/w dzia\u0142ki.Po przeprowadzeniu post\u0119powania Starosta Lubelski orzek\u0142 zwrot przedmiotowej nieruchomo\u015bci. Od decyzji Starosty Lubelskiego Gmina Lublin odwo\u0142a\u0142a si\u0119 do Wojewody Lubelskiego, kt&oacute;ry utrzyma\u0142 w mocy zaskar\u017cona decyzj\u0119. Po rozpoznaniu skargi Gminy Lublin na decyzje Wojewody Lubelskiego, Wojew&oacute;dzki S\u0105d Administracyjny w Lublinie w sprawie prowadzonej pod sygnatur\u0105 II SA/Lu 574/14 uchyli\u0142 zaskar\u017cona decyzj\u0119 Wojewody Lubelskiego i poprzedzaj\u0105ca j\u0105 decyzje Starosty Lubelskiego. Wed\u0142ug informacji posiadanej przez Urz\u0105d Miasta Lublin wnioskodawcy z\u0142o\u017cyli skarg\u0119 kasacyjn\u0105 od wyroku Wojew&oacute;dzkiego S\u0105du Administracyjnego w Lublinie do Naczelnego S\u0105du Administracyjnego w Warszawie. ",
    "pyt": "Wnosz\u0119 o udzielenie informacji publicznej dotycz\u0105cej nieruchomo\u015bci po\u0142o\u017conej w Lublinie przy ul. Rogi\u0144skiego 25 w nast\u0119puj\u0105cym zakresie:Czy byli w\u0142a\u015bciciele w/w nieruchomo\u015bci lub ich spadkobiercy lub ktokolwiek inny wyst\u0105pi\u0142 do Urz\u0119du Miasta o jej zwrot na w\u0142asn\u0105 rzecz w oparciu o przepisy ustawy z dnia 21 sierpnia 1997 r. o gospodarce nieruchomo\u015bciami lub na podstawie innych przepis&oacute;w.",
    "wniosek": "zwrotu nieruchomo\u015bci przy ul. Rogi\u0144skiego 25"
  },
  {
    "data": "14-8-2015",
    "id": 248353,
    "kom_org": "GM",
    "latitude": 51.2192271,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248353",
    "lokalizacja": "ul. Smoluchowskiego",
    "longitude": 22.5599502,
    "odp": " W odpowiedzi na pytanie zadane w oparciu o przepisy ustawy z dnia 6&nbsp;wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz.&nbsp;782z p&oacute;\u017a\u0144. zm) informuj\u0119:  \tAd. 1  \tWykaz um&oacute;w dzier\u017cawy gara\u017cy po\u0142o\u017conych w rejonie ul. Smoluchowskiego:     \t\t \t\t\t \t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\tL.p. \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tDane \t\t\t\t\tewidencyjne nieruchomo\u015bci \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tNr \t\t\t\t\tumowy dzier\u017cawy \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t1 \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tdz. \t\t\t\t\tnr 1/16 (obr. 43, ark. 15) \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t216/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t53/GM/15 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t54/GM/15 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t203/GM/12 \t\t\t\t \t\t\t \t\t\t \t\t\t\t&nbsp; \t\t\t\t&nbsp; \t\t\t\t&nbsp; \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t2 \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tdz. \t\t\t\t\tnr 1/18 (obr. 43, ark. 15) \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t31/GM/15 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t140/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t90/GM/15 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t97/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t3 \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tdz. \t\t\t\t\tnr 76/10 (obr. 43, ark. 14) \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t94/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t122/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t123/GM/12 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t139/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t233/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t65/GM/11 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t4 \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\tdz. \t\t\t\t\tnr 1/22 (obr. 43, ark. 15) \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t104/GM/14 \t\t\t\t \t\t\t \t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t \t\t\t\t \t\t\t\t \t\t\t\t\t \t\t\t\t\t103/GM/14 \t\t\t\t \t\t\t \t\t \t     \tAd. 2  \tW za\u0142\u0105czeniu przekazuj\u0119 tre\u015b\u0107 um&oacute;w.  \tWyja\u015bniam, \u017ce zgodnie z ustaw\u0105 z dnia 29 sierpnia 1997 r. o ochronie danych osobowych (Dz. U. z 2014 r., poz. 1182 z p&oacute;\u017a\u0144. zm), dane osoby fizycznej &ndash; Kontrahenta Gminy Lublin &ndash; na kt&oacute;rej rzecz zosta\u0142a wydzier\u017cawiona nieruchomo\u015b\u0107 gminna nie podlegaj\u0105 ujawnieniu. W za\u0142\u0105czeniu przekazuj\u0119 kopie ww. um&oacute;w po dokonaniu ich anonimizacji, zgodnie z&nbsp;art. 5 ust. 2 ustawy o dost\u0119pie do informacji publicznej (Dz. U. z 2014 r., poz.&nbsp;782 z p&oacute;\u017a\u0144. zm).",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w nast\u0119puj\u0105cym zakresie: 1) wykaz oraz skany wszystkich um&oacute;w dzier\u017cawy gara\u017cy po\u0142o\u017conych w rejonie ul. Smoluchowskiego, znajduj\u0105cych si\u0119 aktualnie w obszarze dzia\u0142ek: nr 1/16 obr\u0119b 43 Wrotk&oacute;w, arkusz 15 nr 1/22 obr\u0119b 43 Wrotk&oacute;w, arkusz  15nr 1/18 obr\u0119b 43 Wrotk&oacute;w, arkusz 15nr  76/10, obr\u0119b 43 Wrotk&oacute;w, arkusz 14 zawartych przez Gmin\u0119 Lublin przed  zmian\u0105 stanu w\u0142asno\u015bciowego. Prosz\u0119 o przyporz\u0105dkowanie konkretnych um&oacute;w  dzier\u017cawy do konkretnych dzia\u0142ek.2) udost\u0119pnienie tre\u015bci um&oacute;w nr:36/GM/1468/GM/1493/GM/14100/GM/1495/GM/14104/GM/1498/GM/14103/GM/1496/GM/14102/GM/1499/GM/14114/GM/1494/GM/1497/GM/14101/GM/14115/GM/14123/GM/14121/GM/14 &nbsp;&nbsp; &nbsp;122/GM/14116/GM/14117/GM/14118/GM/14120/GM/14140/GM/14139/GM/14177/GM/14183/GM/14195/GM/14 &nbsp;&nbsp; &nbsp;217/GM/14225/GM/14228/GM/14238/GM/14266/GM/14 &nbsp;&nbsp; &nbsp;272/GM/1423/GM/1542/GM/1553/GM/1578/GM/1582/GM/1579/GM/1583/GM/15103/GM/15 &nbsp;&nbsp; &nbsp;106/GM/15133/GM/15135/GM/15145/GM/15147/GM/15174/GM/15183/GM/15w formie skan&oacute;w tre\u015bci um&oacute;w.",
    "wniosek": "wykazu oraz skan&oacute;w um&oacute;w dzier\u017cawy gara\u017cy po\u0142o\u017conych w rejonie ul. Smoluchowskiego"
  },
  {
    "data": "27-8-2015",
    "id": 248543,
    "kom_org": "OR",
    "latitude": 51.234744,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248543",
    "lokalizacja": "al. Kra\u015bnickiej",
    "longitude": 22.4895635,
    "odp": "Odpowiadaj\u0105c na powy\u017csze pytania informuj\u0119, i\u017c Prezydent Miasta Lublin nie posiada \u017c\u0105danych informacji.Zgodnie z podstawow\u0105 zasad\u0105 dost\u0119pu do informacji publicznej, ustalon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej, obowi\u0105zane do udost\u0119pniania informacji publicznej s\u0105 podmioty b\u0119d\u0105ce w posiadaniu tych informacji. W wyroku z dnia 26 wrze\u015bnia 2003 r., II SA 1852/03, w sprawie przeciwko Krajowej Radzie Pracowniczych Ogr&oacute;dk&oacute;w Dzia\u0142kowych, Naczelny S\u0105d Administracyjny stwierdzi\u0142, \u017ce udost\u0119pnienie mo\u017ce dotyczy\u0107 tylko informacji publicznej, kt&oacute;r\u0105 dana instytucja posiada, a nie tej, kt&oacute;r\u0105 powinna posiada\u0107 (D. Frey, Dzia\u0142kowcy to nie detektywi. Udost\u0119pnianie informacji publicznej, &quot;Rzeczpospolita&quot; z dnia 27-28 wrze\u015bnia 2003 r., nr 226). Ponadto cyt. ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. Organ nie pozostaje zatem w bezczynno\u015bci w sytuacji, gdy poinformuje wnioskodawc\u0119, i\u017c nie dysponuje \u017c\u0105dan\u0105 informacj\u0105 publiczn\u0105 (por. wyrok Wojew&oacute;dzkiego S\u0105du Administracyjnego w Warszawie z dnia 22 marca 2012 r., II SAB/Wa 32/12, LEX nr 1133382).Rada Miasta Lublin uchwa\u0142\u0105 nr 80/VIII/2011 z dnia 31 marca 2011 r. przekaza\u0142a do wy\u0142\u0105cznej kompetencji gminnej jednostki bud\u017cetowej pod nazw\u0105 Zarz\u0105d Dr&oacute;g i Most&oacute;w w Lublinie m. in.: sprawy: zarz\u0105dzania ruchem na drogach publicznych z wy\u0142\u0105czeniem autostrad i dr&oacute;g ekspresowych oraz na drogach wewn\u0119trznych.Wszelkie zatem kwestie dotycz\u0105ce inwestycji zwi\u0105zanych z drogami publicznymi w tym w zakresie sygnalizacji \u015bwietlnej nale\u017c\u0105 do w\u0142a\u015bciwo\u015bci wymienionej wy\u017cej jednostki organizacyjnej Miasta Lublin.W zwi\u0105zku z tym, \u017ce ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku o udost\u0119pnienie informacji publicznej do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci, w celu uzyskania odpowiedzi na&nbsp; wniosek, proponuj\u0119 zwr&oacute;ci\u0107 si\u0119 do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie (20-401 Lublin, ul. Krochmalna 13J, tel. 81 466 57 00, adres email: drogi@zdm.lublin.eu).",
    "pyt": "Wnosz\u0119 u udzielenie odpowiedzi na pytania:jaki by\u0142 koszt wymiany sygnalizacji \u015bwietlnej na skrzy\u017cowaniu al. Kra\u015bnickiej i ul. Wojciechowskiej oraz ul. Na\u0142\u0119czowskiej i ul. G\u0142\u0119bokiej?jakie ustawienia/konfiguracje \u015bwiate\u0142 zosta\u0142y wykorzystane od momentu ustawienia nowej sygnalizacji oraz jakie s\u0105 w planach? Jakie zachodzi\u0142y/ b\u0119d\u0105 zachodzi\u0107 mi\u0119dzy nimi r&oacute;\u017cnice?jakie wnioski i analizy zosta\u0142y odnotowane z wykorzystanych konfiguracji \u015bwiate\u0142?czy Gmina Lublin ponosi koszty zwi\u0105zane z ka\u017cdorazow\u0105 zmian\u0105 ustawienia \u015bwiate\u0142?",
    "wniosek": "sygnalizacji \u015bwietlnej na ul. al. Kra\u015bnickiej"
  },
  {
    "data": "27-8-2015",
    "id": 248543,
    "kom_org": "OR",
    "latitude": 51.2470824,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248543",
    "lokalizacja": "ul. Wojciechowskiej",
    "longitude": 22.5018747,
    "odp": "Odpowiadaj\u0105c na powy\u017csze pytania informuj\u0119, i\u017c Prezydent Miasta Lublin nie posiada \u017c\u0105danych informacji.Zgodnie z podstawow\u0105 zasad\u0105 dost\u0119pu do informacji publicznej, ustalon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej, obowi\u0105zane do udost\u0119pniania informacji publicznej s\u0105 podmioty b\u0119d\u0105ce w posiadaniu tych informacji. W wyroku z dnia 26 wrze\u015bnia 2003 r., II SA 1852/03, w sprawie przeciwko Krajowej Radzie Pracowniczych Ogr&oacute;dk&oacute;w Dzia\u0142kowych, Naczelny S\u0105d Administracyjny stwierdzi\u0142, \u017ce udost\u0119pnienie mo\u017ce dotyczy\u0107 tylko informacji publicznej, kt&oacute;r\u0105 dana instytucja posiada, a nie tej, kt&oacute;r\u0105 powinna posiada\u0107 (D. Frey, Dzia\u0142kowcy to nie detektywi. Udost\u0119pnianie informacji publicznej, &quot;Rzeczpospolita&quot; z dnia 27-28 wrze\u015bnia 2003 r., nr 226). Ponadto cyt. ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. Organ nie pozostaje zatem w bezczynno\u015bci w sytuacji, gdy poinformuje wnioskodawc\u0119, i\u017c nie dysponuje \u017c\u0105dan\u0105 informacj\u0105 publiczn\u0105 (por. wyrok Wojew&oacute;dzkiego S\u0105du Administracyjnego w Warszawie z dnia 22 marca 2012 r., II SAB/Wa 32/12, LEX nr 1133382).Rada Miasta Lublin uchwa\u0142\u0105 nr 80/VIII/2011 z dnia 31 marca 2011 r. przekaza\u0142a do wy\u0142\u0105cznej kompetencji gminnej jednostki bud\u017cetowej pod nazw\u0105 Zarz\u0105d Dr&oacute;g i Most&oacute;w w Lublinie m. in.: sprawy: zarz\u0105dzania ruchem na drogach publicznych z wy\u0142\u0105czeniem autostrad i dr&oacute;g ekspresowych oraz na drogach wewn\u0119trznych.Wszelkie zatem kwestie dotycz\u0105ce inwestycji zwi\u0105zanych z drogami publicznymi w tym w zakresie sygnalizacji \u015bwietlnej nale\u017c\u0105 do w\u0142a\u015bciwo\u015bci wymienionej wy\u017cej jednostki organizacyjnej Miasta Lublin.W zwi\u0105zku z tym, \u017ce ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku o udost\u0119pnienie informacji publicznej do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci, w celu uzyskania odpowiedzi na&nbsp; wniosek, proponuj\u0119 zwr&oacute;ci\u0107 si\u0119 do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie (20-401 Lublin, ul. Krochmalna 13J, tel. 81 466 57 00, adres email: drogi@zdm.lublin.eu).",
    "pyt": "Wnosz\u0119 u udzielenie odpowiedzi na pytania:jaki by\u0142 koszt wymiany sygnalizacji \u015bwietlnej na skrzy\u017cowaniu al. Kra\u015bnickiej i ul. Wojciechowskiej oraz ul. Na\u0142\u0119czowskiej i ul. G\u0142\u0119bokiej?jakie ustawienia/konfiguracje \u015bwiate\u0142 zosta\u0142y wykorzystane od momentu ustawienia nowej sygnalizacji oraz jakie s\u0105 w planach? Jakie zachodzi\u0142y/ b\u0119d\u0105 zachodzi\u0107 mi\u0119dzy nimi r&oacute;\u017cnice?jakie wnioski i analizy zosta\u0142y odnotowane z wykorzystanych konfiguracji \u015bwiate\u0142?czy Gmina Lublin ponosi koszty zwi\u0105zane z ka\u017cdorazow\u0105 zmian\u0105 ustawienia \u015bwiate\u0142?",
    "wniosek": "sygnalizacji \u015bwietlnej na ul. al. Kra\u015bnickiej"
  },
  {
    "data": "27-8-2015",
    "id": 248543,
    "kom_org": "OR",
    "latitude": 51.2437601,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248543",
    "lokalizacja": "ul. G\u0142\u0119bokiej",
    "longitude": 22.5360351,
    "odp": "Odpowiadaj\u0105c na powy\u017csze pytania informuj\u0119, i\u017c Prezydent Miasta Lublin nie posiada \u017c\u0105danych informacji.Zgodnie z podstawow\u0105 zasad\u0105 dost\u0119pu do informacji publicznej, ustalon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej, obowi\u0105zane do udost\u0119pniania informacji publicznej s\u0105 podmioty b\u0119d\u0105ce w posiadaniu tych informacji. W wyroku z dnia 26 wrze\u015bnia 2003 r., II SA 1852/03, w sprawie przeciwko Krajowej Radzie Pracowniczych Ogr&oacute;dk&oacute;w Dzia\u0142kowych, Naczelny S\u0105d Administracyjny stwierdzi\u0142, \u017ce udost\u0119pnienie mo\u017ce dotyczy\u0107 tylko informacji publicznej, kt&oacute;r\u0105 dana instytucja posiada, a nie tej, kt&oacute;r\u0105 powinna posiada\u0107 (D. Frey, Dzia\u0142kowcy to nie detektywi. Udost\u0119pnianie informacji publicznej, &quot;Rzeczpospolita&quot; z dnia 27-28 wrze\u015bnia 2003 r., nr 226). Ponadto cyt. ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. Organ nie pozostaje zatem w bezczynno\u015bci w sytuacji, gdy poinformuje wnioskodawc\u0119, i\u017c nie dysponuje \u017c\u0105dan\u0105 informacj\u0105 publiczn\u0105 (por. wyrok Wojew&oacute;dzkiego S\u0105du Administracyjnego w Warszawie z dnia 22 marca 2012 r., II SAB/Wa 32/12, LEX nr 1133382).Rada Miasta Lublin uchwa\u0142\u0105 nr 80/VIII/2011 z dnia 31 marca 2011 r. przekaza\u0142a do wy\u0142\u0105cznej kompetencji gminnej jednostki bud\u017cetowej pod nazw\u0105 Zarz\u0105d Dr&oacute;g i Most&oacute;w w Lublinie m. in.: sprawy: zarz\u0105dzania ruchem na drogach publicznych z wy\u0142\u0105czeniem autostrad i dr&oacute;g ekspresowych oraz na drogach wewn\u0119trznych.Wszelkie zatem kwestie dotycz\u0105ce inwestycji zwi\u0105zanych z drogami publicznymi w tym w zakresie sygnalizacji \u015bwietlnej nale\u017c\u0105 do w\u0142a\u015bciwo\u015bci wymienionej wy\u017cej jednostki organizacyjnej Miasta Lublin.W zwi\u0105zku z tym, \u017ce ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku o udost\u0119pnienie informacji publicznej do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci, w celu uzyskania odpowiedzi na&nbsp; wniosek, proponuj\u0119 zwr&oacute;ci\u0107 si\u0119 do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie (20-401 Lublin, ul. Krochmalna 13J, tel. 81 466 57 00, adres email: drogi@zdm.lublin.eu).",
    "pyt": "Wnosz\u0119 u udzielenie odpowiedzi na pytania:jaki by\u0142 koszt wymiany sygnalizacji \u015bwietlnej na skrzy\u017cowaniu al. Kra\u015bnickiej i ul. Wojciechowskiej oraz ul. Na\u0142\u0119czowskiej i ul. G\u0142\u0119bokiej?jakie ustawienia/konfiguracje \u015bwiate\u0142 zosta\u0142y wykorzystane od momentu ustawienia nowej sygnalizacji oraz jakie s\u0105 w planach? Jakie zachodzi\u0142y/ b\u0119d\u0105 zachodzi\u0107 mi\u0119dzy nimi r&oacute;\u017cnice?jakie wnioski i analizy zosta\u0142y odnotowane z wykorzystanych konfiguracji \u015bwiate\u0142?czy Gmina Lublin ponosi koszty zwi\u0105zane z ka\u017cdorazow\u0105 zmian\u0105 ustawienia \u015bwiate\u0142?",
    "wniosek": "sygnalizacji \u015bwietlnej na ul. al. Kra\u015bnickiej"
  },
  {
    "data": "27-8-2015",
    "id": 248543,
    "kom_org": "OR",
    "latitude": 51.2546147,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248543",
    "lokalizacja": "ul. Na\u0142\u0119czowskiej",
    "longitude": 22.4949745,
    "odp": "Odpowiadaj\u0105c na powy\u017csze pytania informuj\u0119, i\u017c Prezydent Miasta Lublin nie posiada \u017c\u0105danych informacji.Zgodnie z podstawow\u0105 zasad\u0105 dost\u0119pu do informacji publicznej, ustalon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej, obowi\u0105zane do udost\u0119pniania informacji publicznej s\u0105 podmioty b\u0119d\u0105ce w posiadaniu tych informacji. W wyroku z dnia 26 wrze\u015bnia 2003 r., II SA 1852/03, w sprawie przeciwko Krajowej Radzie Pracowniczych Ogr&oacute;dk&oacute;w Dzia\u0142kowych, Naczelny S\u0105d Administracyjny stwierdzi\u0142, \u017ce udost\u0119pnienie mo\u017ce dotyczy\u0107 tylko informacji publicznej, kt&oacute;r\u0105 dana instytucja posiada, a nie tej, kt&oacute;r\u0105 powinna posiada\u0107 (D. Frey, Dzia\u0142kowcy to nie detektywi. Udost\u0119pnianie informacji publicznej, &quot;Rzeczpospolita&quot; z dnia 27-28 wrze\u015bnia 2003 r., nr 226). Ponadto cyt. ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. Organ nie pozostaje zatem w bezczynno\u015bci w sytuacji, gdy poinformuje wnioskodawc\u0119, i\u017c nie dysponuje \u017c\u0105dan\u0105 informacj\u0105 publiczn\u0105 (por. wyrok Wojew&oacute;dzkiego S\u0105du Administracyjnego w Warszawie z dnia 22 marca 2012 r., II SAB/Wa 32/12, LEX nr 1133382).Rada Miasta Lublin uchwa\u0142\u0105 nr 80/VIII/2011 z dnia 31 marca 2011 r. przekaza\u0142a do wy\u0142\u0105cznej kompetencji gminnej jednostki bud\u017cetowej pod nazw\u0105 Zarz\u0105d Dr&oacute;g i Most&oacute;w w Lublinie m. in.: sprawy: zarz\u0105dzania ruchem na drogach publicznych z wy\u0142\u0105czeniem autostrad i dr&oacute;g ekspresowych oraz na drogach wewn\u0119trznych.Wszelkie zatem kwestie dotycz\u0105ce inwestycji zwi\u0105zanych z drogami publicznymi w tym w zakresie sygnalizacji \u015bwietlnej nale\u017c\u0105 do w\u0142a\u015bciwo\u015bci wymienionej wy\u017cej jednostki organizacyjnej Miasta Lublin.W zwi\u0105zku z tym, \u017ce ustawa o dost\u0119pie do informacji publicznej nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazywania wniosku o udost\u0119pnienie informacji publicznej do za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci, w celu uzyskania odpowiedzi na&nbsp; wniosek, proponuj\u0119 zwr&oacute;ci\u0107 si\u0119 do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie (20-401 Lublin, ul. Krochmalna 13J, tel. 81 466 57 00, adres email: drogi@zdm.lublin.eu).",
    "pyt": "Wnosz\u0119 u udzielenie odpowiedzi na pytania:jaki by\u0142 koszt wymiany sygnalizacji \u015bwietlnej na skrzy\u017cowaniu al. Kra\u015bnickiej i ul. Wojciechowskiej oraz ul. Na\u0142\u0119czowskiej i ul. G\u0142\u0119bokiej?jakie ustawienia/konfiguracje \u015bwiate\u0142 zosta\u0142y wykorzystane od momentu ustawienia nowej sygnalizacji oraz jakie s\u0105 w planach? Jakie zachodzi\u0142y/ b\u0119d\u0105 zachodzi\u0107 mi\u0119dzy nimi r&oacute;\u017cnice?jakie wnioski i analizy zosta\u0142y odnotowane z wykorzystanych konfiguracji \u015bwiate\u0142?czy Gmina Lublin ponosi koszty zwi\u0105zane z ka\u017cdorazow\u0105 zmian\u0105 ustawienia \u015bwiate\u0142?",
    "wniosek": "sygnalizacji \u015bwietlnej na ul. al. Kra\u015bnickiej"
  },
  {
    "data": "25-8-2015",
    "id": 248706,
    "kom_org": "AB",
    "latitude": 51.2278576,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248706",
    "lokalizacja": "ul. Dzier\u017cawnej",
    "longitude": 22.550858,
    "odp": "W odpowiedzi na wniosek z dnia 24 sierpnia 2015 r. w sprawie budowy gara\u017cu przy ul. Dzier\u017cawnej 10i oraz 12e informuj\u0119, \u017ce na podstawie rejestr&oacute;w  prowadzonych w Wydziale Architektury i Budownictwa, nie stwierdzono wydania decyzji o pozwoleniu na budow\u0119 gara\u017cu lub przyj\u0119cia zg\u0142oszenia rob&oacute;t budowlanych nie wymagaj\u0105cych pozwolenia na budow\u0119 gara\u017cu na dzia\u0142kach przy ul. Dzier\u017cawnej 10i oraz 12e.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w zakresie inwestycji budowlanej (budowa gara\u017cu) na dzia\u0142ce 10i i 12 e przy ul. Dzier\u017cawnej w Lublinie.",
    "wniosek": "budowy gara\u017cu przy ul. Dzier\u017cawnej"
  },
  {
    "data": "27-8-2015",
    "id": 248952,
    "kom_org": "AB",
    "latitude": 51.2081491,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=248952",
    "lokalizacja": "ul. Na\u0142kowskich",
    "longitude": 22.5439371,
    "odp": "W za\u0142\u0105czeniu przekazuj\u0119 skan decyzji o ustaleniu warunk&oacute;w zabudowy.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie aktualnych warunk&oacute;w zabudowy dzia\u0142ki o nr 37/2 po\u0142o\u017conej w Lublinie przy ul. Na\u0142kowskich ",
    "wniosek": "Wniosek o udost\u0119pnienie informacji publicznej dotycz\u0105cy przekazania warunk\u00f3w zabudowy dzia\u0142ki nr 37/2 po\u0142o\u017conej przy ul. Na\u0142kowskich w Lublinie"
  },
  {
    "data": "8-6-2015",
    "id": 249050,
    "kom_org": "GD",
    "latitude": 51.2543354,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249050",
    "lokalizacja": "ul. Wojciecha Kiwerskiego 4",
    "longitude": 22.5880848,
    "odp": "Odpowiadaj\u0105c na wniosek o udzielenie informacji publicznej z dnia 08.06.2015 r. dotycz\u0105cy udost\u0119pnienia informacji o w\u0142a\u015bcicielach i zarz\u0105dcach dzia\u0142ek o numerach 34 oraz 18 po\u0142o\u017conych w Lublinie informuj\u0119, \u017ce nieruchomo\u015b\u0107 Gminy Lublin po\u0142o\u017cona przy ul. Wojciecha Kiwerskiego 4 w Lublinie, stanowi\u0105ca dzia\u0142k\u0119 ewidencyjn\u0105 nr 34 (obr\u0119b 14, ark 9) nie posiada zarz\u0105dcy.Jednocze\u015bnie informuj\u0119, \u017ce dzia\u0142ka nr 18 (obr\u0119b 14, ark 9) stanowi w\u0142asno\u015b\u0107 os&oacute;b prywatnych. Tym samym powy\u017csze dane o charakterze podmiotowym z uwagi na ochron\u0119 danych osobowych w nich zawartych, nie mieszcz\u0105 si\u0119 w poj\u0119ciu obj\u0119tym ustaw\u0105 o dost\u0119pie do informacji publicznej (zgodnie z art.1 ust.2 przywo\u0142anej ustawy)i udzielane mog\u0105 by\u0107 tylko w trybie art. 24 ust. 3 ustawy z dnia 17 maja 1989 r. - Prawo geodezyjne i kartograficzne, a wi\u0119c z uwzgl\u0119dnieniem wszystkich zawartych w tym przepisie ogranicze\u0144.W celu uzyskania&nbsp; interesuj\u0105cych materia\u0142&oacute;w nale\u017cy z\u0142o\u017cy\u0107 wniosek do Wydzia\u0142u Geodezji UM Lublin. Informacje dotycz\u0105ce trybu sk\u0142adania i rozpatrywania wniosk&oacute;w dost\u0119pne s\u0105 w &bdquo;Kartach informacyjnych UM Lublin &ndash; Wydzia\u0142 Geodezji- Wnioski&rdquo; na stronie Urz\u0119du Miasta Lublin: www.um.lublin.eu.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w nast\u0119puj\u0105cym zakresie:- kto jest w\u0142a\u015bcicielem dzia\u0142ek 18 i 34 (obr\u0119b 14, arkusz 9), na kt&oacute;rych zlokalizowane s\u0105 schody biegn\u0105ce wzd\u0142u\u017c cmentarza oraz studzienka telekomunikacyjna ?- kto jest zarz\u0105dc\u0105 tych nieruchomo\u015bci ?",
    "wniosek": "dzia\u0142ek przy ul. Wojciecha Kiwerskiego 4"
  },
  {
    "data": "9-7-2015",
    "id": 249149,
    "kom_org": "AB",
    "latitude": 51.2119677,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249149",
    "lokalizacja": "ul. Romera 18",
    "longitude": 22.5434708,
    "odp": "W odpowiedzi na wniosek z dnia 9 lipca 2015 r. o udost\u0119pnienie informacji publicznej w sprawie zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych (budowy ogrodzenia nieruchomo\u015bci) przez Wsp&oacute;lnot\u0119 Mieszkaniow\u0105 budynku mieszkalnego wielorodzinnego przy ul. Romera 18 przekazuje w za\u0142\u0105czeniu kopi\u0119 potwierdzenia przyj\u0119cia zg\u0142oszenia o przyst\u0105pieniu do rob&oacute;t budowlanych z dnia 19 czerwca 2012 r. znak: AB-ZA.6743.1.261.2012. Informuj\u0119 jednocze\u015bnie, \u017ce pozosta\u0142e dokumenty znajduj\u0105ce si\u0119 w aktach sprawy mog\u0105 by\u0107 udost\u0119pnione tylko stronom post\u0119powania na podstawie art. 73 ustawy z dnia 14 czerwca 1960 r. Kodeks post\u0119powania administracyjnego (tekst jednolity Dz. U. 2013.267). Dotyczy to m.in. zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych. W sprawie&nbsp; udost\u0119pniania zg\u0142oszenia zamiaru wykonania rob&oacute;t budowlanych wypowiedzia\u0142 si\u0119 Naczelny Sad Administracyjny, kt&oacute;ry w wyroku z dnia 12 czerwca 2013 r. I OSK 488/13 (Lex 1423875) uzna\u0142, \u017ce ww. zg\u0142oszenie nie ma cech dokumentu urz\u0119dowego i nie stanowi informacji publicznej w rozumieniu ustawy o dost\u0119pie do informacji publicznej.Z dokument&oacute;w za\u0142\u0105czonych do wniosku, wynika, \u017ce wnioskodawca jest stron\u0105 post\u0119powania przed Powiatowym Inspektorem Nadzoru Budowlanego miasta Lublin w sprawie usytuowania ogrodzenia na dzia\u0142ce 125/45. w zwi\u0105zku z powy\u017cszym przypominam o przys\u0142uguj\u0105cym prawie wgl\u0105du do akt sprawy prowadzonej przez PINB miasta Lublin. ",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w zakresie zg\u0142oszenia przyst\u0105pienia do rob&oacute;t budowlanych z\u0142o\u017conego przez Wsp&oacute;lnot\u0119 mieszkaniow\u0105 budynku mieszkalnego wielorodzinnego przy ul. Romera 18 w Lublinie.",
    "wniosek": "zg\u0142oszenia przyst\u0105pienia do rob\u00f3t budowlanych"
  },
  {
    "data": "27-8-2015",
    "id": 249350,
    "kom_org": "GK",
    "latitude": 51.2608924,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249350",
    "lokalizacja": "ul. Milenijnej",
    "longitude": 22.5567554,
    "odp": "Odpowiadaj\u0105c na wniosek o udost\u0119pnienie informacji publicznej informuj\u0119, jak ni\u017cej.Z wnioskiem o ustawienie \u0142awek w w\u0105wozie na Czechowie wyst\u0105pi\u0142a Rada Dzielnicy Czech&oacute;w Po\u0142udniowy. Monta\u017c \u0142awek odbywa\u0142 si\u0119 w dw&oacute;ch etapach: we wrze\u015bniu 2014 roku ustawiono 6 \u0142awek i w listopadzie 2014 roku kolejne 6 \u0142awek. \u015arodki finansowe na zakup i monta\u017c \u0142awek pochodzi\u0142y z rezerwy celowej, kt&oacute;re zosta\u0142y przyznane przez Rad\u0119 Dzielnicy oraz z bud\u017cetu miasta. Ponadto wyja\u015bniam, \u017ce \u0142awki w w\u0105wozie zosta\u0142y ustawione r&oacute;wnie\u017c na interwencje telefoniczne od mieszka\u0144c&oacute;w.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej w zakresie materia\u0142&oacute;w dotycz\u0105cych dodatkowo ustawionej \u0142awki najbli\u017cej bloku nr 6 przy ul. Milenijnej w Lublinie.",
    "wniosek": "\u0142awki ustawionej przy ul. Milenijnej w Lublinie"
  },
  {
    "data": "11-9-2015",
    "id": 249679,
    "kom_org": "PL",
    "latitude": 51.24818579999999,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249679",
    "lokalizacja": "ul. Spadochroniarzy 9c",
    "longitude": 22.5306899,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji w sprawie obj\u0119cia miejscowym planem zagospodarowania przestrzennego, przeznaczenia w miejscowym planie zagospodarowania przestrzennego oraz dost\u0119pu do drogi publicznej nieruchomo\u015bci po\u0142o\u017conej w Lublinie, sk\u0142adaj\u0105cej si\u0119 z dzia\u0142ek o numerach ewidencyjnych: 2/65 - ul. Spadochronia-  rzy 9; 2/66 - ul. Spadochroniarzy 9C; 2/67 - ul. Spadochroniarzy / droga dojazdowa /; 2/68 - ul. Spadochroniarzy 9 B / obr\u0119b 26 - Rury Brygidkowskie, arkusz 5 /  informuj\u0119, \u017ce:  Przedmiotowe dzia\u0142ki nie s\u0105 obj\u0119te miejscowym planem zagospodarowania przes-trzennego - zlokalizowane s\u0105 w terenie, dla kt&oacute;rego zgodnie z art. 87 ust. 3 Ustawy       z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 / z dniem 31 grudnia 2003 r. straci\u0142y swoj\u0105 moc miejscowe plany zagospodarowania przestrzennego miasta Lublina              i do chwili obecnej nie powsta\u0142 nowy plan, kt&oacute;ry by okre\u015bli\u0142 przeznaczenie tego obszaru.   Dla w/w nieruchomo\u015bci Wydzia\u0142 Planowania UM Lublin mo\u017ce wyda\u0107:  - wypis i wyrys ze Studium uwarunkowa\u0144 i kierunk&oacute;w zagospodarowania przestrzennego zgodnie z art. 30 Ustawy z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 /; - za\u015bwiadczenie o braku planu w trybie  art. 217 &sect; 1 i &sect; 2 pkt 2 ustawy z dnia 14 czerwca 1960 roku - Kodeks post\u0119powania administracyjnego / tekst jednolity z dnia 30 stycznia 2013 r. Dz. U. z 2013 r. poz. 267 /.     W celu uzyskania odpowiedniego dokumentu nale\u017cy z\u0142o\u017cy\u0107 wniosek do Wydzia\u0142u Planowania UM Lublin. Informacje dotycz\u0105ce trybu sk\u0142adania i rozpatrywania wniosk&oacute;w dost\u0119pne s\u0105 w &quot;Kartach informacyjnych UM Lublin - Wydzia\u0142 Planowania&quot; na stronie Urz\u0119du Miasta Lublin: www.um.lublin.eu. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej / tekst jednolity z dnia 14 kwietnia 2014r. Dz. U. z 2014 poz. 782 / obowi\u0105zane do jej udost\u0119pniania s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. W zwi\u0105zku z powy\u017cszym w celu uzyskania informacji o dost\u0119pie przedmiotowej nieruchomo\u015bci do drogi publicznej nale\u017cy zwr&oacute;ci\u0107 sie do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie, ul. Krochmalna 13 j, 20-401 Lublin.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej dotycz\u0105cej dzia\u0142ek po\u0142o\u017conych w Lublinie o numerach ewidencyjnych:2/65 przy ul. Spadochroniarzy 92/66 przy ul. Spadochroniarzy 9c2/67 stanowi\u0105c\u0105 drog\u0119 do ul. Spadochroniarzy2/68 przy ul. Spadochroniarzy 9b- czy wskazane powy\u017cej nieruchomo\u015bci s\u0105 obj\u0119te miejscowym planem zagospodarowania przestrzennego, a je\u015bli tak to prosz\u0119 o wskazanie, jakie jest przeznaczenie w miejscowym planie zagospodarowania;- czy wskazane powy\u017cej nieruchomo\u015bci posiadaj\u0105 dost\u0119p do drogi publicznej.",
    "wniosek": "nieruchomo\u015bci obj\u0119tych miejscowym planem zagospodarowania przestrzennego i dost\u0119pu do drogi publicznej"
  },
  {
    "data": "11-9-2015",
    "id": 249679,
    "kom_org": "PL",
    "latitude": 51.24711989999999,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249679",
    "lokalizacja": "ul. Spadochroniarzy 92",
    "longitude": 22.53066,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji w sprawie obj\u0119cia miejscowym planem zagospodarowania przestrzennego, przeznaczenia w miejscowym planie zagospodarowania przestrzennego oraz dost\u0119pu do drogi publicznej nieruchomo\u015bci po\u0142o\u017conej w Lublinie, sk\u0142adaj\u0105cej si\u0119 z dzia\u0142ek o numerach ewidencyjnych: 2/65 - ul. Spadochronia-  rzy 9; 2/66 - ul. Spadochroniarzy 9C; 2/67 - ul. Spadochroniarzy / droga dojazdowa /; 2/68 - ul. Spadochroniarzy 9 B / obr\u0119b 26 - Rury Brygidkowskie, arkusz 5 /  informuj\u0119, \u017ce:  Przedmiotowe dzia\u0142ki nie s\u0105 obj\u0119te miejscowym planem zagospodarowania przes-trzennego - zlokalizowane s\u0105 w terenie, dla kt&oacute;rego zgodnie z art. 87 ust. 3 Ustawy       z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 / z dniem 31 grudnia 2003 r. straci\u0142y swoj\u0105 moc miejscowe plany zagospodarowania przestrzennego miasta Lublina              i do chwili obecnej nie powsta\u0142 nowy plan, kt&oacute;ry by okre\u015bli\u0142 przeznaczenie tego obszaru.   Dla w/w nieruchomo\u015bci Wydzia\u0142 Planowania UM Lublin mo\u017ce wyda\u0107:  - wypis i wyrys ze Studium uwarunkowa\u0144 i kierunk&oacute;w zagospodarowania przestrzennego zgodnie z art. 30 Ustawy z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 /; - za\u015bwiadczenie o braku planu w trybie  art. 217 &sect; 1 i &sect; 2 pkt 2 ustawy z dnia 14 czerwca 1960 roku - Kodeks post\u0119powania administracyjnego / tekst jednolity z dnia 30 stycznia 2013 r. Dz. U. z 2013 r. poz. 267 /.     W celu uzyskania odpowiedniego dokumentu nale\u017cy z\u0142o\u017cy\u0107 wniosek do Wydzia\u0142u Planowania UM Lublin. Informacje dotycz\u0105ce trybu sk\u0142adania i rozpatrywania wniosk&oacute;w dost\u0119pne s\u0105 w &quot;Kartach informacyjnych UM Lublin - Wydzia\u0142 Planowania&quot; na stronie Urz\u0119du Miasta Lublin: www.um.lublin.eu. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej / tekst jednolity z dnia 14 kwietnia 2014r. Dz. U. z 2014 poz. 782 / obowi\u0105zane do jej udost\u0119pniania s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. W zwi\u0105zku z powy\u017cszym w celu uzyskania informacji o dost\u0119pie przedmiotowej nieruchomo\u015bci do drogi publicznej nale\u017cy zwr&oacute;ci\u0107 sie do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie, ul. Krochmalna 13 j, 20-401 Lublin.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej dotycz\u0105cej dzia\u0142ek po\u0142o\u017conych w Lublinie o numerach ewidencyjnych:2/65 przy ul. Spadochroniarzy 92/66 przy ul. Spadochroniarzy 9c2/67 stanowi\u0105c\u0105 drog\u0119 do ul. Spadochroniarzy2/68 przy ul. Spadochroniarzy 9b- czy wskazane powy\u017cej nieruchomo\u015bci s\u0105 obj\u0119te miejscowym planem zagospodarowania przestrzennego, a je\u015bli tak to prosz\u0119 o wskazanie, jakie jest przeznaczenie w miejscowym planie zagospodarowania;- czy wskazane powy\u017cej nieruchomo\u015bci posiadaj\u0105 dost\u0119p do drogi publicznej.",
    "wniosek": "nieruchomo\u015bci obj\u0119tych miejscowym planem zagospodarowania przestrzennego i dost\u0119pu do drogi publicznej"
  },
  {
    "data": "11-9-2015",
    "id": 249679,
    "kom_org": "PL",
    "latitude": 51.2498499,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249679",
    "lokalizacja": "ul. Spadochroniarzy2",
    "longitude": 22.532058,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji w sprawie obj\u0119cia miejscowym planem zagospodarowania przestrzennego, przeznaczenia w miejscowym planie zagospodarowania przestrzennego oraz dost\u0119pu do drogi publicznej nieruchomo\u015bci po\u0142o\u017conej w Lublinie, sk\u0142adaj\u0105cej si\u0119 z dzia\u0142ek o numerach ewidencyjnych: 2/65 - ul. Spadochronia-  rzy 9; 2/66 - ul. Spadochroniarzy 9C; 2/67 - ul. Spadochroniarzy / droga dojazdowa /; 2/68 - ul. Spadochroniarzy 9 B / obr\u0119b 26 - Rury Brygidkowskie, arkusz 5 /  informuj\u0119, \u017ce:  Przedmiotowe dzia\u0142ki nie s\u0105 obj\u0119te miejscowym planem zagospodarowania przes-trzennego - zlokalizowane s\u0105 w terenie, dla kt&oacute;rego zgodnie z art. 87 ust. 3 Ustawy       z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 / z dniem 31 grudnia 2003 r. straci\u0142y swoj\u0105 moc miejscowe plany zagospodarowania przestrzennego miasta Lublina              i do chwili obecnej nie powsta\u0142 nowy plan, kt&oacute;ry by okre\u015bli\u0142 przeznaczenie tego obszaru.   Dla w/w nieruchomo\u015bci Wydzia\u0142 Planowania UM Lublin mo\u017ce wyda\u0107:  - wypis i wyrys ze Studium uwarunkowa\u0144 i kierunk&oacute;w zagospodarowania przestrzennego zgodnie z art. 30 Ustawy z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 /; - za\u015bwiadczenie o braku planu w trybie  art. 217 &sect; 1 i &sect; 2 pkt 2 ustawy z dnia 14 czerwca 1960 roku - Kodeks post\u0119powania administracyjnego / tekst jednolity z dnia 30 stycznia 2013 r. Dz. U. z 2013 r. poz. 267 /.     W celu uzyskania odpowiedniego dokumentu nale\u017cy z\u0142o\u017cy\u0107 wniosek do Wydzia\u0142u Planowania UM Lublin. Informacje dotycz\u0105ce trybu sk\u0142adania i rozpatrywania wniosk&oacute;w dost\u0119pne s\u0105 w &quot;Kartach informacyjnych UM Lublin - Wydzia\u0142 Planowania&quot; na stronie Urz\u0119du Miasta Lublin: www.um.lublin.eu. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej / tekst jednolity z dnia 14 kwietnia 2014r. Dz. U. z 2014 poz. 782 / obowi\u0105zane do jej udost\u0119pniania s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. W zwi\u0105zku z powy\u017cszym w celu uzyskania informacji o dost\u0119pie przedmiotowej nieruchomo\u015bci do drogi publicznej nale\u017cy zwr&oacute;ci\u0107 sie do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie, ul. Krochmalna 13 j, 20-401 Lublin.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej dotycz\u0105cej dzia\u0142ek po\u0142o\u017conych w Lublinie o numerach ewidencyjnych:2/65 przy ul. Spadochroniarzy 92/66 przy ul. Spadochroniarzy 9c2/67 stanowi\u0105c\u0105 drog\u0119 do ul. Spadochroniarzy2/68 przy ul. Spadochroniarzy 9b- czy wskazane powy\u017cej nieruchomo\u015bci s\u0105 obj\u0119te miejscowym planem zagospodarowania przestrzennego, a je\u015bli tak to prosz\u0119 o wskazanie, jakie jest przeznaczenie w miejscowym planie zagospodarowania;- czy wskazane powy\u017cej nieruchomo\u015bci posiadaj\u0105 dost\u0119p do drogi publicznej.",
    "wniosek": "nieruchomo\u015bci obj\u0119tych miejscowym planem zagospodarowania przestrzennego i dost\u0119pu do drogi publicznej"
  },
  {
    "data": "11-9-2015",
    "id": 249679,
    "kom_org": "PL",
    "latitude": 51.24818579999999,
    "link": "http://bip.lublin.eu/bip/um/?t=200&id=249679",
    "lokalizacja": "ul. Spadochroniarzy 9b",
    "longitude": 22.5306899,
    "odp": "W odpowiedzi na wniosek o udost\u0119pnienie informacji w sprawie obj\u0119cia miejscowym planem zagospodarowania przestrzennego, przeznaczenia w miejscowym planie zagospodarowania przestrzennego oraz dost\u0119pu do drogi publicznej nieruchomo\u015bci po\u0142o\u017conej w Lublinie, sk\u0142adaj\u0105cej si\u0119 z dzia\u0142ek o numerach ewidencyjnych: 2/65 - ul. Spadochronia-  rzy 9; 2/66 - ul. Spadochroniarzy 9C; 2/67 - ul. Spadochroniarzy / droga dojazdowa /; 2/68 - ul. Spadochroniarzy 9 B / obr\u0119b 26 - Rury Brygidkowskie, arkusz 5 /  informuj\u0119, \u017ce:  Przedmiotowe dzia\u0142ki nie s\u0105 obj\u0119te miejscowym planem zagospodarowania przes-trzennego - zlokalizowane s\u0105 w terenie, dla kt&oacute;rego zgodnie z art. 87 ust. 3 Ustawy       z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 / z dniem 31 grudnia 2003 r. straci\u0142y swoj\u0105 moc miejscowe plany zagospodarowania przestrzennego miasta Lublina              i do chwili obecnej nie powsta\u0142 nowy plan, kt&oacute;ry by okre\u015bli\u0142 przeznaczenie tego obszaru.   Dla w/w nieruchomo\u015bci Wydzia\u0142 Planowania UM Lublin mo\u017ce wyda\u0107:  - wypis i wyrys ze Studium uwarunkowa\u0144 i kierunk&oacute;w zagospodarowania przestrzennego zgodnie z art. 30 Ustawy z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym / tekst jednolity z dnia 5 lutego 2015 r. Dz. U. z 2015 r. poz. 199 /; - za\u015bwiadczenie o braku planu w trybie  art. 217 &sect; 1 i &sect; 2 pkt 2 ustawy z dnia 14 czerwca 1960 roku - Kodeks post\u0119powania administracyjnego / tekst jednolity z dnia 30 stycznia 2013 r. Dz. U. z 2013 r. poz. 267 /.     W celu uzyskania odpowiedniego dokumentu nale\u017cy z\u0142o\u017cy\u0107 wniosek do Wydzia\u0142u Planowania UM Lublin. Informacje dotycz\u0105ce trybu sk\u0142adania i rozpatrywania wniosk&oacute;w dost\u0119pne s\u0105 w &quot;Kartach informacyjnych UM Lublin - Wydzia\u0142 Planowania&quot; na stronie Urz\u0119du Miasta Lublin: www.um.lublin.eu. Zgodnie z jedn\u0105 z podstawowych zasad dost\u0119pu do informacji publicznej okre\u015blon\u0105 w art. 4 ust. 3 ustawy z dnia 6 wrze\u015bnia 2001 r. o dost\u0119pie do informacji publicznej / tekst jednolity z dnia 14 kwietnia 2014r. Dz. U. z 2014 poz. 782 / obowi\u0105zane do jej udost\u0119pniania s\u0105 podmioty, b\u0119d\u0105ce w posiadaniu takich informacji. Ustawa nie wyposa\u017cy\u0142a organu w\u0142adzy publicznej w kompetencje do przekazania wniosku, celem za\u0142atwienia wed\u0142ug w\u0142a\u015bciwo\u015bci. W zwi\u0105zku z powy\u017cszym w celu uzyskania informacji o dost\u0119pie przedmiotowej nieruchomo\u015bci do drogi publicznej nale\u017cy zwr&oacute;ci\u0107 sie do Zarz\u0105du Dr&oacute;g i Most&oacute;w w Lublinie, ul. Krochmalna 13 j, 20-401 Lublin.",
    "pyt": "Wnosz\u0119 o udost\u0119pnienie informacji publicznej dotycz\u0105cej dzia\u0142ek po\u0142o\u017conych w Lublinie o numerach ewidencyjnych:2/65 przy ul. Spadochroniarzy 92/66 przy ul. Spadochroniarzy 9c2/67 stanowi\u0105c\u0105 drog\u0119 do ul. Spadochroniarzy2/68 przy ul. Spadochroniarzy 9b- czy wskazane powy\u017cej nieruchomo\u015bci s\u0105 obj\u0119te miejscowym planem zagospodarowania przestrzennego, a je\u015bli tak to prosz\u0119 o wskazanie, jakie jest przeznaczenie w miejscowym planie zagospodarowania;- czy wskazane powy\u017cej nieruchomo\u015bci posiadaj\u0105 dost\u0119p do drogi publicznej.",
    "wniosek": "nieruchomo\u015bci obj\u0119tych miejscowym planem zagospodarowania przestrzennego i dost\u0119pu do drogi publicznej"
  }
];
