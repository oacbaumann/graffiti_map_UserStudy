


document.getElementById("filterButton").addEventListener("click", function () {
    if (filter_menu_visible) {
      // If side menu is already visible, hide it
      document.getElementById("filter_menu").style.display = "none";
      filter_menu_visible = false;
    } else {
      // If side menu is not visible, show it
      document.getElementById("filter_menu").style.display = "flex";
      filter_menu_visible = true;
    }
  });




  // ----- GLOBAL VARIABLES --------
  var graffiti_center_coords = {};
  var graffiti_number_visible = 0;

  var graffiti_layers_on_display = [];
  var graffiti_sources_on_display = [];

  var graffiti_line_layers_on_display = [];

  var hovered_featureId = null;
  let last_feature_id = null;

  let filter_menu_visible = false;

  var line_data;

  let collapsed = false;

  // -------------  FUNCTIONS -------------




  function load_all_buildings_from_saved_data() {


    const source_first_row_buildings = {
      type: 'geojson',
      data: saved_first_row_buildings_data,
      tolerance: 1.0,
      maxzoom: 14,
    };

    map.addSource('first_buildings', source_first_row_buildings);

    map.addLayer({
      'id': 'buildings_layer',
      'type': 'fill-extrusion',
      'source': 'first_buildings',
      'paint': {
        'fill-extrusion-color': 'grey',
        'fill-extrusion-height': ['get', 'H_rel_top'],
        'fill-extrusion-base': ['get', 'H_rel_base'],
        'fill-extrusion-opacity': 0.6,
        'fill-extrusion-vertical-gradient': true
      }
    });


    const source_second_row_buildings = {
      type: 'geojson',
      data: saved_second_row_buildings_data,
      tolerance: 1.0,
      maxzoom: 14,
    };

    map.addSource('second_buildings', source_second_row_buildings);

    map.addLayer({
      'id': 'buildings_layer2',
      'type': 'fill-extrusion',
      'source': 'second_buildings',
      'paint': {
        'fill-extrusion-color': 'grey',
        'fill-extrusion-height': ['get', 'H_rel_top'],
        'fill-extrusion-base': ['get', 'H_rel_base'],
        'fill-extrusion-opacity': 0.5,
        'fill-extrusion-vertical-gradient': true
      }
    });


    const source_third_row_buildings = {
      type: 'geojson',
      data: saved_third_row_buildings_data,
      tolerance: 1.0,
      maxzoom: 14,
    };

    map.addSource('third_buildings', source_third_row_buildings);

    map.addLayer({
      'id': 'buildings_layer3',
      'type': 'fill-extrusion',
      'source': 'third_buildings',
      'paint': {
        'fill-extrusion-color': 'grey',
        'fill-extrusion-height': ['get', 'H_rel_top'],
        'fill-extrusion-base': ['get', 'H_rel_base'],
        'fill-extrusion-opacity': 0.375,
        'fill-extrusion-vertical-gradient': true
      }
    });



  }


  function remove_all_buildings() {
    map.removeLayer('buildings_layer');
    map.removeSource('first_buildings');
    map.removeLayer('buildings_layer2');
    map.removeSource('second_buildings');
    map.removeLayer('buildings_layer3');
    map.removeSource('third_buildings');
  }








  function load_graffiti_data() {


    // get graffiti data & add new properties (maxZ & minZ)
    fetch('data/graffiti_data.geojson')
      .then(response => response.json())
      .then(data => {

        graffiti_number_visible = 0;
        graffiti_center_coords = {};
        document.getElementById("feature-number").innerText = + graffiti_number_visible + " graffiti loaded.";

        // Loop through each feature and update the properties
        data.features.forEach((feature, index) => {


          // attribute filtering
          const type = feature.properties.type1;
          if (type_of_graffiti.value == "option1" && type !== 1) {
            return;
          }

          if (type_of_graffiti.value == "option2" && type !== 2) {
            return;
          }

          const side = feature.properties.seite;
          if (donaukanal_side.value == "option1" && side !== 1) {
            return;
          }
          if (donaukanal_side.value == "option2" && side !== 2) {
            return;
          }

          const animals = feature.properties.animals;
          const political = feature.properties.political;
          if (animalCheckbox.checked && animals !== 1 || politicalCheckbox.checked && political !== 1) {
            return;
          }


          // slider filtering
          var graffiti_start_date = feature.properties.start_date;
          var graffiti_end_date = feature.properties.end_date;

          if (graffiti_start_date > effectiveEndDate.toISOString()) {
            return;
          }

          if (graffiti_end_date < effectiveStartDate.toISOString()) {
            return;
          }


          graffiti_number_visible++;
          document.getElementById("feature-number").innerText = graffiti_number_visible + " graffiti loaded.";




          // Loop through each vertex in the polygon and update maxZ and minZ
          var maxZ = -Infinity;
          var minZ = Infinity;
          turf.coordEach(feature, function (coord) {
            var z = coord[2];
            if (z > maxZ) {
              maxZ = z;
            }
            if (z < minZ) {
              minZ = z;
            }
          });

          // Add the maxZ and minZ as properties to the feature
          feature.properties.maxZ = maxZ;
          feature.properties.minZ = minZ;


          var graffiti_id = feature.properties.numberGraf;
          // Add a unique identifier or name to the feature
          feature.id = graffiti_id;


          var graffiti_center = turf.center(feature).geometry.coordinates;
          graffiti_center_coords[graffiti_id] = graffiti_center;



          // Create a new div element
          var graffiti_info = document.createElement('div');

          // Add an id and class to the new div
          graffiti_info.id = String(graffiti_id);
          graffiti_info.classList.add('graffiti_info');

          // Set the content of the new div
          graffiti_info.innerHTML = "Graffito #<b>" + graffiti_id + "</b>";


          // Create and add the graffiti description
          var graffiti_description = document.createElement('div');
          graffiti_description.innerHTML = "Visible from: <br>" + feature.properties.start_date + " until " + feature.properties.end_date;
          graffiti_description.classList.add('graffiti_description');
          graffiti_info.appendChild(graffiti_description);


          // Create an image element
          var graffiti_image = document.createElement('img');
          graffiti_image.src = `img/${graffiti_id}_lowRes_ortho.png`;
          graffiti_image.alt = 'Graffiti Image';
          graffiti_image.classList.add('graffiti_info_img');

          // Append the image to the new div
          graffiti_info.appendChild(graffiti_image);


          var graffiti_info_interaction = document.createElement('div');
          graffiti_info_interaction.classList.add('graffiti_info_interaction');
          graffiti_info.appendChild(graffiti_info_interaction);


          // Create fly-to symbol
          var fly_to_symbol = document.createElement('img');
          fly_to_symbol.src = "icons/zoom_to_symbol.svg";
          fly_to_symbol.classList.add('fly_to_symbol');
          fly_to_symbol.textContent = "Fly to";
          graffiti_info_interaction.appendChild(fly_to_symbol);

          // Create a text span for "fly to"
          var flyToText = document.createElement('span');
          flyToText.textContent = 'show on map';
          graffiti_info_interaction.appendChild(flyToText);

          // Create a text link
          var textLink = document.createElement('a');
          textLink.href = `img/${graffiti_id}_lowRes_ortho.png`;
          textLink.target = '_blank'; // Open the link in a new tab
          textLink.textContent = 'full-size image';
          textLink.classList.add('textLink');
          graffiti_info.appendChild(textLink);


          graffiti_info.addEventListener('click', function () {

            var graffiti_info_id = this.id;

            map.flyTo({
              center: graffiti_center_coords[graffiti_info_id],
              zoom: 20,
              bearing: map.getBearing(),
              speed: 0.75,
            });


          });

          // Append the new div to the content-wrapper
          document.getElementById('content-wrapper').appendChild(graffiti_info);


          // Create a new source object with the updated data
          const source = {
            type: 'geojson',
            data: feature,
            tolerance: 1.0,
            maxzoom: 14,
          };

          // Add the new source object to the map
          map.addSource("graffiti_poly" + parseInt(feature.id), source);


          // add 3D layer
          if (is_3D_enabled) {
            map.addLayer({
              'id': 'graffiti_poly_layer' + graffiti_id,
              'type': 'fill-extrusion',
              'source': 'graffiti_poly' + parseInt(feature.id),
              'paint': {
                'fill-extrusion-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#f1881f', //hover color
                  "#d2145c"
                ],
                'fill-extrusion-height': ['get', 'maxZ'],
                'fill-extrusion-base': ['get', 'minZ'],
                'fill-extrusion-opacity': 1,
              }

            });


          }
          // add 2D layer
          else {
            map.addLayer({
              id: 'graffiti_poly_layer' + graffiti_id,
              type: 'fill',
              source: 'graffiti_poly' + parseInt(feature.id),
              paint: {
                'fill-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#f1881f', //hover color
                  "#d2145c"
                ],
                'fill-opacity': 1,
              },
              minzoom: 19,
              //maxzoom: 20
            });

            line_data.features[index].id = graffiti_id;

            map.addSource("graffiti_line" + parseInt(feature.id), {
              type: 'geojson',
              data: line_data.features[index]
            });

            map.addLayer({
              id: 'graffiti_line_layer' + graffiti_id,
              type: 'line',
              source: "graffiti_line" + parseInt(feature.id),
              layout: {
                'line-cap': "square",
              },
              paint: {
                'line-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#f1881f', // Hover color
                  "#d2145c" // Non-hover color
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0, ['case', ['boolean', ['feature-state', 'hover'], false], ['*', 1, 14], 14],
                  20, ['case', ['boolean', ['feature-state', 'hover'], false], ['*', 2, 4], 4]
                ],
              },
              minzoom: 15,
              maxzoom: 19
            });


            map.on('click', 'graffiti_line_layer' + graffiti_id, function (e) {
              toggleSidebar();
              map.flyTo({
                center: e.lngLat, //zoom to the clicked location
                zoom: 19.5,
                duration: 2000
              });


            });


          }
          graffiti_line_layers_on_display.push('graffiti_line_layer' + graffiti_id);
          graffiti_sources_on_display.push("graffiti_line" + parseInt(feature.id));
          graffiti_layers_on_display.push('graffiti_poly_layer' + graffiti_id);
          graffiti_sources_on_display.push("graffiti_poly" + parseInt(feature.id));

          map.on('click', 'graffiti_poly_layer' + graffiti_id, toggleSidebar);


        });

        // add the 2D Clustering
        if (!is_3D_enabled) {
          var graffiti_center_collection = Object.entries(graffiti_center_coords).map(function ([key, coordinates]) {
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: coordinates
              },
              properties: {
                id: key
              }
            };
          });

          // Add the data source using the FeatureCollection
          map.addSource('graffiti_cluster_source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: graffiti_center_collection
            },
            cluster: true,
            clusterMaxZoom: 15,
            clusterRadius: 30
          });

          map.addLayer({
            id: 'graffiti_cluster_layer',
            type: 'circle',
            source: 'graffiti_cluster_source',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                ['rgba', 210, 20, 92, 0.4]
                ,
                10,
                ['rgba', 210, 20, 92, 0.7],
                25,
                ['rgba', 210, 20, 92, 0.9],
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                30,
                10,
                40,
                25,
                50
              ]
            },
            maxzoom: 15
          });



          map.addLayer({
            id: 'graffiti_cluster_layer_count',
            type: 'symbol',
            source: 'graffiti_cluster_source',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ["Open Sans Regular", "Arial Unicode MS Regular"],
              'text-size': 12
            },
            paint: {
              'text-color': 'black',
              'text-halo-color': 'pink',
              'text-halo-width': 1.5
            },
            maxzoom: 15
          });

        }

      }


      );

  }



  function toggleSidebar() {
    var elem = document.getElementById("right");
    var classes = elem.className.split(' ');
    collapsed = classes.indexOf('collapsed') !== -1;

    var padding = {};

    if (collapsed) {
      // Remove the 'collapsed' class from the class list of the element, this sets it back to the expanded state.
      classes.splice(classes.indexOf('collapsed'), 1);

      padding["right"] = 300; // In px, matches the width of the sidebars set in .sidebar CSS class
      map.easeTo({
        padding: padding,
        duration: 1000 // In ms, CSS transition duration property for the sidebar matches this value
      });
    } else {
      padding["right"] = 0;
      // Add the 'collapsed' class to the class list of the element
      classes.push('collapsed');

      map.easeTo({
        padding: padding,
        duration: 1000
      });
    }

    // Update the class list on the element
    elem.className = classes.join(' ');
  }



  function clear_graffiti_layers() {


    graffiti_layers_on_display.forEach(function (layerId) {


      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.off('click', layerId, toggleSidebar);
      }
    });
    graffiti_layers_on_display = [];


    graffiti_line_layers_on_display.forEach(function (layerId) {


      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.off('click', layerId, toggleSidebar);
      }
    });
    graffiti_line_layers_on_display = [];


    graffiti_sources_on_display.forEach(function (sourceID) {
      if (map.getSource(sourceID)) {
        map.removeSource(sourceID);
      }
    });
    graffiti_sources_on_display = [];




    hovered_featureId = null;
    last_feature_id = null;

    if (!is_3D_enabled) {
      if (map.getLayer("graffiti_cluster_layer")) {
        map.removeLayer("graffiti_cluster_layer");
      }
      if (map.getLayer("graffiti_cluster_layer_count")) {
        map.removeLayer("graffiti_cluster_layer_count");
      }
      if (map.getSource("graffiti_cluster_source")) {
        map.removeSource("graffiti_cluster_source");
      }
    }



  }

  function clear_graffiti_info() {
    var graffitiInfoElements = document.querySelectorAll('.graffiti_info');

    graffitiInfoElements.forEach(function (element) {
      element.remove();
    });

  }



  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }




  function change_mapstyle(map_link, opacity) {
    var aerial_map = {
      'version': 8,
      "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      'sources': {
        'raster-tiles': {
          'type': 'raster',
          'tiles': [
            map_link
          ],
          'tileSize': 256,
          minzoom: 0,
          maxzoom: 19,
          'attribution': 'Project INDIGO | OpenStreetMap | basemap.at'
        }
      },
      'layers': [
        {
          'id': 'basemap',
          'type': 'raster',
          'source': 'raster-tiles',
          'paint': {
            'raster-opacity': opacity
          }
        }
      ]
    };
    map.setStyle(aerial_map);
  }






  // ------- SLIDER & DATE PICKER  -----------
  // Get the slider element
  const slider = document.getElementById('slider');

  // Get the date picker elements
  const startDatePicker = document.getElementById('start-date');
  const endDatePicker = document.getElementById('end-date');

  // Set the initial slider values and options
  const sliderOptions = {
    range: {
      min: Date.parse('2015-01-01'),
      max: Date.parse('2023-12-31')
    },
    step: 86400000, // one day
    start: [Date.parse('2015-01-01'), Date.parse('2023-12-31')],
    connect: true,
    values: [Date.parse('2015-01-01'), Date.parse('2023-12-31')],
    //tooltips: true,
  };

  // Create the slider using the options and attach an event listener for the 'update' event
  noUiSlider.create(slider, sliderOptions);

  // initial date values
  // Get the start and end dates from the slider values
  var startDate = new Date(parseInt(sliderOptions.start[0]));
  var endDate = new Date(parseInt(sliderOptions.start[1]));

  // Get the start and end dates from the date pickers, if available
  var startDatePickerValue = startDatePicker && startDatePicker.value;
  var endDatePickerValue = endDatePicker && endDatePicker.value;
  var startDateFromPicker = startDatePickerValue ? new Date(startDatePickerValue) : null;
  var endDateFromPicker = endDatePickerValue ? new Date(endDatePickerValue) : null;

  // Determine the start and end dates to use based on the slider and date pickers
  var effectiveStartDate = startDateFromPicker ? new Date(Math.max(startDate, startDateFromPicker)) : new Date(startDate);
  var effectiveEndDate = endDateFromPicker ? new Date(Math.min(endDate, endDateFromPicker)) : new Date(endDate);



  // Define a debounce function
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }


  // Update the slider when the start date is changed
  startDatePicker.addEventListener('change', function (e) {
    const startDate = new Date(e.target.value);
    slider.noUiSlider.set([startDate.getTime(), slider.noUiSlider.get()[1]]);
  });

  // Update the slider when the end date is changed
  endDatePicker.addEventListener('change', function (e) {
    const endDate = new Date(e.target.value);
    slider.noUiSlider.set([slider.noUiSlider.get()[0], endDate.getTime()]);
  });

  // Update the date pickers when the slider is changed
  slider.noUiSlider.on('update', function (values, handle) {
    const startDate = new Date(parseInt(values[0])).toISOString().slice(0, 10);
    const endDate = new Date(parseInt(values[1])).toISOString().slice(0, 10);
    startDatePicker.value = startDate;
    endDatePicker.value = endDate;
  });


  let isInitializing = true; // Flag to track initialization

  // Wrap the filter code inside the debounce function
  slider.noUiSlider.on('update', debounce(function (values, handle) {

    if (isInitializing) {
      isInitializing = false; // Reset the flag after initialization
      return; // Skip executing the filter code during initialization
    }

    // Get the start and end dates from the slider values
    startDate = new Date(parseInt(values[0]));
    endDate = new Date(parseInt(values[1]));


    // Get the start and end dates from the date pickers, if available
    startDatePickerValue = startDatePicker && startDatePicker.value;
    endDatePickerValue = endDatePicker && endDatePicker.value;
    startDateFromPicker = startDatePickerValue ? new Date(startDatePickerValue) : null;
    endDateFromPicker = endDatePickerValue ? new Date(endDatePickerValue) : null;

    // Determine the start and end dates to use based on the slider and date pickers
    effectiveStartDate = startDateFromPicker ? new Date(Math.max(startDate, startDateFromPicker)) : new Date(startDate);
    effectiveEndDate = endDateFromPicker ? new Date(Math.min(endDate, endDateFromPicker)) : new Date(endDate);


    clear_graffiti_layers();
    clear_graffiti_info();
    load_graffiti_data();


  }, 500));



  let graffiti_poly_features_not_filtered;

  // --------------- BASEMAP MENU -------------------

  // Toggle menu visibility when the menu icon is clicked
  var menu = document.getElementById("basemap-menu");
  document.getElementById("menu-icon").addEventListener("click", function () {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  // Change basemap when a menu item is clicked
  document.getElementById("basemap-list").addEventListener("click", function (event) {
    var selectedBasemap = event.target.dataset.basemap;
    // Get the element with the selected ID
    var basemap_menu_icon = document.getElementById("menu-icon");

    switch (selectedBasemap) {
      case 'standard':
        basemap_menu_icon.style.backgroundImage = "url('icons/color_icon.png')";
        document.getElementById("feature-number").innerText = "Loading..";
        clear_graffiti_layers();
        clear_graffiti_info();
        if (buildings_shown) {
          remove_all_buildings();
        }
        change_mapstyle('https://mapsneu.wien.gv.at/basemap/bmaphidpi/normal/google3857/{z}/{y}/{x}.jpeg', 0.6);
        // Nested map.once to make sure graffiti inside buildings are rendered correctly
        map.once('idle', function () {
          load_graffiti_data();
          map.once('idle', function () {
            if (buildings_shown) {
              load_all_buildings_from_saved_data();
            }
          });
        });
        break;
      case 'aerial':
        basemap_menu_icon.style.backgroundImage = "url('icons/aerial_icon.png')";
        document.getElementById("feature-number").innerText = "Loading..";
        clear_graffiti_layers();
        clear_graffiti_info();
        if (buildings_shown) {
          remove_all_buildings();
        }
        change_mapstyle('https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg', 1);
        // Nested map.once to make sure graffiti inside buildings are rendered correctly
        map.once('idle', function () {
          load_graffiti_data();
          map.once('idle', function () {
            if (buildings_shown) {
              load_all_buildings_from_saved_data();
            }
          });
        });
        break;
      case 'grey':
        basemap_menu_icon.style.backgroundImage = "url('icons/grey_icon.png')";
        document.getElementById("feature-number").innerText = "Loading..";
        clear_graffiti_layers();
        clear_graffiti_info();
        if (buildings_shown) {
          remove_all_buildings();
        }
        change_mapstyle('https://mapsneu.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png', 0.6);
        // Nested map.once to make sure graffiti inside buildings are rendered correctly
        map.once('idle', function () {
          load_graffiti_data();
          map.once('idle', function () {
            if (buildings_shown) {
              load_all_buildings_from_saved_data();
            }
          });
        });
        break;
      case 'osm':
        basemap_menu_icon.style.backgroundImage = "url('icons/osm_icon.png')";
        document.getElementById("feature-number").innerText = "Loading..";
        clear_graffiti_layers();
        clear_graffiti_info();
        if (buildings_shown) {
          remove_all_buildings();
        }
        change_mapstyle('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 0.6);
        // Nested map.once to make sure graffiti inside buildings are rendered correctly
        map.once('idle', function () {
          load_graffiti_data();
          map.once('idle', function () {
            if (buildings_shown) {
              load_all_buildings_from_saved_data();
            }
          });
        });
        break;

    }

  });



  const bounds = [
    [16.150919, 48.086744], // Southwest coordinates
    [16.559096, 48.308418] // Northeast coordinates
  ];

  var is_3D_enabled = true;

  // Function to toggle between 2D and 3D mode
  function toggleMapMode() {

    if (is_3D_enabled) {

      map.easeTo({
        pitch: 0,
        duration: 1000,
        bearing: 0,

      });

      setTimeout(function () {
        // remove 3d and add 2d layer
        if (buildings_shown) {
          toggleBuildings();
        }

        clear_graffiti_layers();
        clear_graffiti_info();
        load_graffiti_data();

      }, 500);

      // disable map rotation using right click + drag
      map.dragRotate.disable();

      // Disable default right-click behavior
      map.getContainer().addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });

      // disable map rotation using touch rotation gesture
      map.touchZoomRotate.disableRotation();
      document.getElementById('button_3D').innerText = '3D';
    } else {



      clear_graffiti_layers();
      clear_graffiti_info();
      load_graffiti_data();

      // Nested so that graffiti are rendered properly if they are contained inside buildings
      map.once('idle', function () {
        if (!buildings_shown) {
          toggleBuildings();
        }
        map.once('idle', function () {
          map.easeTo({
            pitch: 65,
            duration: 1000,
            bearing: 20,

          });
        });
      });


      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
      document.getElementById('button_3D').innerText = '2D';
    }
    is_3D_enabled = !is_3D_enabled;
  }



  // ------ SHOW BUILDINGS BUTTON -----
  let buildings_shown = true;
  let saved_first_row_buildings_data;
  let saved_second_row_buildings_data;
  let saved_third_row_buildings_data;

  function toggleBuildings() {
    if (!buildings_shown) {
      //optional: **add code if there is no saved building data, fetch it**

      load_all_buildings_from_saved_data();

      document.getElementById("button_buildings").checked = true;
      buildings_shown = true;
    }
    // if buildings are being displayed, simply remove them
    else {
      remove_all_buildings();
      buildings_shown = false;
      document.getElementById("button_buildings").checked = false;
    }

  }



  //get map
  var map = new maplibregl.Map({
    container: 'map',
    style: {
      'version': 8,
      "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      'sources': {
        'raster-tiles': {
          'type': 'raster',
          'tiles': [
            'https://mapsneu.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png'
          ],
          'tileSize': 256,
          minzoom: 0,
          maxzoom: 19,
          'attribution':
            'Project INDIGO | OpenStreetMap | basemap.at'
        }
      },
      'layers': [
        {
          'id': 'basemap',
          'type': 'raster',
          'source': 'raster-tiles',
          'paint': {
            'raster-opacity': 0.6
          }
        }
      ]
    },
    cursor: 'default',
    center: [16.377700, 48.212330], // starting position
    zoom: 15, // starting zoom
    minPitch: 0,
    maxPitch: 85,
    minzoom: 0,
    maxzoom: 19,
    maxBounds: bounds,
    attributionControl: false
  });

  // Full-screen button (does not look good because background is black and map is transparent)
  //map.addControl(new maplibregl.FullscreenControl());

  //prevent default double-left-click zoom in behaviour
  map.on('dblclick', function (e) {
    e.preventDefault();
  });


  //move attribution
  map.addControl(new maplibregl.AttributionControl(), 'bottom-left');



  map.on('load', function () {


    fetch('data/graffiti_data_simplifiedLines.geojson')
      .then(response => response.json())
      .then(data => {

        line_data = data;
      });


    load_graffiti_data();

    // ------ ADD BUILDINGS DATA - all 3 rows with different opacity ------
    fetch('data/first_row_buildings.geojson')
      .then(response => response.json())
      .then(data => {
        // Create a new source object with the updated data
        const source_first_row_buildings = {
          type: 'geojson',
          data: data,
          tolerance: 1.0,
          maxzoom: 14,
        };

        saved_first_row_buildings_data = data;

        // Add the new source object to the map
        map.addSource('first_buildings', source_first_row_buildings);
        map.addLayer({
          'id': 'buildings_layer',
          'type': 'fill-extrusion',
          'source': 'first_buildings',
          'paint': {
            'fill-extrusion-color': 'grey',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_top']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_base']
            ],
            'fill-extrusion-opacity': 0.6,
            'fill-extrusion-vertical-gradient': true
          }
        });


      });

    fetch('data/second_row_buildings.geojson')
      .then(response => response.json())
      .then(data => {
        // Create a new source object with the updated data
        const source_second_row_buildings = {
          type: 'geojson',
          data: data,
          tolerance: 1.0,
          maxzoom: 14,
        };

        saved_second_row_buildings_data = data;

        // Add the new source object to the map
        map.addSource('second_buildings', source_second_row_buildings);
        map.addLayer({
          'id': 'buildings_layer2',
          'type': 'fill-extrusion',
          'source': 'second_buildings',
          'paint': {
            'fill-extrusion-color': 'grey',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_top']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_base']
            ],
            'fill-extrusion-opacity': 0.5,
            'fill-extrusion-vertical-gradient': true
          }
        });


      });

    fetch('data/third_row_buildings.geojson')
      .then(response => response.json())
      .then(data => {
        // Create a new source object with the updated data
        const source_third_row_buildings = {
          type: 'geojson',
          data: data,
          tolerance: 1.0,
          maxzoom: 14,
        };

        saved_third_row_buildings_data = data;

        // Add the new source object to the map
        map.addSource('third_buildings', source_third_row_buildings);
        map.addLayer({
          'id': 'buildings_layer3',
          'type': 'fill-extrusion',
          'source': 'third_buildings',
          'paint': {
            'fill-extrusion-color': 'grey',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_top']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              17,
              ['get', 'H_rel_base']
            ],
            'fill-extrusion-opacity': 0.375,
            'fill-extrusion-vertical-gradient': true
          }
        });


      });


    // TERRAIN (not good data, very rough --> not user-friendly. mouse hover does not work well with it)
    /*
    map.addSource("terrain", {
      "type": "raster-dem",
      "url": "PASTE URL HERE",
    });
    map.setTerrain({
      source: "terrain"
    });
    */




    map.easeTo({
      center: [16.383474341669853, 48.212825450492204], // The desired center of the map [longitude, latitude]
      zoom: 17.8, // The desired zoom level of the map
      bearing: -64.8, // The desired bearing (rotation) of the map in degrees
      pitch: 69.5, // The desired pitch (tilt) of the map in degrees
      duration: 8000, // The speed of the fly animation (default: 1.2)
      curve: 1.42,
    });


  });


  //Once map is idle, remove buildings interpolation of heights
  map.once('idle', () => {
    map.setPaintProperty('buildings_layer', 'fill-extrusion-height', ['get', 'H_rel_top']);
    map.setPaintProperty('buildings_layer', 'fill-extrusion-base', ['get', 'H_rel_base']);
    map.setPaintProperty('buildings_layer2', 'fill-extrusion-height', ['get', 'H_rel_top']);
    map.setPaintProperty('buildings_layer2', 'fill-extrusion-base', ['get', 'H_rel_base']);
    map.setPaintProperty('buildings_layer3', 'fill-extrusion-height', ['get', 'H_rel_top']);
    map.setPaintProperty('buildings_layer3', 'fill-extrusion-base', ['get', 'H_rel_base']);
  });




  // --------- FILTER MENU ------------------------- 
  // check boxes code
  const type_of_graffiti = document.getElementById('type_of_graffiti');
  const donaukanal_side = document.getElementById('donaukanal_side');
  const animalCheckbox = document.getElementById('animal-checkbox');
  const politicalCheckbox = document.getElementById('political-checkbox');



  type_of_graffiti.addEventListener('change', function () {
    clear_graffiti_layers();
    clear_graffiti_info();
    load_graffiti_data();
  });

  donaukanal_side.addEventListener('change', function () {
    clear_graffiti_layers();
    clear_graffiti_info();
    load_graffiti_data();
  });

  animalCheckbox.addEventListener('change', function () {
    clear_graffiti_layers();
    clear_graffiti_info();
    load_graffiti_data();
  });

  politicalCheckbox.addEventListener('change', function () {
    clear_graffiti_layers();
    clear_graffiti_info();
    load_graffiti_data();
  });




  // ------ HOVER POPUPS -------
  // Define the popup
  var graffiti_popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'graffiti_popup'
  });





  map.on('mousemove', function (e) {
    if (map.isStyleLoaded() && map.loaded()) {

      if (map.getZoom() < 19 && !is_3D_enabled) {
        var features = map.queryRenderedFeatures(e.point, { layers: graffiti_line_layers_on_display });
      }
      else {
        var features = map.queryRenderedFeatures(e.point, { layers: graffiti_layers_on_display });
      }


      if (features.length) {
        // Get the ID of the feature that the mouse is currently over
        map.getCanvas().style.cursor = 'pointer';
        hovered_featureId = features[0].id;


        map.setFeatureState(
          { source: 'graffiti_poly' + hovered_featureId, id: hovered_featureId },
          { hover: true }
        );


        if (map.getSource('graffiti_line' + hovered_featureId)) {
          map.setFeatureState(
            { source: 'graffiti_line' + hovered_featureId, id: hovered_featureId },
            { hover: true }
          );
        }


        if (!collapsed) {
          var sidebar_toggle_button = document.getElementById("sidebar_toggle_button")
          sidebar_toggle_button.classList.add('hovered_sidebar');
        }



        var container = document.getElementById('content-wrapper');
        var hovered_graffiti_info = document.getElementById(hovered_featureId.toString().padStart(3, '0'));

        // Add transition property to gradually animate the changes
        hovered_graffiti_info.style.transition = "all 1s";

        // Apply the style changes
        hovered_graffiti_info.style.border = '2px solid rgba(0, 0, 0, 1)';
        container.scrollTop = hovered_graffiti_info.offsetTop - 8;
        hovered_graffiti_info.style.transform = "scale(1.05)";


        if (last_feature_id != null && last_feature_id != hovered_featureId) {



          // Set the feature state to indicate that it is currently being hovered over   
          map.setFeatureState(
            { source: 'graffiti_poly' + last_feature_id, id: last_feature_id },
            { hover: false }
          );

          if (map.getSource('graffiti_line' + last_feature_id)) {
            map.setFeatureState(
              { source: 'graffiti_line' + last_feature_id, id: last_feature_id },
              { hover: false }
            );
          }
          var sidebar_toggle_button = document.getElementById("sidebar_toggle_button")
          sidebar_toggle_button.classList.remove('hovered_sidebar');

          var hovered_graffiti_info = document.getElementById(last_feature_id.toString().padStart(3, '0'))
          hovered_graffiti_info.style.border = '2px solid rgba(0, 0, 0, 0.2)';
          hovered_graffiti_info.style.transform = "scale(1)";

        }

        graffiti_popup.remove();

        // Set the HTML content of the popup to display the image
        graffiti_popup.setHTML(`Graffito #<b>${features[0].properties.numberGraf}</b><br><img  class="graffiti_img_preview" src="img/${features[0].properties.numberGraf}_lowRes_ortho.png" alt="Image">`);


        // Display the popup at the mouse cursor's location
        graffiti_popup.setLngLat(e.lngLat).addTo(map);
        graffiti_popup.getElement().classList.add('show');

        last_feature_id = hovered_featureId;

      } else {
        // Remove the hover state for the previous feature, if any
        if (hovered_featureId) {

          map.setFeatureState(
            { source: 'graffiti_poly' + hovered_featureId, id: hovered_featureId },
            { hover: false }
          );

          if (map.getSource('graffiti_line' + last_feature_id)) {
            map.setFeatureState(
              { source: 'graffiti_line' + last_feature_id, id: last_feature_id },
              { hover: false }
            );
          }

          var sidebar_toggle_button = document.getElementById("sidebar_toggle_button")
          sidebar_toggle_button.classList.remove('hovered_sidebar');

          var hovered_graffiti_info = document.getElementById(hovered_featureId.toString().padStart(3, '0'))
          hovered_graffiti_info.style.border = '2px solid rgba(0, 0, 0, 0.2)';
          hovered_graffiti_info.style.transform = "scale(1)";

          // Hide the popup
          graffiti_popup.remove();

          // Reset the cursor style
          map.getCanvas().style.cursor = '';

          // Reset the feature ID
          hovered_featureId = null;


        }
      }
    }
  });




  // ------ POPUP FOR BUILDINGS ------

  // Assuming you have a layer that contains features with a property named 'name'
  // Define a popup and set its initial properties
  var popup_building = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    className: 'popup-buildings'
  });


  if (buildings_shown) {

    // Listen for click events on the map
    map.on('click', function (e) {
      var buildingsLayers = ['buildings_layer', 'buildings_layer2', 'buildings_layer3'];
      var building = map.queryRenderedFeatures(e.point, { layers: buildingsLayers });

      // If a feature was clicked, display a popup with the property value
      if (building.length > 0) {
        var building = building[0];
        var propertyName = 'name';

        // Get the value of the property from the clicked feature
        var propertyValue = building.properties[propertyName];

        if (typeof propertyValue === 'undefined') {
          propertyValue = 'no data'
        }
        // Set the popup content with the property value and coordinates of the clicked point
        popup_building.setLngLat(e.lngLat)
          .setHTML(propertyValue)
          .addTo(map);

      } else {
        // If no feature was clicked, remove the popup from the map
        popup_building.remove();
      }
    });

  }
