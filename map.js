//@ts-nocheck
let map;
const start_point = document.getElementById("start_point")
const end_point = document.getElementById("end_point")
const reset_turns = document.getElementById("reset_turns")
const reset_route = document.getElementById("reset_route")
const submitBtn = document.getElementById("submit")

var start = { lat: 56.82919264514929, lng: 60.58379842794948 };
var end = { lat: 56.82953942977743, lng: 60.59075440792031 };

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const directionsService = new google.maps.DirectionsService();
  let directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    map,
  });
  const defPos = { lat: 56.82953942977, lng: 60.59075440792 }

  map = new Map(document.getElementById("map"), {
    center: defPos,
    zoom: 18,
    disableDefaultUI: true,
  });

  directionsRenderer.setMap(map);

  let infoWindow = new google.maps.InfoWindow({
    content: "Укажите начальную и конечную точки маршрута нажимая на дорогу, появятся маркеры которые можно перетаскивать. Для изменения пути маршрута нажмита на его линию, и перетащите появившеюся точку на нужный вам поворот. Так можно делать сколько угодно раз.",
    position: defPos,
  });


  infoWindow.open(map);
  // Слушатель кликов
  map.addListener("click", (mapsMouseEvent) => {
    // Close the current InfoWindow.
    infoWindow.close();
    // Create a new InfoWindow.
    infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });
    infoWindow.setContent(
      JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2),
    );
    infoWindow.open(map);
  });

  start_point.addEventListener("click", (e) => {
    map.panTo(start)
  })
  end_point.addEventListener("click", (e) => {
    map.panTo(end)
  })

  calculateAndDisplayRoute(directionsService, directionsRenderer)
}



function calculateAndDisplayRoute(directionsService, directionsRenderer) {

  directionsService
    .route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
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
        console.log(res)
/*         let data = JSON.stringify(res.) */
      }).catch((e) => {console.log("Error: " + e)})
  })
}

reset_turns.addEventListener("click", (e) => {
  calculateAndDisplayRoute(directionsService, directionsRenderer)
})

initMap()