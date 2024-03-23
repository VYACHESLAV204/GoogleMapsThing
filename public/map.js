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

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(panel);

  directionsRenderer.setMap(map);

  let tooltipInfoWindow = new google.maps.InfoWindow({
    content: "Укажите начальную и конечную точки маршрута нажимая на дорогу, появятся 2 маркера которые можно перетаскивать: маркер \"A\" - Начало маршрута, маркер \"В\" - конец маршрута. Для изменения пути маршрута нажмите на его линию, и перетащите появившеюся точку на нужный вам поворот. Так можно делать сколько угодно раз. После нажмите кнопку \"Отправить Данные\" в верхнем правом углу.",
    position: defPos,
  });

  tooltipInfoWindow.open(map);
  // Слушатель кликов для отображения координатов
  // Лучше оставить, закоментированным конечно, может ещё пригодиться.
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

  map.addListener("click", async (mapsMouseEvent) => {
    start = mapsMouseEvent.latLng
    end = mapsMouseEvent.latLng

    modal.classList.add("active")
  })

  submit_modal.addEventListener("click", (e) => {
    modal.classList.remove("active")

    calculateAndDisplayRoute(directionsService, directionsRenderer, start, end)
  })

  start_point.addEventListener("click", (e) => {
    map.panTo(start)
  })
  end_point.addEventListener("click", (e) => {
    map.panTo(end)
  })

  directionsRenderer.addListener("directions_changed", () => {
    const directions = directionsRenderer.getDirections();

    if (directions) {
      computeTotalDistance(directions);
    }
  });

  calculateAndDisplayRoute(directionsService, directionsRenderer, start, end)

  // Дальше идёт код Поисковика
  // Дальше идёт код Поисковика

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


function calculateAndDisplayRoute(directionsService, directionsRenderer, start, end) {

  directionsService
    .route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
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