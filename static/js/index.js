import 'bootstrap';
import '../css/styles.scss';
import '../css/leaflet.extra-markers.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';
import yoethwallet from 'yoethwallet'

import Controller from './controller';

import csv1 from '../../hack2018台北.csv';
import csv2 from '../../hack2018新北.csv';

import L from 'leaflet';
import './leaflet.extra-markers';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

var map = L.map('map', {
    minZoom: 10,
    maxBounds: [
        [24.5, 120],
        [25.5, 123]
    ]
}).setView([25.046401, 121.517641], 12);

var layerCurPos = L.layerGroup().addTo(map);
var layerAttentionMarkup = L.layerGroup().addTo(map);

var currentPosition = null;
var lastStartPosition = null;
var lastStartSno = null;

var state = 'idle';

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
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
                          .bindPopup(() => (
                            `<h2>${sna}</h2><p class="info">@${sarea} x ${tot}<br/>
                            <span class="distance"></span>
                            <span class="tokenInfo"></span></p>
                            <button type="button" class="btn btn-success start-btn" value="[${lat}, ${lng}]" data-sno="${sno}">開始騎乘</button>&nbsp;
                            <button type="button" class="btn btn-success end-btn" ${state == 'riding' ? '' : 'disabled'} value="[${lat}, ${lng}]" data-sno="${sno}">還車</button>`));

            marker.sno = sno;

            marker.addEventListener('click', evt => {
              if (state == 'idle') {
                if (currentPosition) {
                  let distance = marker.getLatLng().distanceTo(currentPosition);
                  $('.leaflet-popup .distance').html(`距離現在位置 ${Math.round(distance)}m`);
                }
              } else {
                let distance = marker.getLatLng().distanceTo(lastStartPosition);
                if (distance == 0) {
                  $('.leaflet-popup .distance').html(`<strong>起始點</strong>`);
                } else {
                  $('.leaflet-popup .distance').html(`距離租車點 ${Math.round(distance)}m`);
                  fetch('http://35.221.238.24:3000/api/get', {
                    method: 'POST',
                    body: `start=${lastStartSno}&end=${evt.target.sno}`,
                    headers: {
                      'content-type': 'application/x-www-form-urlencoded'
                    },
                  })
                  .then(resp => resp.json())
                  .then(data => {
                    console.log(data);

                    let mul = data.result[2];
                    console.log('mul', mul);
                    $('.leaflet-popup .tokenInfo').html(
                      `可還車位：${data.result[1].bemp}<br>
                      試算積點：<strong>${(mul * distance / 100).toFixed(3)}</strong>`);
                  });
                }
              }

              console.log('marker click', marker, evt);
            });

            markers.push(marker);
        });

    clusterGroup.addLayers(markers);
    map.addLayer(clusterGroup);
}

parseCSV(csv1);
parseCSV(csv2);

$("#map").on("click", '.leaflet-popup .start-btn', function () {
    let loc = JSON.parse($(this).val());
    let circle = L.circleMarker(loc, { radius: 40, color: '#f44336' });
    layerAttentionMarkup.clearLayers();
    layerAttentionMarkup.addLayer(circle);

    state = 'riding';
    lastStartPosition = loc;
    lastStartSno = $(this).data('sno');

    $("#start").val($(this).val());
});

$("#map").on("click", '.leaflet-popup .end-btn', function () {
    console.log($(this).val());
    $("#end").val($(this).val());
});

// var password = 'Zxc1233211234567';
var keystore = {};
var address = '';
var privateKey = '';
var keystoreJson = '';
var keystoreJsonDataLink = '';
var hdPathString = 'm/44\'/60\'/0\'/0';
var fileName = '';
window.newWallet = [];



function newAddress() { // (password) {
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

function generate() {

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



function addressToLatLng(addr) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        "address": addr
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            console.log(results[0].geometry.location.lat() + "," + results[0].geometry.location.lng() + "\n");
        } else {
            console.log(addr + "查無經緯度" + "\n");
        }
    });
}


function geolocate() {
  var infoWindow = new google.maps.InfoWindow;
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
          };

          let latlng = [pos.lat, pos.lng];
          map.setView(latlng, 17);
          currentPosition = pos;

          let mark = L.ExtraMarkers.icon({
              icon: 'fa-location-arrow',
              markerColor: 'yellow',
              prefix: 'fa'
          });

          let marker = L.marker(latlng, { icon: mark });
          layerCurPos.clearLayers();
          layerCurPos.addLayer(marker);

          infoWindow.setPosition(pos);
          infoWindow.setContent('Location found.');
          console.log(pos);
      }, function() {
          handleLocationError(true, infoWindow, map.getCenter());
      });
  } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
  }
}


$('#toolbar .hamburger').on('click', function() {
    $(this).parent().toggleClass('open');
});

$(function() {
    if (localStorage.youbike_wallet) {
        $('#address').text(JSON.parse(localStorage.youbike_wallet)[0]);
        $('#new_wallet').hide();
        $('#remove_wallet').show();
        $('#show_wallet').show();
    }

});

$('#new_wallet').on('click', function() {
    generate();
    $('#address').text(newWallet[0]);
    localStorage.youbike_wallet = JSON.stringify(newWallet);
    $('#new_wallet').hide();
    $('#remove_wallet').show();
    $('#show_wallet').show();
});

$('#remove_wallet').on('click', function() {
    generate();
    $('#address').text("");
    $('#private_key').text("");
    localStorage.youbike_wallet = "";
    $('#new_wallet').show();
    $('#remove_wallet').hide();
    $('#show_wallet').hide();
});

$('#show_wallet').on('click', function() {
  if ($('#private_key').text()) {
    $('#private_key').text("");
    $('#private_zone').hide();
  }
  else {
    $('#private_key').text(JSON.parse(localStorage.youbike_wallet)[1]);
    $('#private_zone').show();
  }
});

$('#locate').on('click', function() {
    geolocate();
});


window.generate = generate;
window.addressToLatLng = addressToLatLng;
