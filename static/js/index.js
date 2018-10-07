import 'bootstrap';
import '../css/styles.scss';
import '../css/leaflet.extra-markers.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-shadow.png';
import yoethwallet from 'yoethwallet'
import ethUtil from 'ethereumjs-util';
import Web3 from 'web3';

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
var lastStartSna = null;

var state = 'idle';

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://map.google.com">Google Map</a>',
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
                prefix: 'fas'
            });

            let marker = L.marker([lat, lng], { icon: mark })
                          .bindPopup(() => (
                            `<h2>${sna}<small class="region">${sarea}</small></h2><p class="info"><i class="fas fa-bicycle"></i> &times; ${tot}<br/>
                            <span class="distance"></span>
                            <span class="tokenInfo"></span></p>
                            <button type="button" class="btn btn-success start-btn" value="[${lat}, ${lng}]" data-sna="${sna}" data-sno="${sno}">開始騎乘</button>&nbsp;
                            <button type="button" class="btn btn-success end-btn" ${state == 'riding' ? '' : 'disabled'} value="[${lat}, ${lng}]" data-sna="${sna}" data-sno="${sno}">還車</button>`));

            marker.sno = sno;

            marker.addEventListener('click', evt => {
              if (state == 'idle') {
                if (currentPosition) {
                  let distance = marker.getLatLng().distanceTo(currentPosition);
                  $('.leaflet-popup .distance').html(`距離現在位置 ${Math.round(distance)}m`);
                }

                fetch('//youbike.smartcontract.tw/api/get', {
                  method: 'POST',
                  body: `start=${evt.target.sno}&end=${evt.target.sno}`,
                  headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                  },
                })
                .then(resp => resp.json())
                .then(data => {
                  $('.leaflet-popup .tokenInfo').html(
                    `可借單車數：${data.result[0].bemp}`);
                });
              } else {
                let distance = marker.getLatLng().distanceTo(lastStartPosition);
                if (distance == 0) {
                  $('.leaflet-popup .distance').html(`<strong>起始點</strong>`);
                } else {
                  $('.leaflet-popup .distance').html(`距離出發點 ${Math.round(distance)}m<br>`);
                  fetch('//youbike.smartcontract.tw/api/get', {
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
                    let reward = (mul * distance / 100).toFixed(3);
                    console.log('mul', mul);
                    $('.leaflet-popup .tokenInfo').html(
                      `可還車位：${data.result[1].bemp}<br>
                      試算獲得積點：<strong>${reward}</strong>`);
                    $('.leaflet-popup .end-btn').data('reward', reward);
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
    lastStartSna = $(this).data('sna');
});

$("#map").on("click", '.leaflet-popup .end-btn', function () {
  let loc = JSON.parse($(this).val());
  let $modal = $('#returnBike');
  $modal.modal('show');
  $modal.find('.dispStart').html(lastStartSna);
  $modal.find('.dispEnd').html($(this).data('sna'));
  $modal.find('.dispTokenReward').html($(this).data('reward'));
});

$("#redeem_by_admin").on("click", function () {
  var signature = siginRedeemByAdmin(JSON.parse(localStorage.youbike_wallet)[0], JSON.parse(localStorage.youbike_wallet)[1], localStorage.dispTokenPendingBalance);

  fetch('//youbike.smartcontract.tw/api/redeemByAdmin', {
    method: 'POST',
    body: `address=${JSON.parse(localStorage.youbike_wallet)[0]}&signature=${signature}&amount=${localStorage.dispTokenPendingBalance}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
  })
  .then(resp => resp.json())
  .then(data => {
    console.log(data);
    if (data.result) {
      $('#dispTokenPendingBalance').text(0);
      localStorage.dispTokenPendingBalance = '0';
      $('#txhash').attr('href', "https://rinkeby.etherscan.io/tx/" + data.txhash);
      $('#txhash').show();
    }
    else if(data.msg == "amount mismatch") {
      $('#dispTokenPendingBalance').text(0);
      localStorage.dispTokenPendingBalance = '0';
    }
  });
});


const addrContract = '0xc37c19360c617d2f425dc2b1191eca5662aed525';

$("#submit_return").on("click", function () {
    let end_loc = $(".end-btn").data('sno');
    console.log("end_loc: " + end_loc)
    state = 'idle';

    if (localStorage.youbike_wallet) {
      fetch('//youbike.smartcontract.tw/api/commit', {
        method: 'POST',
        body: `start=${lastStartSno}&end=${end_loc}&address=${JSON.parse(localStorage.youbike_wallet)[0]}`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
      })
      .then(resp => resp.json())
      .then(data => {
        console.log(data);
        localStorage.dispTokenPendingBalance = data.new_amount;
        localStorage.nonce = data.nonce;
        $('#dispTokenPendingBalance').text(parseFloat(Web3.utils.fromWei(localStorage.dispTokenPendingBalance)).toFixed(3));


        console.log(ecrecoverRedeemByAdmin(data));
        $('#returnBike').modal('hide');
      });
    }

});



function ecrecoverRedeemByAdmin(response) {

  var hash = ethUtil.toBuffer(Web3.utils.soliditySha3(JSON.parse(localStorage.youbike_wallet)[0], addrContract, localStorage.nonce, response.new_amount));


  let recoveredPubKey = ethUtil.ecrecover(
    ethUtil.toBuffer(hash),
    parseInt(response.signature.substr(130, 2), 16),
    Buffer.from(response.signature.substr(2, 64), 'hex'),
    Buffer.from(response.signature.substr(66, 64), 'hex')
  );


  return ethUtil.publicToAddress(recoveredPubKey).toString('hex');


}

function siginRedeemByAdmin(address, privatekey, amount) {
  var privkey = new Buffer(privatekey, 'hex');

  contract.methods.nonce(address).call().then(newNonce => {
    localStorage.nonce = newNonce;
  })

  var data = ethUtil.toBuffer(Web3.utils.soliditySha3(address, addrContract, localStorage.nonce, amount));
  var vrs = ethUtil.ecsign(data, privkey);
  var pubkey = ethUtil.ecrecover(data, vrs.v, vrs.r, vrs.s);
  console.log("0x" + vrs.r.toString('hex') + vrs.s.toString('hex') + vrs.v.toString(16));
  /*
  // Check !
  var check1 = pubkey.toString('hex') == ethUtil.privateToPublic(privkey).toString('hex');
  var check2 = ethUtil.publicToAddress(pubkey).toString('hex') == ethUtil.privateToAddress(privkey).toString('hex');
  // Check is ok !

  return check1 && check2;
  */
  return "0x" + vrs.r.toString('hex') + vrs.s.toString('hex') + vrs.v.toString(16);
}


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
              prefix: 'fas'
          });

          let marker = L.marker(latlng, { icon: mark }).bindPopup('你在這裡');
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
