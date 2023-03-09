// console.log('%c mapDrag.js %c load compelete', 'background-color: red;color:white', 'color: red');
//-------------------------------------
// 2D,3D地圖拖曳更改大小
//-------------------------------------
var objSettings1 = {
    // parent: $('#div_container1'),
    aDiv: $('#div_container1-left'), // obj
    bDiv: $('#div_container1-right'),
    dragHandle: $('#div_container1-handle'),
    aDivResize: true,
    bDivResize: true
}

var objSettings2 = {
    // parent: $('#div_container2'),
    aDiv: $('#div_container2-left'), // obj
    bDiv: $('#div_container2-right'),
    dragHandle: $("#div_container2-handle"),
    aDivResize: true,
    bDivResize: true
}

var objSettings3 = {
    // parent: $('#div_container3'),
    aDiv: $('#div_container3-left'), // obj
    bDiv: $('#div_container3-right'),
    dragHandle: $("#div_container3-handle"),
    aDivResize: true,
    bDivResize: true
}

var objSettings4 = {
    parent: $('#div_container4'),
    aDiv: $('#div_container4-left'), // obj
    bDiv: $('#div_container4-right'),
    dragHandle: $("#div_container4-handle"),
    aDivResize: true,
    bDivResize: true
}

var breakPoints = {
    sm: 576, // div >= 576
    md: 768, // div >= 768
    lg: 992, // div >= 992
    xl: 1200 // div >= 1200
}

function dragLayoutActionsBinding(bindElements) {
    var isMapLayoutResizing = false;
    var parentDiv = bindElements.aDiv.parent(),
        aDiv = bindElements.aDiv,
        bDiv = bindElements.bDiv,
        dragHandleDiv = bindElements.dragHandle;
    var mapLayoutVertiFlag = parentDiv.hasClass("l-layout-seg--verti");

    dragHandleDiv.unbind("tapstart");
    dragHandleDiv.on("tapstart", function (e, touch) {
        isMapLayoutResizing = true;
        aDiv.css({ "-webkit-user-select": "none", transition: "none" });
        bDiv.css({ "-webkit-user-select": "none", transition: "none" });
        // console.log('map tapstart');
    });

    // $(document)
    parentDiv
        .on("tapmove", function (e, touch) {
            if (!isMapLayoutResizing) {
                // console.log(isMapLayoutResizing,'tap move but not handle tap');
            } else {
                // console.log(isMapLayoutResizing,'tap move');
                function pct_calc(partialVal, totalVal) {
                    return (100 * partialVal) / totalVal;
                }

                // 計算dragbar最多可以拖曳到哪裡 (margin: 距離外側邊距)
                function clientXY_calc(dragOffset, coor) {
                    var container_w = parentDiv.width();
                    var container_h = parentDiv.height();
                    var min = 75; //px
                    var min_pctX = pct_calc(min, container_w);
                    var min_pctY = pct_calc(min, container_h);
                    var dragOffset_pctX = pct_calc(dragOffset, container_w);
                    var dragOffset_pctY = pct_calc(dragOffset, container_h);

                    var margin = {
                        minLeft: min_pctX,
                        minRight: null,
                        minTop: min_pctY,
                        minBottom: null
                    };

                    margin.minRight = 100 - min_pctX;
                    margin.minBottom = 100 - min_pctY;
                    var dragOffset_return;

                    switch (coor) {
                        case "x":
                            if (dragOffset_pctX <= margin.minLeft) {
                                dragOffset_return = margin.minLeft;
                            } else if (dragOffset_pctX >= margin.minRight) {
                                dragOffset_return = margin.minRight;
                            } else {
                                dragOffset_return = dragOffset_pctX;
                            }
                            break;
                        case "y":
                            if (dragOffset_pctY <= margin.minTop) {
                                dragOffset_return = margin.minTop;
                            } else if (dragOffset_pctY >= margin.minBottom) {
                                dragOffset_return = margin.minBottom;
                            } else {
                                dragOffset_return = dragOffset_pctY;
                            }
                            break;
                    }
                    return dragOffset_return;
                }

                var aDiv_size, bDiv_size;

                aDiv_size = mapLayoutVertiFlag ? clientXY_calc(touch.offset.y, "y") : clientXY_calc(touch.offset.x, "x");
                bDiv_size = 100 - aDiv_size;

                if (!bindElements.aDivResize) {
                    aDiv_size = '100%';
                    bDiv.css({
                        'position': 'absolute',
                        'z-index': '1'
                    });
                }
                if (!bindElements.bDivResize) {
                    bDiv_size = '100%';
                    aDiv.css({
                        'position': 'absolute',
                        'z-index': '1'
                    });
                }

                aDiv.css(mapLayoutVertiFlag ? "height" : "width", aDiv_size + '%');
                bDiv.css(mapLayoutVertiFlag ? "height" : "width", bDiv_size + '%');


                dragHandleDiv.css(
                    mapLayoutVertiFlag ? "top" : "left",
                    mapLayoutVertiFlag ? clientXY_calc(touch.offset.y, "y") + '%' : clientXY_calc(touch.offset.x, "x") + '%'
                );

                aDiv.css({ "-webkit-user-select": "none" });
                bDiv.css({ "-webkit-user-select": "none" });
                dragHandleDiv.css({ transition: "none" });
                // console.log('map tapmove');

                var divInfos = [
                    {
                        box: aDiv,
                        width: parentDiv.width() * aDiv_size / 100
                    },
                    {
                        box: bDiv,
                        width: parentDiv.width() * bDiv_size / 100
                    }
                ]
                divBreakPointsSet(divInfos);
            }
        })
        .on("tapend", function (e, touch) {
            // console.log('tap end');
            // stop resizing
            if (isMapLayoutResizing) {
                isMapLayoutResizing = false;
                aDiv.css({ "-webkit-user-select": "auto", transition: ".3s linear" });
                bDiv.css({ "-webkit-user-select": "auto", transition: ".3s linear" });
                dragHandleDiv.css({ transition: ".3s" });
            }
            // console.log('map tapend');
        });
}

//-------------------------------------
// 還原layout預設
//-------------------------------------

function mapLayoutDragReset(els) {
    var aDiv = els.aDiv,
        bDiv = els.bDiv,
        dragHandle = els.dragHandle;

    aDiv.removeAttr("style");
    bDiv.removeAttr("style");
    dragHandle.removeAttr("style");
}

//-------------------------------------
// 解除綁定拖曳事件
//-------------------------------------
function mapLayoutDragUnbind(els) {
    var aDiv = els.aDiv,
        bDiv = els.bDiv,
        dragHandle = els.dragHandle;

    aDiv.unbind();
    bDiv.unbind();
    dragHandle.unbind();

}

function divBreakPointsSet(boxObj) {
    $.each(boxObj, function (idx, val) {
        var boxWidth = val.width;
        var boxEl = val.box;

        $.each(breakPoints, function (key, val) {
            var bpNum = val;
            var bpName = key;
            if (boxWidth >= bpNum) {
                boxEl.addClass('c-' + bpName);
            } else {
                boxEl.removeClass('c-' + bpName);
            }
        });

    });

}

dragLayoutActionsBinding(objSettings1);
dragLayoutActionsBinding(objSettings2);
dragLayoutActionsBinding(objSettings3);
dragLayoutActionsBinding(objSettings4);

$(window).resize(function () {
    // dragLayoutActionsBinding(objSettings1);
    // mapLayoutDragReset(objSettings1);

    // dragLayoutActionsBinding(objSettings2);
    // mapLayoutDragReset(objSettings2);

    // dragLayoutActionsBinding(objSettings3);
    // mapLayoutDragReset(objSettings3);
});