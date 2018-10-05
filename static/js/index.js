import 'bootstrap';
import '../css/styles.scss';
import '../css/leaflet.extra-markers.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';
// import '@fortawesome/fontawesome-free/js/solid';
// import '@fortawesome/fontawesome-free/js/fontawesome';

import csv1 from '../../hack2018台北.csv';
import csv2 from '../../hack2018新北.csv';

import L from 'leaflet';
import './leaflet.extra-markers';

var map = L.map('map').setView([25.046401, 121.517641], 11);

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
}).addTo(map);

// L.marker([25.046401, 121.517641]).addTo(map)
//     .bindPopup('母湯ㄛ')
//     .openPopup();

function parseCSV(csv) {
  return csv
    .split('\n').slice(1)
    .map(line => line.split(','))
    .forEach(arr => {
      let [sno,sna,tot,lat,lng,sarea] = arr;

      let mark = L.ExtraMarkers.icon({
        icon: 'fa-bicycle',
        markerColor: 'blue',
        shape: 'square',
        prefix: 'fa'
      });

      L.marker([lat, lng], { icon: mark }).addTo(map)
       .bindPopup(sna)

      console.log(arr);
    });
}

parseCSV(csv1);
parseCSV(csv2);
