//@ts-nocheck
/* Да, всё этого пиздец как плохо выглядит */
let map;
let totalDistance
let totalTime
let start_cords
let end_cords
const panel = document.getElementById("panel")
const start_point = document.getElementById("start_point")
const end_point = document.getElementById("end_point")
const submitBtn = document.getElementById("submit")
let modal = document.getElementById("modal")
let close_modal = document.getElementById("close_modal")
let submit_modal = document.getElementById("submit_modal")

let start = { lat: 56.82919264514929, lng: 60.58379842794948 };
let end = { lat: 56.82953942977743, lng: 60.59075440792031 };

// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com
mapboxgl.accessToken = 'sk.eyJ1IjoiYWxleGFuZGVybWFya292IiwiYSI6ImNsdTVicTdkbzB1cXIyam40bzh4YWZwZHIifQ.VtIzClpn_JOhRlDc1R8EZg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
  zoom: 1,
  center: [30, 15]
});

map.addControl(new mapboxgl.NavigationControl());
map.scrollZoom.disable();

map.on('style.load', () => {
  map.setFog({}); // Set the default atmosphere style
});

// The following values can be changed to control rotation speed:

// At low zooms, complete a revolution every two minutes.
const secondsPerRevolution = 240;
// Above zoom level 5, do not rotate.
const maxSpinZoom = 5;
// Rotate at intermediate speeds between zoom levels 3 and 5.
const slowSpinZoom = 3;

let userInteracting = false;
const spinEnabled = true;

function spinGlobe() {
  const zoom = map.getZoom();
  if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
    let distancePerSecond = 360 / secondsPerRevolution;
    if (zoom > slowSpinZoom) {
      // Slow spinning at higher zooms
      const zoomDif =
        (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
      distancePerSecond *= zoomDif;
    }
    const center = map.getCenter();
    center.lng -= distancePerSecond;
    // Smoothly animate the map over one second.
    // When this animation is complete, it calls a 'moveend' event.
    map.easeTo({ center, duration: 1000, easing: (n) => n });
  }
}

// Pause spinning on interaction
map.on('mousedown', () => {
  userInteracting = true;
});
map.on('dragstart', () => {
  userInteracting = true;
});

// When animation is complete, start spinning if there is no ongoing interaction
map.on('moveend', () => {
  spinGlobe();
});



function calculateAndDisplayRoute(directionsService, directionsRenderer, start, end) {

  directionsService
    .route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.WALKING,
      optimizeWaypoints: false,
      provideRouteAlternatives: false,
    })
    .then((response) => {
      directionsRenderer.setDirections(response);
    })
    .catch((e) => window.alert("Directions request failed due to " + e));


  submitBtn.addEventListener("click", async (e) => {
    directionsService
      .route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      }).then((res) => {
        let data = dataProcessing(res)
        //TODO: Записать полученные данные на сервер.
        let options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
        };
        //В переменной data уже все обработанные данные.
        fetch('http://127.0.0.1:3000/api/writeData', options)
          .then(response => response.json())
          .then(data => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });

        alert("Данные были отправлены.")
      }).catch((e) => { console.log("Error: " + e) })
  })
}

close_modal.addEventListener("click", (e) => {
  modal.classList.remove("active")
})

function dataProcessing(res) {
  if (res.status !== "OK") {
    setTimeout(() =>
      alert("Ошибка обработки данных, попробуйте ещё раз или сообщите об ошибке.")
      , 3000
    )
  } else {
    let data = {
      totalDistance: totalDistance,
      totalTime: totalTime,
      start_cord: start_cords,
      end_cord: end_cords,
    }
    return data
  }

}

function computeTotalDistance(result) {
  totalDistance = 0;
  totalTime = 0;
  const myroute = result.routes[0];

  if (!myroute) {
    return;
  }

  for (let i = 0; i < myroute.legs.length; i++) {
    totalDistance += myroute.legs[i].distance.value;
    totalTime += myroute.legs[i].duration.value;
  }

  totalDistance = totalDistance / 1000;

  start_cords = myroute.legs[0].start_address
  end_cords = myroute.legs[0].end_address

  start = myroute.legs[0].start_location
  end = myroute.legs[0].end_location
}
