//@ts-nocheck
/* Да, всё этого пиздец как плохо выглядит */
let map;
let cordsG, radiusG, profileG

const initMap = () => {
  const ACCESS_TOKEN = 'pk.eyJ1IjoiYWxleGFuZGVybWFya292IiwiYSI6ImNsdTVibG8zNTB1cDIyam40Y3Nnc2JibTgifQ.-PRze3fjfRYyKtJcXcpJPQ';
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWxleGFuZGVybWFya292IiwiYSI6ImNsdTVibG8zNTB1cDIyam40Y3Nnc2JibTgifQ.-PRze3fjfRYyKtJcXcpJPQ';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [30.313572325520312, 59.936930470787075], // starting position
    zoom: 16
  });


  /* Поисковик */
  const searchJS = document.getElementById('search-js');
  searchJS.onload = function () {
    const searchBox = new MapboxSearchBox();
    searchBox.accessToken = ACCESS_TOKEN;
    searchBox.options = {
      types: 'address,poi,street,place,block',
      county: 'ru',
    };
    searchBox.marker = true;
    searchBox.mapboxgl = mapboxgl;
    map.addControl(searchBox);
  };

  /* Маркер с инфой */
  var popup = new mapboxgl.Popup({ offset: 25 })
    .setText("Для размещения маршрута нажимайте ЛКМ размещая точки последовательно, после нажмите на последнюю точку. Это создаст маршрут. Нажав на опорную точку выберется весь маршрут, в этом состояние можно перетаскивать любую из точек, корректируя маршрут. Также маршрут можно удалить, выбрав его и нажав кнопку в Верхнем Правом углу. Сверху справа так же есть Поисковик и Кнопки: Создания нового маршрута, Удаления Выбранного маршрута. После того как вы сделали маршрут, нажмите кнопку \"Отправить данные\" в Верхнем Левом углу.")

  var marker = new mapboxgl.Marker()
    .setLngLat([30.313572325520312, 59.936930470787075]) // replace with your coordinates
    .setPopup(popup)
    .addTo(map)
    .togglePopup();


  /* Рисование (без путей) */
  const draw = new MapboxDraw({
    // Instead of showing all the draw tools, show only the line string and delete tools.
    displayControlsDefault: false,
    controls: {
      line_string: true,
      trash: true
    },
    // Set the draw mode to draw LineStrings by default.
    defaultMode: 'draw_line_string',
    styles: [
      // Set the line style for the user-input coordinates.
      {
        id: 'gl-draw-line',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#438EE4',
          'line-dasharray': [0.2, 2],
          'line-width': 4,
          'line-opacity': 0.7
        }
      },
      // Style the vertex point halos.
      {
        id: 'gl-draw-polygon-and-line-vertex-halo-active',
        type: 'circle',
        filter: [
          'all',
          ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
        ],
        paint: {
          'circle-radius': 12,
          'circle-color': '#FFF'
        }
      },
      // Style the vertex points.
      {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        filter: [
          'all',
          ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
        ],
        paint: {
          'circle-radius': 8,
          'circle-color': '#438EE4'
        }
      }
    ]
  });
  map.addControl(draw);


  /* Запрос на отрисовку путей */
  function addRoute(coords) {
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    } else {
      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: coords
          }
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#03AA46',
          'line-width': 8,
          'line-opacity': 0.8
        }
      });
    }
  }


  function updateRoute() {
    const profile = 'walking';
    const data = draw.getAll();
    const lastFeature = data.features.length - 1;
    const coords = data.features[lastFeature].geometry.coordinates;
    const newCoords = coords.join(';');
    const radius = coords.map(() => 25);

    cordsG = newCoords
    radiusG = radius
    profileG = profile

    getMatch(newCoords, radius, profile);
  }


  /* Запрос и вывод марг */
  async function getMatch(coordinates, radius, profile) {
    const radiuses = radius.join(';');
    const query = await fetch(
      `https://api.mapbox.com/matching/v5/mapbox/${profile}/${coordinates}?geometries=geojson&radiuses=${radiuses}&steps=true&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    const response = await query.json();
    if (response.code !== 'Ok') {
      alert(
        `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
      );
      return;
    }
    const coords = response.matchings[0].geometry;
    addRoute(coords);
  }

  async function displayRoute(url) {
    const radiuses = radiusG.join(';');
    const query = await fetch(
      `${url}`,
      { method: 'GET' }
    );
    const response = await query.json();
    if (response.code !== 'Ok') {
      alert(
        `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
      );
      return;
    }
    const coords = response.matchings[0].geometry;
    addRoute(coords);
  }

  /* Удаление всех путей */
  function removeRoute() {
    if (!map.getSource('route')) return;
    map.removeLayer('route');
    map.removeSource('route');
  }

  map.on('draw.delete', removeRoute);
  map.on('draw.create', updateRoute);
  map.on('draw.update', updateRoute);


  class MyCustomControl {
    onAdd(map) {
      this.map = map;
      this.container = document.createElement('div');
      this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this.container.innerHTML = `
      <button class="mapbox-gl-draw_ctrl-draw-btn active submit-control" id="submit_data">
        Отправить данные
        </button>
      `
      return this.container;
    }
    onRemove() {
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  const myCustomControl = new MyCustomControl();

  map.addControl(myCustomControl, 'top-left');

  /* const addMarker = (e) => {
    console.log(e)
  }
 
  map.on('click', addMarker) */
  const submit_data_btn = document.getElementById("submit_data")
  submit_data_btn.addEventListener("click", async () => {
    let radiuses = radiusG.join(';');

    await fetch(
      `https://api.mapbox.com/matching/v5/mapbox/${profileG}/${cordsG}?geometries=geojson&radiuses=${radiuses}&steps=true&overview=full&annotations=distance&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    ).then(async (res) => {
      let data = dataProcessing(res)
      console.log(data)

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

initMap()



function dataProcessing(res) {
  if (res.statusText !== "OK") {
    setTimeout(() =>
      alert("Ошибка обработки данных, попробуйте ещё раз или сообщите об ошибке.")
      , 3000
    )
  } else {
    let data = {
      url: res.url,
      cords: res.url.slice(50, -203),
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
