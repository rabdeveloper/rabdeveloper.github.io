<?php
$json  = file_get_contents("restaurants_complete.json");
$temp = json_decode(file_get_contents("restaurants_complete.json"), true);  //$json={"var1":"value1","var2":"value2"}


$newRecords = [];
$newRecordsHotel = [];
foreach ($temp['results'] as $key => $tem1) {

        $newRecords[$key] = $tem1;
        $newRecords[$key]['customers'] = rand(1000, 10000);
        $newRecords[$key]['analytics'] = array(
                "2014" => array('sales'=>rand(10000, 100000), 'expenses'=>rand(10000, 100000), 'customers'=>rand(1000, 10000)),
                "2015" => array('sales'=>rand(10000, 100000), 'expenses'=>rand(10000, 100000), 'customers'=>rand(1000, 10000)),
                "2016" => array('sales'=>rand(10000, 100000), 'expenses'=>rand(10000, 100000), 'customers'=>rand(1000, 10000)),
                "2017" => array('sales'=>rand(10000, 100000), 'expenses'=>rand(10000, 100000), 'customers'=>rand(1000, 10000)),
                "2018" => array('sales'=>rand(10000, 100000), 'expenses'=>rand(10000, 100000), 'customers'=>rand(1000, 10000)),
            );

        if($tem1['name'] == 'Jollibee' || $tem1['name'] == 'KFC' || $tem1['name'] == 'KFC Uptown' ||  $tem1['name'] == 'Chowking') {
            // $newRecords[$key]['specialty'] = 'Chickenjoy ';
            // $newRecords[$key]['type'] = 'Fastfood';
        }

        if(strpos($tem1['name'], 'Hotel') !== false) {
            //   echo '<pre>';
            // print_r($tem1['name']);
            // echo '</pre>';


            //$newRecords[$key]['type'] = 'Hotel Restaurant';


        }

        if($tem1['type']=='grilled'){
            $newRecords[$key]['type'] = 'casual dining';
        }

        if($tem1['name']=='Golden Cowrie'){
            $newRecords[$key]['type'] = 'casual dining';
            $newRecords[$key]['specialty'] = 'Filipino Food, Home grown Filipino cooking and festive ambiance ';
        }





}
    echo '<pre>';
    print_r($newRecords);
    echo '</pre>';

$records['results'] = $newRecords;
$newJsonString = json_encode($records, JSON_PRETTY_PRINT);
file_put_contents('restaurants.json', $newJsonString);
