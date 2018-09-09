var map,
    restaurants = [],
    google_restaurants = [],
    curr_location,
    marker,
    markersArray = {},
    circle,
    infowindow,
    directionsDisplay,
    total_restaurants = 0,
    total_customers = 0,
    linkNearby = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    latlng_location = '10.3156992,123.88543660000005',
    lat_location = '10.3156992',
    lng_location = '123.88543660000005',
    radius = 10000,
    sType = 'restaurant',
    api_key = 'AIzaSyCU_0bCOtebzXgrdet6C0h5WJRPIOFtJZs',
    total_sales = 0;

function initMap() {

    var location = { lat: 10.19, lng: 123.59 }; // cebu

    // map
    map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 11
    });

    // Try HTML5 geolocation.
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(function(position) {
    //     var pos = {
    //       lat: position.coords.latitude,
    //       lng: position.coords.longitude
    //     };

    //     infowindow.setPosition(pos);
    //     infowindow.open(map);
    //     map.setCenter(pos);

    //     curr_location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude); 

    //     // mark
    //     navig_marker = new google.maps.Marker({
    //         map: map,
    //         position: curr_location,
    //     });

    //   }, function() {
    //     handleLocationError(true, infowindow, map.getCenter());
    //   });
    // } else {
    //   // Browser doesn't support Geolocation
    //   handleLocationError(false, infowindow, map.getCenter());


    //   getCurrentLocation(); // get current location cebu city
    // }
    

    getCurrentLocation(); // get current location cebu city


    // get restaurants from json file
    $.getJSON('google_restaurants.json', function(data) {

        restaurants = data.results; // assign results to global variable
        

    });


    console.log('getRestaurants();');
    getRestaurants(); // get restaurants from google

    console.log('renderCircle();');
    renderCircle(); // render circle

    // // select other restaurant types
    $('#types').on('change', function() {
        clear();
        perRestaurants();
        getPlaces();
    });


    // // init directions renderer
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });
}

  function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos);
    infowindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infowindow.open(map);
  }

// get user's current location
// Kogi-Q SM City Cebu
function getCurrentLocation(lat='10.330', lng='123.876') {
    curr_location = new google.maps.LatLng(lat, lng); 

    // mark
    navig_marker = new google.maps.Marker({
        map: map,
        position: curr_location,
    });
}

// go through each restaurants
function getPlaces() {

    var type = document.getElementById("types").value;

    $.each(restaurants, function(i, v) {

        if (type != '') { // a restaurant type is selected

            if (type == v.types) { // filter restaurants based on type
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
        //document.getElementById('restaurants_list').innerHTML = ''; // clear restaurants list

        $.each(markersArray, function(i, v) {
            if (google.maps.geometry.spherical.computeDistanceBetween(v.getPosition(), circle_pos) < circle.getRadius()) {
                listRestaurants(v); // restaurants_list
                total_restaurants++;
            }
        });
    }

}

function setMarkers(v) {
    var markersLocation = {lat: v.lat, lng: v.lng};
    var marker = new google.maps.Marker({
        position: markersLocation,
        map: map,
        title: v.details.title
      });
}

// go through each restaurants from google
function perRestaurants() {
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

// get restaurants from google
function getRestaurants() {
    service = new google.maps.places.PlacesService(map);

    service.nearbySearch({
        location: curr_location,
        radius: 4000,
        type: ['restaurant'],
    }, function callback(results, status) {
        console.log(google.maps.places);
        console.log(curr_location);
        console.log(results);
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
        url: place.icon,
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
        setDestination(place.geometry.location);
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
        perRestaurants();
        getPlaces();

        // radius changed event
        google.maps.event.addListener(circle, 'radius_changed', function() {
            clearMarkers(); // clear markers
            perRestaurants();
            getPlaces();
        });

        // circle moved event
        google.maps.event.addListener(circle, 'center_changed', function() {
            clearMarkers(); // clear markers
            perRestaurants();
            getPlaces();
        });
    });
}

// set destination
function setDestination(destination) {

    var request = {
        destination: destination,
        origin: curr_location,
        travelMode: 'DRIVING'
    };

    // directions request on service
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {
            
            directionsDisplay.setDirections(response);
            map.setZoom(12);
        }
    });
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
function clear() {

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