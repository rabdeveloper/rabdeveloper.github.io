var map,
    restaurants = [],
    google_restaurants = [],
    current_loc,
    marker,
    markersArray = {},
    circle,
    infowindow,
    directionsDisplay,
    total_restaurants = 0,
    total_customers = 0,
    total_sales = 0;

function initMap() {
    var location = { lat: 10.33, lng: 123.76}; // cebu

    // map
    map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 11
    });

    //getCurrentLocation(); // get user location

    enterCurrentLocation();

    // get restaurants from json file
    getRestaurantJson();

    //getRestaurants(); // get restaurants from google

    renderCircle(); // render circle

    // select other restaurant types
    $('#types').on('change', function() {
        clearOverlays();
        eachRestaurants();
        getPlaces();
        renderTotals();
    });

    // init directions renderer
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });
}

function enterCurrentLocation() {

  var input = document.getElementById('pac-input');

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  var infowindow = new google.maps.InfoWindow();
  var infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);
  var marker = new google.maps.Marker({
    map: map
  });
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    current_loc = place.geometry.location;

    // Set the position of the marker using the place ID and location.
    marker.setPlace({
      placeId: place.place_id,
      location: place.geometry.location
    });

    marker.setVisible(true);

    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-id'].textContent = place.place_id;
    infowindowContent.children['place-address'].textContent = place.formatted_address;
    infowindow.open(map, marker);
  });

}


// get user's current location
function getCurrentLocation() {
    current_loc = new google.maps.LatLng(10.2943,123.9004); // Magellan's Cross

    console.log(current_loc);
    // mark Magellan's Cross location
    navig_marker = new google.maps.Marker({
        map: map,
        position: current_loc,
    });

    // add hover listener on marker
    google.maps.event.addListener(navig_marker, 'click', function() {
        infowindow.setContent('<div><strong>My location</strong><br>Magellan\'s Cross</div>');
        infowindow.open(map, this);
    });
}

// go through each restaurants
function getPlaces() {
    var type = document.getElementById("types").value;

    $.each(restaurants, function(i, v) {
        if (type != '') { // a restaurant type is selected
            if (type == v.type) { // filter restaurants based on type
                createMarker(v);
                total_restaurants++;
            }
        } else { // all restaurant types selected
            createMarker(v);
            total_restaurants++;
        }
    });

    // check if circle exists; if true, count summary within the radius
    if (circle) {
        var circle_pos = new google.maps.LatLng(circle.getCenter().lat(), circle.getCenter().lng());
        total_restaurants = 0, total_customers = 0, total_sales = 0; // reset counters
        document.getElementById('restaurants_list').innerHTML = ''; // clear restaurants list

        $.each(markersArray, function(i, v) {
            if (google.maps.geometry.spherical.computeDistanceBetween(v.getPosition(), circle_pos) < circle.getRadius()) {
                listRestaurants(v); // restaurants_list
                total_restaurants++;
            }
        });
    }

    renderTotals();
}

// go through each restaurants from google
function eachRestaurants() {
    var type = document.getElementById("types").value;
    total_restaurants = 0;

    if (type == '') {
        $.each(google_restaurants, function(i, v) {
            createMarker(v);
            total_restaurants++;
        });
        total_restaurants = google_restaurants.length;
    }
}

// get restaurants from google via json file
function getRestaurantJson() {

    // get restaurants from json file
    $.getJSON('restaurants.json', function(data) {
        results = data.results;
        total_restaurants += results.length; // total places fetched
        restaurants = results;
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);

        }


    });

    getPlaces();

}



// go through each restaurants from google
function perRestaurants() {
    var type = document.getElementById("types").value;
    total_restaurants = 0;

    if (type == '') {
        console.log(google_restaurants);
        $.each(google_restaurants, function(i, v) {
            createMarker(v);
            total_restaurants++;
        });
        total_restaurants = google_restaurants.length;
    }
}

// get restaurants from google
function getRestaurants() {
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: current_loc,
        radius: 4000,
        type: ['restaurant'],
    }, function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            google_restaurants = results;
            total_restaurants += results.length; // total places fetched

            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }

            getPlaces();
        }
    });
}

// create markers
function createMarker(place) {
    // restaurant icons
    var icon = {
        url: 'map.png',
        scaledSize: new google.maps.Size(25, 25),
    };

    // create instance for marker
    marker = new google.maps.Marker({
        icon: icon,
        map: map,
        position: place.geometry.location,
    });
    marker.id = place.id;
    marker.name = place.name;
    if (place.analytics) {
        marker.analytics = place.analytics;
    }

    markersArray[place.id] = marker; // push marker to array

    listRestaurants(marker); // restaurants list

    // opening
    var opening = '';
    if (place.opening_hours) {
        if (place.opening_hours.open_now) {
            opening = '<strong><span style="color: green;">Open now</span></strong><br>';
        } else {
            opening = '<strong><span style="color: red;">Closed</span></strong><br>';
        }
    }

    // specialty
    var specialty = '';
    if (place.specialty) {
        specialty = 'Specialty : ' + place.specialty + '<br>';
    }

    // rating
    var rating = '';
    if (place.rating) {
        rating = 'Rating : ' + place.rating + '<br>';
    }

    // report
    var report = '';
    if (place.analytics) {
        report = '<br><br><a href="#" id="get-report-' + place.id + '">Get analytical report for this restaurant</a></div>';
    }

    infowindow = new google.maps.InfoWindow(); // add instance of info window

    // add on click event on markers to show restaurant details
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
            place.vicinity + '<br><br>' +
            opening +
            'Restaurant type : ' + place.types + '<br>' +
            specialty +
            rating +
            '<a href="#" id="get-direction-' + place.id + '" class="get-direction">Get directions to this restaurant</a>' +
            report
        );
        infowindow.open(map, this);
    });

    // on click get direction
    $(document).off('click', '#get-direction-' + place.id).on('click', '#get-direction-' + place.id, function() {
        if(document.getElementById('pac-input').value == '') {
            document.getElementById("pac-input").focus();
        } else {
            setDestination(place.geometry.location);
        }

    });

    // on click get report
    $(document).on('click', '#get-report-' + place.id, function() {
        var row_data = [];

        $.each(place.analytics, function(i, v) {
            row_data.push([i, v.sales, v.expenses, v.customers]);
        });

        google.charts.load('current', { 'packages' : ['corechart'] });
        google.charts.setOnLoadCallback(function() {
            $('#report').show(); // show report container
            drawChart(marker, row_data, place.name);
        });
    });
}

// generate retaurants list
function listRestaurants(this_marker) {
    var customers = 0, sales = 0;

    $.each(this_marker.analytics, function(i, v) {
        customers += v.customers;
        sales += v.sales;
    });

    total_customers += customers;
    total_sales += sales;

    customers = customers > 0 ? addCommas(customers) : 'NA';
    sales = sales > 0 ? 'P' + addCommas(sales.toFixed(2)) : 'NA';

    document.getElementById('restaurants_list').innerHTML += '<input type="checkbox" onclick="toggleMarker(\'' + this_marker.id + '\')" checked /> ' +
        this_marker.name + '<br>' +
        '<span style="margin-left:2em">- <strong>Customers:</strong> ' + customers +
        ', <br> <strong>Sales:</strong> ' + sales +
        '</span><br>';
}

// toggle markers
function toggleMarker(id) {
    var mark = markersArray[id];
    if (!mark.getVisible()) {
        mark.setVisible(true);
    } else {
        mark.setVisible(false);
    }
}

// draw the data table
function drawChart(marker, row_data, place_name) {
    // generate report data
    var chart_data = new google.visualization.DataTable();
    chart_data.addColumn('string', 'Year');
    chart_data.addColumn('number', 'Sales');
    chart_data.addColumn('number', 'Expenses');
    chart_data.addColumn('number', 'Customers');
    chart_data.addRows(row_data);

    // graph options
    var options = {
        curveType: 'function',
        legend : { position: "bottom" },
        title: place_name + ' analytical report',
        height: 150,
        width: 400
    };

    // draw the chart
    var chart = new google.visualization.LineChart($('#report')[0]);
    chart.draw(chart_data, options);
}

// render radius circle
function renderCircle() {
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['circle']
        },
        markerOptions: { icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' },
        circleOptions: {
            clickable: false,
            editable: true,
            fillColor: '#FF0000',
            fillOpacity: 0.1,
            strokeColor: '#FF0000',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            zIndex: 1
        }
    });
    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'circlecomplete', function(circ) {
        clearCircle(); // remove other instance of circle
        circle = circ; // assign circ to global variable

        clearMarkers(); // clear markers
        eachRestaurants();
        getPlaces();

        // radius changed event
        google.maps.event.addListener(circle, 'radius_changed', function() {
            clearMarkers(); // clear markers
            eachRestaurants();
            getPlaces();
        });

        // circle moved event
        google.maps.event.addListener(circle, 'center_changed', function() {
            clearMarkers(); // clear markers
            eachRestaurants();
            getPlaces();
        });
    });
}

// set destination
function setDestination(destination) {
    var request = {
        destination: destination,
        origin: current_loc,
        travelMode: 'DRIVING'
    };

    // directions request on service
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {



            directionsDisplay.setDirections(response);
        }
    });
}

function renderTotals() {
    document.getElementById('total_restaurants').innerHTML = total_restaurants; // total restaurants fetched
    document.getElementById('total_customers').innerHTML = addCommas(total_customers); // total customers fetched
    document.getElementById('total_sales').innerHTML = 'P' + addCommas(total_sales.toFixed(2)); // total sales fetched
}

function addCommas(num) {
    num += '';
    var x = num.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

// clear circle
function clearCircle() {
    if (circle) {
        circle.setMap(null);
    }
}

// clear markers
function clearMarkers() {
    $.each(markersArray, function(i, marker) {
        marker.setMap(null);
    });
    markersArray = {};
}

// reset map
function clearOverlays() {
    document.getElementById('total_restaurants').innerHTML = ''; // clear total restaurants
    document.getElementById('total_customers').innerHTML = ''; // clear total customers
    document.getElementById('total_sales').innerHTML = ''; // clear total sales
    document.getElementById('restaurants_list').innerHTML = ''; // clear restaurants list

    total_customers = 0; // reset total customers
    total_sales = 0; // reset total customers

    clearMarkers(); // clear markers

    infowindow.close(); // close info window

    // reset directions renderer
    directionsDisplay.setMap(null);
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });

    $('#report').hide(); // hide report container
}
