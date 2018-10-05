import 'bootstrap';
import '../css/styles.scss';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

var map = L.map('map').setView([25.046401, 121.517641], 13);

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
}).addTo(map);

L.marker([25.046401, 121.517641]).addTo(map)
    .bindPopup('母湯ㄛ')
    .openPopup();
