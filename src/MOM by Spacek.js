/// <reference path="C:/Users/Ted/Documents/GitHub/openrct2/distribution/openrct2.d.ts" />
/// <reference types="C:/Users/Ted/Documents/GitHub/openrct2/distribution/openrct2.d.ts" />

// written by Spacek 2020-4-16

/* Reference values */

var MOM_ACTUATE = "spacek.mom_actuate";

var terrainSurfaces = [];
var terrainEdges = [];
var objectTypes = [
    "track",
    "entrance",
    "small_scenery" ,
    "large_scenery" ,
    "wall" ,
    "banner" ,
    "footpath" ,
    "water" ,
    "surface" 
];
var objectTypeNames = [
    "Track",
    "Entrance",
    "Small scenery" ,
    "Large scenery" ,
    "Wall" ,
    "Banner" ,
    "Path" ,
    "Water" ,
    "Land" 
];

var LIFT_MAX = 255;
var LIFT_MIN = 0;

function UnitsToHeight(unit) {
    return (unit - 14)/2 + " unit" + (Math.abs((unit - 14)/2) == 1 ? "" : "s");
}

/* Current parameters */

var selectedOperation = 0;

var selectedSurfaces = [];
var selectedEdges = [];
var selectedObjectTypes = [];

var selectedHeightChange = 0;
var selectedMinBounds = LIFT_MIN;
var selectedMaxBounds = LIFT_MAX;

var TOPBAR_HEIGHT = 15;
var OverallHeight = 0; // updated as the ui is built (like a vBox)
var OverallWidth = 240; //fixed

var Window;
var Widgets;

var typesFlagBox;
var surfacesFlagBox;
var edgesFlagBox;

/* Get real widgets */

function GetWidget(widget) {
    if (Window) {
        return Window.findWidget(widget.name);
    }
}
function GetWidgetByName(name) {
    if (Window) {
        return Window.findWidget(name);
    }
}

/* Widget update functions */

function updateBounds(widget,units) {
    if (!widget) { return;}
    widget.text = UnitsToHeight(units);
}

function updateSpinner(widget) {
    if (!widget) { return;}
    widget.text = "by " + selectedHeightChange/2 + " unit" + (Math.abs(selectedHeightChange/2) == 1 ? "" : "s");
}

/* Value update functions */

function changeSelectedObjectTypes(newValue) {
    selectedObjectTypes = newValue;
}
function changeSelectedSurfaces(newValue) {
    selectedSurfaces = newValue;
}
function changeSelectedEdges(newValue) {
    selectedEdges = newValue;
}
function changeOperationType(newValue) {
    selectedOperation = newValue;
    var widget = GetWidgetByName("heightChange");
    if (widget) {
        widget.isDisabled = newValue ? true : false;
    }
}

/* Perform the work */

function performActionOnElement(element, manifest) {
    // meets min height, max height, and object type requirements
    switch (manifest.selectedOperation) {
        case 0: 
            if (element.type == "surface") {
                //console.log("surface height "+element.baseHeight+" water height "+element.waterHeight+" clearance height "+element.clearanceHeight);
                if (manifest.selectedObjectClasses.indexOf("water") >= 0) {
                    element.waterHeight += manifest.selectedHeightChange * 8;
                }
                if (manifest.selectedObjectClasses.indexOf("surface") >= 0) {
                    element.baseHeight += manifest.selectedHeightChange;
                    element.clearanceHeight += manifest.selectedHeightChange;
                }
            }
            else {
                element.baseHeight += manifest.selectedHeightChange;
                element.clearanceHeight += manifest.selectedHeightChange;
            }
            break;
        case 1: 
            tile.removeElement(i);
            break;
        default:
            break;
    }
}

function performActionOnTile(tile, manifest) {
    for (i = tile.numElements - 1; i >= 0 ; i--) { // goes in reverse order in case the tile elements have to be deleted
        var element = tile.getElement(i);
        //console.log("made it to the " + i +"'th tile element", element.baseHeight,element.type);
        if (element.baseHeight >= manifest.selectedMinBounds && element.baseHeight <= manifest.selectedMaxBounds) {
            if (manifest.selectedObjectClasses.indexOf(element.type) >= 0) {
                performActionOnElement(element,manifest);
            }
            else if (manifest.selectedObjectClasses.indexOf("water") >= 0 && element.type == "surface") {
                performActionOnElement(element,manifest);
            }
        }
    }
}

function findTilesOfType(manifest) {
    var tiles = [];
    for (var y = 0; y < map.size.y; y++) {
        for (var x = 0; x < map.size.y; x++) {
            var tile = map.getTile(x, y);
            if (tile) {
                for (var i = 0; i< tile.numElements; i++) {
                    var element = tile.getElement(i);
                    if (element.type === 'surface') {
                        if (manifest.selectedSurfaces[element.surfaceStyle] && manifest.selectedEdges[element.edgeStyle]){
                            tiles.push(tile);
                        }
                        break;
                    }
                }
            }
        }
    }
    return tiles;
}

function queryOrExecuteAction(manifest, execute) {
    if (manifest.selectedOperation == 0 && manifest.selectedHeightChange == 0) {
        return {
            error: 1,
            errorTitle: "No height change selected"
        };
    }
    if (execute) {
        var tiles = findTilesOfType(manifest);
        for (var i = 0; i < tiles.length; i++ ){
            performActionOnTile(tiles[i],manifest);
        }
    }
    return {};
}

function getManifest() {
    var manifest = {
        selectedSurfaces : selectedSurfaces,
        selectedEdges : selectedEdges,
        selectedHeightChange : selectedHeightChange,
        selectedOperation : selectedOperation,
        selectedMinBounds : selectedMinBounds,
        selectedMaxBounds : selectedMaxBounds,
        selectedObjectClasses : []
    };
    for (var i = 0; i < selectedObjectTypes.length; i++) {
        if (selectedObjectTypes[i]) {
            manifest.selectedObjectClasses.push(objectTypes[i]);
        }
    }
    return manifest;
}

/* Creating a FlagBox */

function FlagBox(name,valueChanged) {
    this.name = "flagbox " + name;
    this.text = name;
    this.type = "groupbox";
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.storedValue = [];
    this.columns = 1;
    this.checkBoxHeight = 12;
    this.widgets = [];
    this.padding = [5,12,-5,-5];
    this.valueChanged = valueChanged;
}

function flagBoxAddFlag(flagBox, name, startsChecked) {
    this.name = flagBox.name + ' checkbox ' + name;
    this.text = name;
    this.type = "checkbox";
    this.isChecked = false;
    this.isDisabled = false;
    var flagIndex = flagBox.widgets.length;
    flagBox.storedValue.push(startsChecked ? true : false);
    this.onChange = function(newValue) {
        flagBox.storedValue[flagIndex] = newValue;
        flagBox.valueChanged(flagBox.storedValue);
    }
    flagBox.widgets.push(this)
}

function flagBoxUpdateChildren(flagBox) {
    var rows = Math.ceil(flagBox.widgets.length / flagBox.columns);
    flagBox.height = rows * flagBox.checkBoxHeight + flagBox.padding[1] - flagBox.padding[3];
    for (var i = 0; i < flagBox.widgets.length; i++) {
        var checkBox = flagBox.widgets[i];
        checkBox.height = flagBox.checkBoxHeight;
        checkBox.width = Math.floor((flagBox.width - flagBox.padding[0] + flagBox.padding[2])/flagBox.columns);
        checkBox.x = flagBox.x + flagBox.padding[0] + Math.floor(i/rows) * checkBox.width;
        checkBox.y = flagBox.y + flagBox.padding[1] + (i % rows) * flagBox.checkBoxHeight;
    }
}

function flagBoxRefresh(flagBox) {
    for (var i = 0; i < flagBox.widgets.length; i++) {
        flagBox.widgets[i].isChecked = flagBox.storedValue[i] ? true : false;
        var widget = GetWidget(flagBox.widgets[i]);
        if (!widget) {continue;}
        widget.isChecked = flagBox.widgets[i].isChecked;
    }
}

function flagBoxSetValue(flagBox, value) {
    flagBox.storedValue = value;
    flagBox.valueChanged(value);
    flagBoxRefresh(flagBox);
}

/* Create the UI */

function createWidgets() {
    Widgets = [];
    
    // changing height or deleting
    
    var operationTypeGroupBox = {
        type : 'groupbox',
        text : 'Action',
        x : 0,
        y : TOPBAR_HEIGHT,
        height : 0,
        width : OverallWidth/2
    }
    var operationType = {
        name : "operationType",
        type : 'dropdown',
        items : ['Raise/lower','Destroy'],
        x : 5,
        y : TOPBAR_HEIGHT + 12,
        height : 12,
        width : OverallWidth/2-10,
        selectedIndex : 0,
        onChange : function(index) {
            operationType.selectedIndex = index;
            changeOperationType(index);
        }
    };
    operationTypeGroupBox.height = operationType.height + 12 + 5;
    Widgets.push(operationTypeGroupBox);
    Widgets.push(operationType);
    
    // height to change
    
    var heightChangeGroupBox = {
        type : "groupbox",
        text : "Raise/lower amount",
        isDisabled : false,
        x : OverallWidth/2,
        y : TOPBAR_HEIGHT,
        height : 0,
        width : OverallWidth/2
    }
    var heightChange = {
        name : "heightChange",
        type : 'spinner',
        x : OverallWidth/2 + 5,
        y : TOPBAR_HEIGHT + 12,
        width: OverallWidth/2 - 10,
        height: 12,
        text : "0",
        onDecrement: function() {
            if (operationType.selectedIndex) {return;}
            if (selectedHeightChange > -LIFT_MAX) {
                selectedHeightChange--;
                updateSpinner(GetWidget(heightChange));
            }
        },
        onIncrement: function() {
            if (operationType.selectedIndex) {return;}
            if (selectedHeightChange < LIFT_MAX) {
                selectedHeightChange++;
                updateSpinner(GetWidget(heightChange));
            }
        }
    };
    heightChangeGroupBox.height = heightChange.height + 12 + 5;
    Widgets.push(heightChangeGroupBox);
    Widgets.push(heightChange);
    
    OverallHeight = Math.max(operationTypeGroupBox.y + operationTypeGroupBox.height, heightChangeGroupBox.y + heightChangeGroupBox.height);
    
    // min and max heights
    var boundsChangeGroupBox = {
        type : "groupbox",
        text : "upper and lower bounds",
        x : 0,
        y : OverallHeight,
        width : OverallWidth,
        height : 0
    }
    var boundsChangeMin = {
        name : "boundsChangeMin",
        type : "spinner",
        x : 5,
        y : OverallHeight + 12,
        width : OverallWidth/2 - 10,
        height : 12,
        text : "asdf",
        value : 0,
        onDecrement: function() {
            if (selectedMinBounds > LIFT_MIN) {
                selectedMinBounds--;
                updateBounds(GetWidget(boundsChangeMin),selectedMinBounds);
            }
        },
        onIncrement: function() {
            if (selectedMinBounds < selectedMaxBounds) {
                selectedMinBounds++;
                updateBounds(GetWidget(boundsChangeMin),selectedMinBounds);
            }
        },
    }
    var boundsChangeMax = {
        name : "boundsChangeMax",
        type : "spinner",
        x : OverallWidth/2 + 5,
        y : OverallHeight + 12,
        width : OverallWidth/2 - 10,
        height : 12,
        text : "asdf",
        value : 0,
        onDecrement: function() {
            if (selectedMaxBounds > selectedMinBounds) {
                selectedMaxBounds--;
                updateBounds(GetWidget(boundsChangeMax),selectedMaxBounds);
            }
        },
        onIncrement: function() {
            if (selectedMaxBounds < LIFT_MAX) {
                selectedMaxBounds++;
                updateBounds(GetWidget(boundsChangeMax),selectedMaxBounds);
            }
        },
    }
    boundsChangeGroupBox.height = boundsChangeMin.height + 12 + 5;
    Widgets.push(boundsChangeGroupBox);
    Widgets.push(boundsChangeMin);
    Widgets.push(boundsChangeMax);
    
    OverallHeight = boundsChangeGroupBox.y + boundsChangeGroupBox.height;
    
    // object type checkbox
    typesFlagBox = new FlagBox("Object types:",changeSelectedObjectTypes),
    typesFlagBox.width = OverallWidth;
    typesFlagBox.columns = 2;
    typesFlagBox.x = 0
    typesFlagBox.y  = OverallHeight;
    Widgets.push(typesFlagBox);
    
    for (var i = 0; i < objectTypes.length; i++) {
        var c = new flagBoxAddFlag(typesFlagBox,objectTypeNames[i]);
        Widgets.push(c);
    }
    flagBoxUpdateChildren(typesFlagBox);
    OverallHeight = typesFlagBox.y + typesFlagBox.height;
    
    // surface type checkbox
    surfacesFlagBox = new FlagBox("Above land types:",changeSelectedSurfaces);
    surfacesFlagBox.width = OverallWidth;
    surfacesFlagBox.columns = 2;
    surfacesFlagBox.x = 0;
    surfacesFlagBox.y = OverallHeight;
    
    Widgets.push(surfacesFlagBox);
    for (var i = 0; i < terrainSurfaces.length; i++) {
        var c = new flagBoxAddFlag(surfacesFlagBox,terrainSurfaces[i].name);
        Widgets.push(c);
    }
    flagBoxUpdateChildren(surfacesFlagBox);
    
    // edge type checkbox
    edgesFlagBox = new FlagBox("Above edge types:",changeSelectedEdges);
    edgesFlagBox.width = OverallWidth;
    edgesFlagBox.columns = 2;
    edgesFlagBox.x = 0;
    edgesFlagBox.y = surfacesFlagBox.y+surfacesFlagBox.height;
    
    Widgets.push(edgesFlagBox);
    for (var i = 0; i < terrainEdges.length; i++) {
        var c = new flagBoxAddFlag(edgesFlagBox,terrainEdges[i].name);
        Widgets.push(c);
    }
    flagBoxUpdateChildren(edgesFlagBox);
    OverallHeight = edgesFlagBox.y + edgesFlagBox.height
    
    //below the checkboxes
    
    var warningGroup = {
        type : "groupbox",
        x : 0,
        y : OverallHeight,
        width : OverallWidth,
        height : 0
    }
    
    var warningLabel = {
        type : "label",
        text : "M.O.M. ACTIONS ARE NOT REVERSIBLE\nUSE CAUTION WHEN USING",
        x : 5,
        y : OverallHeight + 10,
        width : OverallWidth - 10,
        height : 24
    }
    warningGroup.height = warningLabel.height + 15;
    OverallHeight = warningGroup.y + warningGroup.height;
    Widgets.push(warningGroup);
    Widgets.push(warningLabel);
    
    var applyButton = {
        type : "button",
        text : "Apply",
        width : 100,
        height : 30,
        x : 5,
        y : OverallHeight + 5,
        onClick : function() {
            context.executeAction(MOM_ACTUATE, getManifest());
        }
    }
    Widgets.push (applyButton);
    
    var resetButton = {
        type : "button",
        text : "Reset selection",
        width : 100,
        height : 30,
        x : OverallWidth-105,
        y : OverallHeight + 5,
        onClick : function() {
            for (var i = 0; i < selectedObjectTypes; i++ ) {
                selectedObjectTypes[i] = false;
            }
            flagBoxSetValue(typesFlagBox,selectedObjectTypes);
            
            for (var i = 0; i < selectedSurfaces; i++ ) {
                selectedSurfaces[i] = false;
            }
            flagBoxSetValue(surfacesFlagBox,selectedSurfaces);
            
            for (var i = 0; i < selectedEdges; i++ ) {
                selectedEdges[i] = false;
            }
            flagBoxSetValue(edgesFlagBox,selectedEdges);
            
            selectedOperation = 0;
            selectedHeightChange = 0;
            selectedMinBounds = LIFT_MIN;
            selectedMaxBounds = LIFT_MAX;
            
            updateSpinner(GetWidgetByName("heightChange"));
            updateBounds(GetWidgetByName("boundsChangeMin"),selectedMinBounds);
            updateBounds(GetWidgetByName("boundsChangeMax"),selectedMaxBounds);
            changeOperationType(selectedOperation);
        }
    }
    Widgets.push (applyButton);
    Widgets.push (resetButton);
    OverallHeight = applyButton.y + applyButton.height + 5;
}

/* Getting the plugin to open */

function openWindow() {
    Window = ui.getWindow("MOM_window");
    if (Window) {
        Window.bringToFront();
        return;
    }
    
    Window = ui.openWindow({
        classification: "MOM_window",
        title: "Map Object Manipulation",
        x: 100,
        y: 100,
        width: OverallWidth,
        height: OverallHeight,
        widgets: Widgets,
    });
    flagBoxRefresh(typesFlagBox);
    flagBoxRefresh(surfacesFlagBox);
    flagBoxRefresh(edgesFlagBox);
    updateSpinner(GetWidgetByName("heightChange"));
    updateBounds(GetWidgetByName("boundsChangeMin"),selectedMinBounds);
    updateBounds(GetWidgetByName("boundsChangeMax"),selectedMaxBounds);
    changeOperationType(selectedOperation);
}

var main = function () {
    terrainSurfaces = context.getAllObjects("terrain_surface")
    terrainEdges = context.getAllObjects("terrain_edge")
    
    context.registerAction(MOM_ACTUATE,
        function(manifest) { return queryOrExecuteAction(manifest, false); },
        function(manifest) { return queryOrExecuteAction(manifest, true); });

    if (typeof ui === 'undefined') {
        return;
    }

    ui.registerMenuItem("M.O.M.", function() {
        openWindow();
    });
    
    createWidgets();
};

registerPlugin({
    name: 'M.O.M. by Spacek',
    version: '1.0',
    authors: ['Spacek'],
    type: 'remote',
    main: main
});