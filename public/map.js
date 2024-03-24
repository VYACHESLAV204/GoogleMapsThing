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

async function initMap() {


}


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

initMap()