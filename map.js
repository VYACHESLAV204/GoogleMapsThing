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
  const defPos = { lat: 56.82955293942959, lng: 60.58714032665389 }

  map = new Map(document.getElementById("map"), {
    center: defPos,
    zoom: 18,
    disableDefaultUI: true,
  });

  directionsRenderer.setMap(map);

  let tooltipInfoWindow = new google.maps.InfoWindow({
    content: "Укажите начальную и конечную точки маршрута нажимая на дорогу, появятся маркеры которые можно перетаскивать. Для изменения пути маршрута нажмите на его линию, и перетащите появившеюся точку на нужный вам поворот. Так можно делать сколько угодно раз. После нажмите кнопку \"Отправить Данные\" в верхнем правом углу.",
    position: defPos,
  });


  tooltipInfoWindow.open(map);
  // Слушатель кликов для отображения координатов
  // Лучше оставить, закоментированным конечно.
  /*   map.addListener("click", (mapsMouseEvent) => {
      // Close the current InfoWindow.
      tooltipInfoWindow.close();
      // Create a new InfoWindow.
      tooltipInfoWindow = new google.maps.InfoWindow({
        position: mapsMouseEvent.latLng,
      });
      tooltipInfoWindow.setContent(
        JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2),
      );
      tooltipInfoWindow.open(map);
    }); */

  start_point.addEventListener("click", (e) => {
    map.panTo(start)
  })
  end_point.addEventListener("click", (e) => {
    map.panTo(end)
  })
  reset_turns.addEventListener("click", (e) => {
    calculateAndDisplayRoute(directionsService, directionsRenderer)
  })

  calculateAndDisplayRoute(directionsService, directionsRenderer)

  /* Код поисковика */

  const input = document.getElementById("pac-input");
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  autocomplete.bindTo("bounds", map);

  const placeInfoWindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");

  placeInfoWindow.setContent(infowindowContent);

  const placeMarker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
  });

  autocomplete.addListener("place_changed", () => {
    placeInfoWindow.close();
    placeMarker.setVisible(false);

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    map.setCenter(place.geometry.location);
    map.setZoom(18);

    placeMarker.setPosition(place.geometry.location);
    placeMarker.setVisible(true);
    infowindowContent.children["place-name"].textContent = place.name;
    infowindowContent.children["place-address"].textContent =
      place.formatted_address;
    placeInfoWindow.open(map, placeMarker);
  });

  map.addListener("drag", (mapsMouseEvent) => {
    placeInfoWindow.close();
    placeMarker.setVisible(false);
  })

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


        alert("Данные были отправлены.")
      }).catch((e) => { console.log("Error: " + e) })
  })
}

initMap()