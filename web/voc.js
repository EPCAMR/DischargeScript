'use strict';
var accumulator = 0;
var points = [];
const f = 2*Math.PI;
var list;
var canvas_global;
var point_obj = {'default':[]};
var default_label;
var point_group_count = 0;
const worker_support = window.Worker;
var group_ident = 'a';
var metadata;
var img_bytes;
const submission_url = "https://learn.codyben.me/api/epcamr/";
var canvas_url = "ortho.jpeg";
var trashing = false;
var highlighting = false;
// const datasheds = {"b0f485b6-d628-11e1-82f2-000c29e4b898": {"lat":41.131111, "long":-79.872222}};

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

function getCursorPosition(canvas, event) { //https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element

    if(!canvas_global) {
        canvas_global = canvas;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if(trashing) {
        highlighting = false;
        trashSelected({"x":x, "y":y});
        trashing = false;
        $("#test_canvas").removeClass("crosshair");
        $("#test_canvas").addClass("cell");
        return;
    } else if(highlighting) {
        trashing = false;
        highlightSelected({"x":x, "y":y});
        highlighting = false;
        $("#test_canvas").removeClass("crosshair");
        $("#test_canvas").addClass("cell");
        return;
    }

    placeDot(canvas, x, y);
    if(point_obj['default'].length > 0) {
        $(".point-group-req").removeClass("disabled");
    } else {
        $(".point-group-red").addClass("disabled");
    }
    
}

function clickPosition(canvas, event) {

    if(!canvas_global) {
        canvas_global = canvas;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return {"x":x, "y":y};

}

function trashMode() {
    $("#test_canvas").addClass("crosshair");
    $("#test_canvas").removeClass("cell");
    trashing = true;
}

function highlightMode() {
    $.each($(".point-group"), function(){ $(this).removeClass("highlight"); });
    highlighting = true;
    $("#test_canvas").addClass("crosshair");
    $("#test_canvas").removeClass("cell");
}

function highlightSelected(pos) {
    var container = polyContains(pos.x, pos.y);
    // return;

    if(container.length > 0) {
        $.each(container, function(){
            var tm = this;
            var p1 = tm[0];
            var p2 = tm[1];
            var p3 = tm[2];
            var p4 = tm[3];
            $.each($(".point-group"), function(){
                // $(this).removeClass("highlight");
                var list_group = $(this).find(".list-group-item");
                if(list_group.length != 4) {
                    return;
                }

                var t1 = {"x":$(list_group[0]).data("x"), "y":$(list_group[0]).data("y")};
                var t2 = {"x":$(list_group[1]).data("x"), "y":$(list_group[1]).data("y")};
                var t3 = {"x":$(list_group[2]).data("x"), "y":$(list_group[2]).data("y")};
                var t4 = {"x":$(list_group[3]).data("x"), "y":$(list_group[3]).data("y")};

                //could have done this in different loops, but I think this makes more sense.
                var c1 = ((t1.x === p1.x) && (t1.y === p1.y));
                var c2 = ((t2.x === p2.x) && (t2.y === p2.y));
                var c3 = ((t3.x === p3.x) && (t3.y === p3.y));
                var c4 = ((t4.x === p4.x) && (t4.y === p4.y));
                if(c1 && c2 && c3 && c4) {
                    console.log("HIGHLIGHTING");
                    console.log(this);
                    highlightPointGroup(this);
                }
                // $(this).removeClass("highlight");
            });
        });
    }
}

function scrollToTop(){
    var myContainer = $("#accordion");
    var scrollTo = $(".pg-actions");

    myContainer.animate({
        scrollTop: scrollTo.offset().top - myContainer.offset().top + myContainer.scrollTop()
    });
}

function highlightPointGroup(pg) {
    // console.log(pg);
    var myContainer = $("#accordion");
    $(pg).addClass("highlight");

    var scrollTo = $(pg);

    myContainer.animate({
        scrollTop: scrollTo.offset().top - myContainer.offset().top + myContainer.scrollTop()
    });
}

function trashSelected(pos) {
    console.log(pos);
    var container = polyContains(pos.x, pos.y);
    // return;

    if(container.length > 0) {
        $.each(container, function(){
            var tm = this;
            var p1 = tm[0];
            var p2 = tm[1];
            var p3 = tm[2];
            var p4 = tm[3];
            $.each($(".point-group"), function(){
                var list_group = $(this).find(".list-group-item");
                if(list_group.length != 4) {
                    return;
                }

                var t1 = {"x":$(list_group[0]).data("x"), "y":$(list_group[0]).data("y")};
                var t2 = {"x":$(list_group[1]).data("x"), "y":$(list_group[1]).data("y")};
                var t3 = {"x":$(list_group[2]).data("x"), "y":$(list_group[2]).data("y")};
                var t4 = {"x":$(list_group[3]).data("x"), "y":$(list_group[3]).data("y")};

                //could have done this in different loops, but I think this makes more sense.
                var c1 = ((t1.x === p1.x) && (t1.y === p1.y));
                var c2 = ((t2.x === p2.x) && (t2.y === p2.y));
                var c3 = ((t3.x === p3.x) && (t3.y === p3.y));
                var c4 = ((t4.x === p4.x) && (t4.y === p4.y));
                if(c1 && c2 && c3 && c4) {
                    console.log("REMOVING");
                    console.log(this);
                    removePointGroup(this);
                }
            });
        });
    }
}

function makeVOCFromPointGroup(pointGroupJSON, metadata) {
    //yes I know you SHOULDN'T manually create XML.
    var VOC = `<annotation>
        <folder>images</folder>
        <filename>`+metadata.fname+`</filename>
        <path>/webroot/epcamr/`+metadata.fname+`</path>
        <source>
            <database>EPCAMR Site</database>
        </source>
        <size>
            <width>`+metadata.width+`</width>
            <height>`+metadata.height+`</height>
            <depth>3</depth>
        </size>
        <segmented>0</segmented>`;
    $.each(pointGroupJSON, function(){
        var temp_str = `
        <object>
            <name>amd</name>
            <pose>Unspecified</pose>
            <truncated>0</truncated>
            <difficult>0</difficult>
            <bndbox>
                <xmin>`+this.xmin+`</xmin>`+
                `<ymin>`+this.ymin+`</ymin>`+
                `<xmax>`+this.xmax+`</xmax>`+
                `<ymax>`+this.ymax+`</ymax>
            </bndbox>
        </object>`;
        VOC += temp_str;
    });
    VOC += `
    </annotation>`;
    return VOC;
}

function addToList(tuple) {
    var pg_id = "pg-"+point_group_count;
    var x = tuple[0];
    var y = tuple[1];
    if(accumulator == 1) {
        list.append("<div data-value=\""+point_group_count+"\" id="+ pg_id +" class=\"point-group\"> <button data-value=\""+point_group_count+"\" onclick=\"removePointGroup(this)\" type=\"button\" class=\"close\" aria-label=\"Close\"> <span aria-hidden=\"true\">&times;</span> </button> <ul class=\"list-group\"></ul> </div>");
    } else if(accumulator == 4) {
        point_group_count++;
    }

    // var t_id = x+"-"+y;
    console.log("tuple");
    console.log(tuple);
    console.log(pg_id);
    $("#default #"+pg_id+" .list-group").append("<li data-x=\""+x+"\" data-y=\""+y+"\" class=\"list-group-item\" > X: "+x+" Y:"+y+"</li>");
}

async function removePointGroup(group) {
    var index = $(group).data('value');
    list.empty();

    console.log("INDEX"+index);
    console.log(point_obj['default'][index]);
    if(point_obj['default'][index] == undefined) {
        index = 0; //remove last element since numbering restarts.
    }
    point_obj['default'][index] = [];
    var temp_list = [...point_obj['default']];
    // console.log(temp_list);
    point_obj['default'] = [];
    // console.log(temp_list);
    await drawCanvas(canvas_url, true);
    accumulator = 0;
    point_group_count = 0;
    $.each(temp_list, function(){
        if(this == undefined || this.length == 0) {
            return;
        }
        $.each(this, function(){
            console.log("REDRAW");
            placeDot(canvas_global, this.x, this.y);
        });
        
    });
}
function getVOC() {
    let VOC = coercePointGroup();
    download("Pascal-VOC.xml", VOC);

}
function placeDot(canvas, x, y) {
    var ctx = canvas.getContext('2d');

    if(ctx.isPointInPath(x,y)) {
        console.log("YES");
    }
    if(ctx && accumulator != 4) {
        accumulator++;
        console.log("here");
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, f, true);
        ctx.fillStyle = "rgba(22, 232, 228, 1)";
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
        points.push([x,y]);
        addToList([x,y]);
    }
    if(accumulator == 4 && ctx) {

        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        var last_x = points[0][0];
        var last_y = points[0][1];
        ctx.moveTo(last_x, last_y);
        var temp_list = [];
        temp_list.push({'x':last_x, 'y':last_y});
        $.each(points.slice(1,4), function(){
            var x = this[0];
            var y = this[1];
            temp_list.push({'x':x, 'y':y});
            ctx.lineTo(x,y);
            last_x = x;
            last_y = y;
        });
        
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(22, 232, 228, 0.2)";
        ctx.fill();
        accumulator = 0;
        point_obj['default'].push(temp_list);
        points = [];


    }
    
}

function findMaxMins(points) {
    var maxX = points[0].x, maxY = points[0].y, minX = points[0].x, minY = points[0].y;
    $.each(points, function(){
        console.log(this);
        if(this.x > maxX) {
            maxX = this.x;
        }

        if(this.x < minX) {
            minX = this.x;
        }

        if(this.y > maxY) {
            maxY = this.y;
        }

        if(this.y < minY) {
            minY = this.y;
        }
    });

    var t = {"xmax":maxX, "ymax":maxY, "xmin":minX, "ymin":minY};
    console.log(t);
    return t;
}

function coercePointGroup(){
    if(point_obj['default'].length == 0) {
        return null;
    }
    var coerced_list = [];
    $.each(point_obj['default'], function(){
        var t = findMaxMins(this);
        coerced_list.push(t);
    });

    return makeVOCFromPointGroup(coerced_list, metadata);
}

async function loadImage(url) {
    return new Promise(r => { let i = new Image(); i.setAttribute('crossorigin', 'anonymous'); i.onload = (() => r(i)); i.src = url; });
}

function pointIsInPoly(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var {x,y} = point;

    var inside = false;
    console.log(x+" "+y);
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            console.log(intersect);
        if (intersect) inside = !inside;
    }

    return inside;
};

function polyContains(x,y) {
    var p = {'x':x, 'y':y};
    
    var containers = [];
    if(worker_support) {
        // var contains_worker = new Worker('contains.js');
        $.each(point_obj, function(k,v){
            var curr_poly = this;
            $.each(this, function() {
                if(pointIsInPoly(p,this)) {
                    containers.push(this);
                }
            });
        });
        // console.log(pointIsInPoly(p, point_obj['default'][0]));
        // contains_worker.postMessage([p, point_obj]);
    }
    console.log(containers);
    return containers;
}

function submitVOC() {
    $('#modal-wait').modal('toggle');
    var submission = {"image": img_bytes, "VOC": coercePointGroup()};

    // fetch(submission_url, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(submission),
    //   })
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log('Success:', data);
    //   })
    //   .catch((error) => {
    //     console.error('Error:', error);
    //   });

    $.ajax({
        type: "POST", 
        dataType: 'json',
        contentType: 'application/json',
        url:submission_url, 
        data: JSON.stringify(submission), 
        success: function(data){
            $('#modal-wait').modal('toggle');
            if("error" in data) {
                $("#modal-error").modal('toggle');
            } else {
                drawCanvas('data:image/png;base64,'+data.analyzed, false);
            }
            $("#modal-wait-label").text("Image is being processed.");
            
        },
        error: function() {
            $("#modal-wait").modal('toggle');
            $("#modal-error").modal('toggle');
            $("#modal-wait-label").text("Image is being processed.");
        } 

    });
}

function flush_cache() {
    img_bytes = null;
}

async function drawCanvas(url, do_cache) {
    var ctx = document.getElementById('test_canvas');
    var body_width = 1000;
    var body_height = 600;
    var c = ctx;
    canvas_global = ctx;
    metadata = {"fname":"sample.png", "width":body_width, "height":body_height};
    if(do_cache && img_bytes) {
        url = img_bytes;
    }

    if (ctx.getContext) {

        ctx = ctx.getContext('2d');
        ctx.canvas.width = body_width;
        ctx.canvas.height = body_height;

        var old_url = "https://api.mapbox.com/styles/v1/bencodyoski/cka4mbh5e09k61imcaluhjoun/static/-75.962619,41.296237,6,0,0/1000x600@2x?access_token=pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w";
        return loadImage(url).then( img => {ctx.drawImage(img, 0,0, body_width, body_height); img_bytes = c.toDataURL(); console.log("evicting")});
    }
}

function importOrthophoto() {
    $("#modal-coords").modal('toggle');
}

function loadOrthophoto() {
    var lat = $(".ortho-lat").val();
    var lon = $(".ortho-long").val();
    var url = "https://api.mapbox.com/styles/v1/bencodyoski/cka4mbh5e09k61imcaluhjoun/static/"+lon+","+lat+",13,0,0/1000x600@2x?access_token=pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w";
    console.log(url);
    canvas_url = url;
    drawCanvas(url, false);
    img_bytes = canvas_global.toDataURL();
    $("#modal-coords").modal('toggle');
}

async function loadDatashed(datashed_id, submit, from_url) {
    const datashed_meta = datasheds[datashed_id];
    if(!datashed_meta) {
        return false;
    }
    if(!from_url) {
        $("#modal-datashed").modal("toggle");
    }
    const {lat, long} = datashed_meta;
    var url = "https://api.mapbox.com/styles/v1/bencodyoski/cka4mbh5e09k61imcaluhjoun/static/"+long+","+lat+",13,0,0/1000x600@2x?access_token=pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w";
    canvas_url = url;
    await drawCanvas(url, false);
    img_bytes = canvas_global.toDataURL();
    if(submit) {
        $("#modal-wait-label").text("Processing Datashed: "+datashed_id);
        await submitVOC();
    }
}

function promptDatashed() {
    $("#modal-datashed .alert").addClass("datashed-ok");
    $("#modal-datashed").modal("toggle");
}

function datashedForm() {
    var ds_id = $(".datashed-id").val();
    var submit = false;
    if($(".datashed-submit:checked").val() !== undefined) {
        submit = true;
    }

    if(!loadDatashed(ds_id, submit, false)) {
        $(".datashed-ok").removeClass("datashed-ok"); //display error.
    }
}

$( document ).ready(function() {
    list = $("#default .card-body");
    const queryString = window.location.search;
    console.log(queryString);
    const urlParams = new URLSearchParams(queryString);
    console.log(urlParams.get("datashed"));
    const datashed_id = urlParams.get("datashed");
    const doSubmit = (urlParams.get("submit") != undefined);

    if(datashed_id && datasheds[datashed_id] != undefined) {
        const datashed_meta = datasheds[datashed_id];
        const {lat, long} = datashed_meta;
        
        loadDatashed(datashed_id, doSubmit, true);
        
    } else {
        drawCanvas(canvas_url, false);
    }

    
        // ctx.drawImage(img, 0, 0);
});
