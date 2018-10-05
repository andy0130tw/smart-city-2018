import 'bootstrap';
import '../css/styles.scss';
import '../css/leaflet.extra-markers.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';
import yoethwallet from 'yoethwallet'


// import '@fortawesome/fontawesome-free/js/solid';
// import '@fortawesome/fontawesome-free/js/fontawesome';

import csv1 from '../../hack2018台北.csv';
import csv2 from '../../hack2018新北.csv';

import L from 'leaflet';
import './leaflet.extra-markers';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

var map = L.map('map', {
  minZoom: 10,
  maxZoom: 20,
  maxBounds: [[24.5, 120], [25.5, 123]]
}).setView([25.046401, 121.517641], 12);

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

// L.marker([25.046401, 121.517641]).addTo(map)
//     .bindPopup('母湯ㄛ')
//     .openPopup();

function parseCSV(csv) {
  let clusterGroup = new L.MarkerClusterGroup({
    disableClusteringAtZoom: 15,
    maxClusterRadius: zoom => {
      if (zoom <= 11) return 80;
      if (zoom <= 12) return 70;
      if (zoom <= 14) return 60;
      return 50;
    }
  });

  let markers = [];

  csv
    .split('\n').slice(1)
    .map(line => line.split(','))
    .forEach(arr => {
      let [sno, sna, tot, lat, lng, sarea] = arr;

      let mark = L.ExtraMarkers.icon({
        icon: 'fa-bicycle',
        markerColor: 'blue',
        shape: 'square',
        prefix: 'fa'
      });

      let marker = L.marker([lat, lng], { icon: mark })
                    .bindPopup(`<h2>${sna}</h2>@${sarea} x ${tot}`);

      markers.push(marker);
    });

  clusterGroup.addLayers(markers);
  map.addLayer(clusterGroup);
}

parseCSV(csv1);
parseCSV(csv2);


// var password = 'Zxc1233211234567';
var keystore = {};
var address = '';
var privateKey = '';
var keystoreJson = '';
var keystoreJsonDataLink = '';
var hdPathString = 'm/44\'/60\'/0\'/0';
var fileName = '';
window.newWallet = [];



function newAddress () { // (password) {
  if (typeof keystore.getHexAddress !== 'function') {
    return false
  }

  let wallet = keystore

  privateKey = wallet.getHexPrivateKey()
  address = wallet.getHexAddress(true)
  newWallet = [address, privateKey];
  /*
  wallet.toV3String(password, {}, (err, v3Json) => {
    if (err) {
      console.warn(err.message)
      return
    }
    keystoreJson = v3Json
    keystoreJsonDataLink = encodeURI('data:application/json;charset=utf-8,' + keystoreJson)
    fileName = `${wallet.getV3Filename()}.json`
  })
  */
}

function generate () {

  let wallet = yoethwallet.wallet

  wallet.generate('', hdPathString, (err, keystore_f) => {
    if (err) {
      console.warn(err.message)
      return
    }

    keystore = keystore_f
    newAddress() // (password)
  })

}

window.generate = generate;
