
var SELECT_MODE = 0;
var SHOW_MODE   = 1;

var mode = SELECT_MODE;
var map = null;
var current_station = null;
var infowindow = null;
var sorted = null;
var infowindow = null;
var mode = SELECT_MODE;

function get(id)
{
    return document.getElementById(id);
}

Array.prototype.contains = function(obj) 
{
    var i = this.length;
    while (i--) 
    {
        if (this[i] === obj) 
        {
            return true;
        }
    }
    return false;
}

function init() 
{      
    for(i in mapdict)
    {
        var x = mapdict[i];
        x.position = new google.maps.LatLng(x.Lat, -1*x.Long);
    }

    var center = new google.maps.LatLng(37.257266,-122.03396);
    var options = {
        zoom: 9,
        center: center,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), options);
    
    createMarkers();
}

function createMarkers()
{
    var i;
    for(i in mapdict)
    {
        var x = mapdict[i];
        
        var marker = new google.maps.Marker({
            position: x.position, 
            map: map, 
            title: x.Name
        }); 
        
        attachNumber(marker, x);
        x.Marker = marker;
    }
}


function attachNumber(marker, x) 
{
    if(infowindow != null)
        infowindow.close();
    
    var _infowindow = new google.maps.InfoWindow(
        { 
            content: x.Name + ", " + x.Country + "<br><div style='width:800px;height:400px' id=\"mrk"+x.Number+"\"></div>"
        });
    google.maps.event.addListener(marker, 'click', function() {
        if(mode == SHOW_MODE)
        {
            if(infowindow != null)
                infowindow.close();
            infowindow = _infowindow;
            infowindow.open(map,marker);
            google.maps.event.addListener(_infowindow, 'domready', function() {
                showChart(x.Number);
            });
        }
        else
        if(mode == SELECT_MODE)
        {
            selectStation(x.Number);
        }
        
    });
}

function showChart(id)
{
    var x0 = mapdict[current_station_id];
    var x1 = mapdict[id];
    var t0 = x0.Temps;
    var t1 = x1.Temps;
    var n0 = x0.Name+","+x0.Country;
    var n1 = x1.Name+","+x1.Country;

    var data = new google.visualization.DataTable();
    var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    data.addColumn('string', 'Month');
    data.addColumn('number', n0);
    data.addColumn('number', n1);

    data.addRows(12);
    
    for (var i = 0; i < 12; i++)
    {
        data.setValue(i, 0, monthNames[i]);    
        data.setValue(i, 1, t0[i]);    
        data.setValue(i, 2, t1[i]);    
    }
    
    // Create and draw the visualization.
    console.log(get('mrk'+id));
    
    new google.visualization.ColumnChart(get('mrk'+id)).
    draw(data,
         {title:"Average Monthly Temperatures", 
          width:600, height:400,
          hAxis: {title: "Month"}}
  );
}

function selectStation(id)
{
    current_station_id = id; 
    get("current_station").innerHTML = mapdict[current_station_id].Name + ", " + mapdict[current_station_id].Country;
    get("change_button").disabled = false;
    
    mapdict[current_station_id].Marker.setIcon("http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png");
    mapdict[current_station_id].Marker.setVisible(true);

    sorted = sortBySimilarity(current_station_id);
    A_SLIDERS[0].f_setValue(0);
    hideDissimilarMarkers(0);
    
    mode = SHOW_MODE;
}

function showAllMarkers()
{
    if(infowindow != null)
        infowindow.close();
    
    for(var i in mapdict)
    {
        mapdict[i].Marker.setVisible(true);
        mapdict[i].Marker.setIcon("http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png");
    }
}

function hideDissimilarMarkers(simp)
{
    if (!sorted)
    	return;
    var minsimilarity=sorted[0].similarity;
    var maxsimilarity=sorted[300].similarity;
    var sim;
    if(simp==0)
        sim = minsimilarity;
    else
        sim = minsimilarity + ((maxsimilarity - minsimilarity)/100)*simp;
    var n=0;
    for(var i=0;i<sorted.length;i++)
    {
        var x=sorted[i];
        if(x.similarity <= sim) {
            x.Marker.setIcon("http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png");
            x.Marker.setVisible(true);
            n++;
        } else
        {
            x.Marker.setVisible(false);
        }
    }
    showMatches(sim)
}

function changeStation()
{
    mode = SELECT_MODE;
    get("change_button").disabled = true;
    get("current_station").innerHTML = "";
    showAllMarkers();
}

function zoomToCity(id)
{
    map.setCenter(mapdict[id].position);
}

function showMatches(sim)
{
    var tbl = get('tblMatches');
    while(tbl.rows.length>0)
        tbl.deleteRow(tbl.rows.length-1);

    var maxsimilarity = sorted[sorted.length-1].similarity;
    for(var i=0;i<sorted.length;i++)
    {
        var x=sorted[i];
        if(x.similarity > sim) 
            break;
        var row = tbl.insertRow(tbl.rows.length);

        var c0 = row.insertCell(0);
        var lnk = document.createElement("a");
        lnk.setAttribute("href","#");
        lnk.setAttribute("onclick","zoomToCity(\""+x.id+"\")");
        lnk.appendChild(document.createTextNode(x.Name));
        c0.appendChild(lnk);

        var c1 = row.insertCell(1);
        c1.appendChild(document.createTextNode(x.Country));
        var c2 = row.insertCell(2);

        var similarityp = Math.round(100*(maxsimilarity-x.similarity)/maxsimilarity);

        c2.appendChild(document.createTextNode(""+similarityp+"%"));
    }
}