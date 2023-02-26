const colorPicker = document.getElementById('colorPicker');
const bgPicker = document.getElementById('bgPicker');
const favoriteColor = document.querySelectorAll('.color-square');
const favoriteBgColor = document.querySelectorAll('.color-bg-square');
const size = document.getElementById('lineSize');
const opacity = document.getElementById('opacity');
const sizeX = document.getElementById('sizeX');
const sizeY = document.getElementById('sizeY');
const sideMenu = document.getElementsByClassName('.side_menu');
const clear = document.getElementById('clear');
const update = document.getElementById('canvasUpdate');
const eraser = document.getElementById('eraser');
const downloadBtn = document.getElementById('downloadBtn');
const loadImg = document.getElementById('file-upload');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const save = document.getElementById('save');
const download = document.getElementById('download');
const shapeSize = document.getElementById('shape_size');
const innerShapeSize = document.getElementById('inner_size');
const shapeSidesNumder = document.getElementById('sides_number');
const shapeRotationSpeed = document.getElementById('shape_rotation');
const shapeFillColor = document.getElementById('shape_fill_color');
const shapeStrokeColor = document.getElementById('shape_stroke_color');
const shapeStrokeSize = document.getElementById('shape_stroke_size');

let canvas;
let ctx;
let savedImageData;
let dragging = false;
let currTool = 'brush';
let usingBrush = false;
let usingEraser = false;
let polygonSides = 6;
let lineColor = colorPicker.value;
let fillColor = bgPicker.value;
let lineSize = size.value;
let currOpas = opacity.value;
let canvasWidth = sizeX.value;
let canvasHeight = sizeY.value;
let coords = [];
let restore_array = [];
let index = -1;
let lastElem = [];
let shapeAngle = 0;
let ajaxHandlerScript = "https://fe.it-academy.by/AjaxStringStorage2.php";
var updatePassword;
let stringName = 'PETROV_SIMPLEPAINT_COORDINATES';


// CLASS BLOCK
class ShapeBoundingBox {
   constructor(left, top, width, height) {
      this.left = left;
      this.top = top;
      this.width = width;
      this.height = height;
   }
}

class MouseDownPos {
   constructor(x, y) {
      this.x = x
      this.y = y
   }
}

class Location {
   constructor(x, y) {
      this.x = x
      this.y = y
   }
}

class PolygonPoint {
   constructor(x, y) {
      this.x = x
      this.y = y
   }
}

let shapeBoundingBox = new ShapeBoundingBox(0, 0, 0, 0);
let mousedown = new MouseDownPos(0, 0);
let loc = new Location(0, 0);


// SETUP CANVAS
document.addEventListener('DOMContentLoaded', setupCanvas);
function setupCanvas() {
   canvas = document.getElementById('myCanvas');
   if (window.innerWidth > 1200) {
      canvas.width = 800;
      canvas.height = 800;
      sizeX.value = 800;
      sizeY.value = 800;
   } else if (window.innerWidth <= 1200) {
      canvas.width = 600;
      canvas.height = 600;
      sizeX.value = 600;
      sizeY.value = 600;
   } else if (window.innerWidth <= 900) {
      canvas.width = 400;
      canvas.height = 400;
      sizeX.value = 400;
      sizeY.value = 400;
   } else {
      canvas.width = 200;
      canvas.height = 300;
      sizeX.value = 200;
      sizeY.value = 300;
   }
   ctx = canvas.getContext('2d');
   ctx.strokeStyle = lineColor;
   ctx.lineWidth = lineSize;
   ctx.fillStyle = bgPicker.value;
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   fillColor = ctx.fillStyle;
   canvas.addEventListener("mousedown", ReactToMouseDown);
   canvas.addEventListener("mousemove", ReactToMouseMove);
   canvas.addEventListener("mouseup", ReactToMouseUp);
   canvas.addEventListener("mouseout", ReactToMouseUp);
   canvas.addEventListener("touchstart", ReactToMouseDown);
   canvas.addEventListener("touchmove", ReactToMouseMove);
   canvas.addEventListener("touchend", ReactToMouseUp);
   canvas.addEventListener("touchcancel", ReactToMouseUp);
   document.addEventListener("keydown", isKeyDown)
   document.addEventListener('change', isChange);
   document.addEventListener('click', isClick);
   previous.addEventListener('click', undo);
   next.addEventListener('click', redo);
   save.addEventListener('click', storeInfo);
   download.addEventListener('click', restoreInfo);
   window.addEventListener('resize', reactToResize);
};

// LISTENERS FUNCTIONS
function isChange(elem) {
   if (elem.target.id === 'colorPicker') {
      colorChange();
   } else if (elem.target.id === 'bgPicker') {
      bgChange();
   } else if (elem.target.id === 'lineSize') {
      lineSizeChange();
   } else if (elem.target.id === 'opacity') {
      opacityChange();
   } else if (elem.target.id === 'file-upload') {
      load(elem);
   }
};
function isClick(e) {
   if (e.target.id === 'clear') {
      clearCanvas();
   } else if (e.target.id === 'canvasUpdate') {
      canvasUpdate();
   } else if (e.target.id === 'downloadBtn') {
      saveFunc();
   }
};
function ReactToMouseDown(e) {
   canvas.style.cursor = "crosshair";
   loc = GetMousePosition(e.clientX, e.clientY);
   mousedown.x = loc.x;
   mousedown.y = loc.y;
   dragging = true;
   SaveCanvasImage();
   if (currTool === 'brush') {
      usingBrush = true;;
   } else if (currTool === 'eraser') {
      usingEraser = true;
      ctx.beginPath();
      ctx.moveTo(mousedown.x, mousedown.y);
   }
};
function ReactToMouseMove(e) {
   canvas.style.cursor = "crosshair";
   loc = GetMousePosition(e.clientX, e.clientY);
   if (currTool === 'brush' && dragging && usingBrush) {
      coords.push({
         name: 'brush',
         x: e.clientX - canvas.offsetLeft,
         y: e.clientY - canvas.offsetTop,
         size: lineSize,
         color: lineColor,
      });
      DrawBrush();
   } else if (currTool === 'eraser' && dragging && usingEraser) {
      erace();
   } else if (dragging && currTool === 'shapes') {
      coords.push({
         name: 'shape',
         x: loc.x,
         y: loc.y,
         angle: shapeAngle,
         rotationSpeed: shapeRotationSpeed.value,
         radius: shapeSize.value,
         inset: innerShapeSize.value,
         sides: shapeSidesNumder.value,
         fill: shapeFillColor.value,
         strokeColor: shapeStrokeColor.value,
         strokeSize: shapeStrokeSize.value
      });
      ctx.save();
      ctx.translate(loc.x, loc.y);
      ctx.rotate(shapeAngle)
      shapeAngle += Number(shapeRotationSpeed.value);
      ctx.fillStyle = shapeFillColor.value;
      ctx.strokeStyle = shapeStrokeColor.value;
      ctx.lineWidth = shapeStrokeSize.value;
      drawShape(0, 0, shapeSize.value, innerShapeSize.value, shapeSidesNumder.value);
      ctx.restore();
   } else {
      if (dragging) {
         RedrawCanvasImage();
         UpdateRubberbandOnMove(loc);
      }
   }
};
function ReactToMouseUp() {
   canvas.style.cursor = "default";
   ctx.beginPath();
   if (dragging) {
      coords.push('mouseup');
      restore_array.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      index++;
      ctx.stroke();
      ctx.closePath();
      dragging = false;
      usingBrush = false;
   };
};
function reactToResize() {
   if (window.innerWidth > 1200 && restore_array.length === 0) {
      canvas.width = 800;
      canvas.height = 800;
      sizeX.value = 800;
      sizeY.value = 800;
   } else if (window.innerWidth > 1200 && restore_array.length > 0) {
      canvas.width = 800;
      canvas.height = 800;
      sizeX.value = 800;
      sizeY.value = 800;
      ctx.putImageData(restore_array[index], 0, 0);
   }
   if (window.innerWidth <= 1200 && restore_array.length === 0) {
      canvas.width = 600;
      canvas.height = 600;
      sizeX.value = 600;
      sizeY.value = 600;
   } else if (window.innerWidth <= 1200 && restore_array.length > 0) {
      canvas.width = 600;
      canvas.height = 600;
      sizeX.value = 600;
      sizeY.value = 600;
      ctx.putImageData(restore_array[index], 0, 0);
   };
   if (window.innerWidth <= 900 && restore_array.length === 0) {
      canvas.width = 400;
      canvas.height = 400;
      sizeX.value = 400;
      sizeY.value = 400;
   } else if (window.innerWidth <= 900 && restore_array.length > 0) {
      canvas.width = 400;
      canvas.height = 400;
      sizeX.value = 400;
      sizeY.value = 400;
      ctx.putImageData(restore_array[index], 0, 0);
   };
   if (window.innerWidth <= 600 && restore_array.length === 0) {
      canvas.width = 200;
      canvas.height = 300;
      sizeX.value = 200;
      sizeY.value = 300;
   } else if (window.innerWidth <= 600 && restore_array.length > 0) {
      canvas.width = 200;
      canvas.height = 300;
      sizeX.value = 200;
      sizeY.value = 300;
      ctx.putImageData(restore_array[index], 0, 0);
   };
};

// HEADER BLOCK FUNCTIONS
// CHANGE TOOLS FUNC
function changeTool(clickedTool) {
   document.getElementById('brush').className = "";
   document.getElementById('line').className = "";
   document.getElementById('rectangle').className = "";
   document.getElementById('circle').className = "";
   document.getElementById('ellipse').className = "";
   document.getElementById('polygon').className = "";
   document.getElementById('eraser').className = "";
   document.getElementById('shapes').className = "";
   document.getElementById(clickedTool).className = "selected";
   currTool = clickedTool;
   if (currTool === 'shapes') {
      document.getElementById('right_menu').style.visibility = "visible";
   } else {
      document.getElementById('right_menu').style.visibility = "hidden";
   }
};
// AJAX REQUEST FUNCTIONS
function storeInfo() {
   updatePassword = Math.random();
   $.ajax({
      url: ajaxHandlerScript, type: 'POST', cache: false, dataType: 'json',
      data: { f: 'LOCKGET', n: stringName, p: updatePassword },
      success: lockGetReady, error: errorHandler
   }
   );
};

function lockGetReady(callresult) {
   if (callresult.error != undefined)
      alert(callresult.error);
   else {
      $.ajax({
         url: ajaxHandlerScript, type: 'POST', cache: false, dataType: 'json',
         data: { f: 'UPDATE', n: stringName, v: JSON.stringify(coords), p: updatePassword },
         success: updateReady, error: errorHandler
      }
      );
   }
};
function updateReady(callresult) {
   if (callresult.error != undefined)
      alert(callresult.error);
}

function restoreInfo() {
   $.ajax(
      {
         url: ajaxHandlerScript, type: 'POST', cache: false, dataType: 'json',
         data: { f: 'READ', n: stringName },
         success: readReady, error: errorHandler
      }
   );
}

function readReady(callresult) {
   if (callresult.error != undefined)
      alert(callresult.error);
   else if (callresult.result != "") {
      coords = JSON.parse(callresult.result);
      replay();
   }
}

function errorHandler(jqXHR, statusStr, errorStr) {
   alert(statusStr + ' ' + errorStr);
};

// TOOLS FUNCTIONS
// GENERAL TOOLS FUNTIONS
function GetMousePosition(x, y) {
   return {
      x: x - canvas.offsetLeft,
      y: y - canvas.offsetTop
   };
};

function SaveCanvasImage() {
   savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

function RedrawCanvasImage() {
   ctx.putImageData(savedImageData, 0, 0);
};

function UpdateRubberbandSizeData(loc) {
   shapeBoundingBox.width = Math.abs(loc.x - mousedown.x);
   shapeBoundingBox.height = Math.abs(loc.y - mousedown.y);

   if (loc.x > mousedown.x) {
      shapeBoundingBox.left = mousedown.x;
   } else {
      shapeBoundingBox.left = loc.x;
   }
   if (loc.y > mousedown.y) {
      shapeBoundingBox.top = mousedown.y;
   } else {
      shapeBoundingBox.top = loc.y;
   }
};

function getAngleUsingXAndY(mouselocX, mouselocY) {
   let adjacent = mousedown.x - mouselocX;
   let opposite = mousedown.y - mouselocY;
   return radiansToDegrees(Math.atan2(opposite, adjacent));
};

function radiansToDegrees(rad) {
   if (rad < 0) {
      return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
   } else {
      return (rad * (180 / Math.PI)).toFixed(2);
   }
};

function degreesToRadians(degrees) {
   return degrees * (Math.PI / 180);
};

function drawRubberbandShape(loc) {
   if (currTool === "brush") {
      DrawBrush();
   } else if (currTool === "line") {
      coords.push({
         name: 'line',
         x1: mousedown.x,
         y1: mousedown.y,
         x2: loc.x,
         y2: loc.y,
         size: lineSize,
         color: lineColor,
      })
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
      ctx.moveTo(mousedown.x, mousedown.y);
      ctx.lineTo(loc.x, loc.y);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineSize;
      ctx.stroke();
      ctx.closePath();
   } else if (currTool === "rectangle") {
      coords.push({
         name: 'rectangle',
         leftPos: shapeBoundingBox.left,
         topPos: shapeBoundingBox.top,
         rectWidth: shapeBoundingBox.width,
         rectHeight: shapeBoundingBox.height,
         size: lineSize,
         color: lineColor,
      })
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top, shapeBoundingBox.width, shapeBoundingBox.height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineSize;
      ctx.stroke();
      ctx.closePath();
   } else if (currTool === "circle") {
      coords.push({
         name: 'circle',
         x: mousedown.x,
         y: mousedown.y,
         radius: shapeBoundingBox.width,
         size: lineSize,
         color: lineColor
      })
      let radius = shapeBoundingBox.width;
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
      ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineSize;
      ctx.stroke();
      ctx.closePath();
   } else if (currTool === "ellipse") {
      coords.push({
         name: 'ellipse',
         x: mousedown.x,
         y: mousedown.y,
         radiusX: shapeBoundingBox.width / 2,
         radiusY: shapeBoundingBox.height / 2,
         size: lineSize,
         color: lineColor,
      })
      let radiusX = shapeBoundingBox.width / 2;
      let radiusY = shapeBoundingBox.height / 2;
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
      ctx.ellipse(mousedown.x, mousedown.y, radiusX, radiusY, Math.PI / 2, 0, Math.PI * 2);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineSize;
      ctx.stroke();
      ctx.closePath();
   } else if (currTool === "polygon") {
      getPolygon();
      ctx.stroke();
   } else if (currTool === "eraser") {
      erace();
   }
};

function UpdateRubberbandOnMove(loc) {
   UpdateRubberbandSizeData(loc);
   drawRubberbandShape(loc);
};

// BRUSH
function DrawBrush() {
   if (usingBrush) {
      ctx.lineTo(loc.x, loc.y);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(loc.x, loc.y);
   }
};

// ERACER
function erace() {
   if (usingEraser) {
      ctx.lineTo(loc.x, loc.y);
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = lineSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
   }
};

// POLYGON
function getPolygonPoints() {
   let angle = degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));
   let radiusX = shapeBoundingBox.width;
   let radiusY = shapeBoundingBox.height;
   let polygonPoints = [];
   coords.push({
      polygonPoints,
      name: 'polygon',
      size: lineSize,
      color: lineColor,
   });
   for (let i = 0; i < polygonSides; i++) {
      polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle),
         loc.y - radiusY * Math.cos(angle)));
      angle += 2 * Math.PI / polygonSides;
   }
   return polygonPoints;
};
function getPolygon() {
   let polygonPoints = getPolygonPoints();
   ctx.beginPath();
   ctx.globalCompositeOperation = "source-over";
   ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
   for (let i = 1; i < polygonSides; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
   }
   ctx.strokeStyle = lineColor;
   ctx.lineWidth = lineSize;
   ctx.closePath();
};

// SHAPES
function drawShape(x, y, radius, inset, n) {
   ctx.beginPath();
   ctx.save();
   ctx.translate(x, y);
   ctx.moveTo(0, 0 - radius);
   for (let i = 0; i < n; i++) {
      ctx.rotate(Math.PI / n);
      ctx.lineTo(0, 0 - (radius * inset));
      ctx.rotate(Math.PI / n);
      ctx.lineTo(0, 0 - radius);
   }
   ctx.restore();
   ctx.closePath();
   ctx.stroke();
   ctx.fill();
};

// UNDO & REDO FUNCTIONS
function undo() {
   if (index <= 0) {
      lastElem.push(restore_array.pop());
      index--;
      clearCanvas();
   } else {
      index--;
      lastElem.push(restore_array.pop());
      ctx.putImageData(restore_array[index], 0, 0);
   }
};
function redo() {
   index++;
   restore_array.push(lastElem.pop());
   ctx.putImageData(restore_array[index], 0, 0);
};




// LEFT MENU FUNCTIONS
// COLOR BLOCK
function selectColor(elem) {
   removeActiveColorClass();
   lineColor = elem.getAttribute('data-color');
   colorPicker.value = lineColor;
   elem.classList.add('active');
};
function colorChange() {
   lineColor = colorPicker.value;
   removeActiveColorClass();
};
function removeActiveColorClass() {
   favoriteColor.forEach(element => {
      element.classList.remove('active');
   });
};

// BACKGROUND COLOR BLOCK
function bgChange() {
   ctx.fillStyle = bgPicker.value;
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   fillColor = bgPicker.value;
   removeActiveBgClass();
};
function selectBgColor(elem) {
   removeActiveBgClass();
   ctx.fillStyle = elem.getAttribute('data-color');
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   bgPicker.value = elem.getAttribute('data-color');
   elem.classList.add('active');
   fillColor = bgPicker.value;

};
function removeActiveBgClass() {
   favoriteBgColor.forEach(element => {
      element.classList.remove('active');
   });
};

// SIZE & OPASITY BLOCK
// CHANGE OPACITY
function opacityChange() {
   ctx.globalAlpha = opacity.value;
   document.getElementById('showOpas').innerHTML = opacity.value;
};
// LINE SIZE 
function lineSizeChange() {
   lineSize = size.value;
   document.getElementById('showSize').innerHTML = size.value;


};

// BUTTON BLOCK
// UPDATE CANVAS
function canvasUpdate() {
   if (sizeX.value > 1600 || 100 > sizeX.value) {
      alert('Ширина холста должен быть от 100 до 1600')
   } else {
      canvas.width = sizeX.value;
      canvas.height = sizeY.value;
      ctx.putImageData(restore_array[index], 0, 0);
   };
};

// CLEAR CANVAS
function clearCanvas() {
   fillColor = 'white';
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.beginPath();
   restore_array = [];
   index = -1;
};

// UPLOAD IMG BUTTON
function load(e) {
   if (e.target.files) {
      let imageFile = e.target.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = function (e) {
         var myImage = new Image();
         myImage.src = e.target.result;
         myImage.onload = function (ev) {
            canvas.width = myImage.width;
            canvas.height = myImage.height;
            ctx.drawImage(myImage, 0, 0);
            let imgData = canvas.toDataURL("image/jpeg", 0.75);
         }
      }
   }
};

// DOWNLOAD IMG BUTTON
function saveFunc() {
   const data = canvas.toDataURL('image/png');
   downloadBtn.href = data;
   downloadBtn.download = 'image.png';
};

// REPLAING FUNCTIONS
function replay() {
   let timer = setInterval(function () {
      let crd = coords.shift();
      if (!coords.length) {
         clearInterval(timer);
         ctx.beginPath();
         return;
      } else if (coords[0].name === 'brush') {
         ctx.lineTo(crd.x, crd.y);
         ctx.globalCompositeOperation = "source-over";
         ctx.strokeStyle = crd.color;
         ctx.lineWidth = crd.size;
         ctx.lineCap = "round";
         ctx.lineJoin = "round";
         ctx.stroke();
         ctx.beginPath();
         ctx.moveTo(crd.x, crd.y);
      } else if (coords[0].name === 'shape') {
         ctx.save();
         ctx.translate(crd.x, crd.y);
         ctx.rotate(crd.angle)
         crd.angle += Number(crd.rotationSpeed);
         ctx.fillStyle = crd.fill;
         ctx.strokeStyle = crd.strokeColor;
         ctx.lineWidth = crd.strokeSize;
         drawShape(0, 0, crd.radius, crd.inset, crd.sides);
         ctx.restore();
         SaveCanvasImage();
      } else if (coords[0].name === 'line') {
         for (let i = 0; i <= coords.length; i++) {
            if (coords[i] === 'mouseup') {
               ctx.beginPath();
               ctx.globalCompositeOperation = "source-over";
               ctx.moveTo(coords[i - 1].x1, coords[i - 1].y1);
               ctx.lineTo(coords[i - 1].x2, coords[i - 1].y2);
               ctx.strokeStyle = coords[i - 1].color;
               ctx.lineWidth = coords[i - 1].size;
               ctx.stroke();
               ctx.closePath();
            }
         }
      } else if (coords[0].name === 'rectangle') {
         for (let i = 0; i <= coords.length; i++) {
            if (coords[i] === 'mouseup') {
               ctx.beginPath();
               ctx.globalCompositeOperation = "source-over";
               ctx.strokeStyle = coords[i - 1].color;
               ctx.lineWidth = coords[i - 1].size;
               ctx.strokeRect(coords[i - 1].leftPos, coords[i - 1].topPos, coords[i - 1].rectWidth, coords[i - 1].rectHeight);
               ctx.stroke();
               ctx.closePath();
            }
         }
      } else if (coords[0].name === 'circle') {
         for (let i = 0; i <= coords.length; i++) {
            if (coords[i] === 'mouseup') {
               ctx.beginPath();
               ctx.globalCompositeOperation = "source-over";
               ctx.arc(coords[i - 1].x, coords[i - 1].y, coords[i - 1].radius, 0, Math.PI * 2);
               ctx.strokeStyle = coords[i - 1].color;
               ctx.lineWidth = coords[i - 1].size;
               ctx.stroke();
               ctx.closePath();
            }
         }
      } else if (coords[0].name === 'ellipse') {
         for (let i = 0; i <= coords.length; i++) {
            if (coords[i] === 'mouseup') {
               ctx.beginPath();
               ctx.globalCompositeOperation = "source-over";
               ctx.ellipse(coords[i - 1].x, coords[i - 1].y, coords[i - 1].radiusX, coords[i - 1].radiusY, Math.PI / 2, 0, Math.PI * 2);
               ctx.strokeStyle = coords[i - 1].color;
               ctx.lineWidth = coords[i - 1].size;
               ctx.stroke();
               ctx.closePath();
            }
         }
      } else if (coords[0].name === 'polygon') {
         for (let i = 0; i <= coords.length; i++) {
            if (coords[i] === 'mouseup') {
               ctx.beginPath();
               ctx.globalCompositeOperation = "source-over";
               ctx.moveTo(coords[i - 1].polygonPoints[0].x, coords[i - 1].polygonPoints[0].y);
               for (let j = 1; j < polygonSides; j++) {
                  ctx.lineTo(coords[i - 1].polygonPoints[j].x, coords[i - 1].polygonPoints[j].y);
               }
               ctx.strokeStyle = coords[i - 1].color;
               ctx.lineWidth = coords[i - 1].size;
               ctx.closePath();
               ctx.stroke();
            }
         }
      }
   }, 10);
};

function isKeyDown(e) {
   if (e.keyCode == 83) {
      localStorage.setItem('coords', JSON.stringify(coords));
   } else if (e.keyCode == 82) {
      coords = JSON.parse(localStorage.getItem('coords'));
      clearCanvas();
      replay();
   } else if (e.keyCode == 67) {
      clearCanvas();
   }
};

