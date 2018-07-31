// References
var modelObj;
var lastObject = null;
var lastLight = null;
var lastPlane = null;
var directionalLight = null;

/* 	Models list JSON structure
*	{
*  		"obj" : Object filename,
*		"mtl" : Material filename,
*		"scale" : Model scale,
*		"rotX" : Rotation on X axis,
*		"rotY" : Rotation on Y axis,
*		"rotZ" : Rotation on Z axis,
*		"traX" : Tranlation on X axis,
*		"traY" : Tranlation on Y axis,
*		"traZ" : Tranlation on Z axis
*	}	
*/
var obj = {"models" : [
	{"obj":"X1.obj", "mtl":"X1.mtl", "scale":3, "rotX":0, "rotY":0, "rotZ":0, "traX":0, "traY": 1, "traZ":0}, // Libreria 
	{"obj":"X2.obj", "mtl":"X2.mtl", "scale":8, "rotX":0, "rotY":180, "rotZ":0, "traX":0, "traY": 0, "traZ":0}, // Divano
	{"obj":"Bookcase2.obj", "mtl":"Bookcase2.mtl", "scale":3, "rotX":0, "rotY":180, "rotZ":0, "traX":0, "traY": 0.5, "traZ":0}, // Mobiletto
	{"obj":"Table2.obj", "mtl":"Table2.mtl", "scale":0.02, "rotX":0, "rotY":0, "rotZ":0, "traX":0, "traY": 0, "traZ":0}, // Tavolo
	{"obj":"Cabinet.obj", "mtl":"Cabinet.mtl", "scale":2, "rotX":0, "rotY":180, "rotZ":0, "traX":0, "traY": 1, "traZ":0}, // Cassettiera con mensole
	{"obj":"Table.obj", "mtl":"Table.mtl", "scale":3, "rotX":0, "rotY":0, "rotZ":0, "traX":0.2, "traY": 0.35, "traZ":0}, // Tavolino
]};

var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		$("#loader #inside").width((Math.round( percentComplete, 2 )*3) + "px");
	}
};

var onError = function ( xhr ) {
	console.log(xhr); 
};

function loadModel(id) {

	//////////////////////////////////////////////////////////////////////////////////
	//		Load model, scale and position at marker's base (some light needed)
	//////////////////////////////////////////////////////////////////////////////////

	modelObj = obj.models[id-1]; // 0 based
	
	// Load new model, preload material first
	new THREE.MTLLoader()
		.setPath( 'obj/' )
		.load( modelObj.mtl, function ( materials ) {

			$("#loader").fadeIn();

			materials.preload();

			new THREE.OBJLoader()
				.setMaterials( materials )
				.setPath( 'obj/' )
				.load( modelObj.obj, function ( object ) {
					$("#loader").fadeOut();
					// Set directional light to correct position
					directionalLight = new THREE.PointLight( 'white', 1 );
					directionalLight.position.x = $('#shadowX').slider('getValue');
					directionalLight.position.z = $('#shadowY').slider('getValue');
					directionalLight.position.y = 20; 
					directionalLight.shadow.mapSize.set(1920,1920);
					directionalLight.castShadow = true;
					directionalLight.shadow.camera.left = -15; 
					directionalLight.shadow.camera.right = 15;
					directionalLight.shadow.camera.top = 15;
					directionalLight.shadow.camera.bottom = -15;
					directionalLight.shadow.camera.near = 1;
					directionalLight.shadow.camera.far = 1000;
					scene.add( directionalLight );

					// Correctly position the model in order to be vertical, according to parameters
					object.position.x = modelObj.traX * modelObj.scale;
					object.position.y = modelObj.traY * modelObj.scale;
					object.position.z = modelObj.traZ * modelObj.scale;
					object.scale.set(modelObj.scale, modelObj.scale, modelObj.scale);
					object.rotation.x = modelObj.rotX * Math.PI/180;
					object.rotation.y = modelObj.rotY * Math.PI/180;
					object.rotation.z = modelObj.rotZ * Math.PI/180;
					
					// Cast shadow
					object.castShadow = true;
					object.receiveShadow = true;
					// Every mesh of a complex model has to cast a shadow
					object.traverse( function ( child ) { 
					    if ( child instanceof THREE.Mesh ) {
					        child.castShadow = true;
					    }
					});
					// Add a transparent plane to receive shadows
					var geometry = new THREE.PlaneGeometry(30 * modelObj.scale, 30 * modelObj.scale)
					var material = new THREE.ShadowMaterial(); //Shadow
					material.opacity = 0.4; //! bug in threejs. can't set in constructor
					var planeMesh = new THREE.Mesh( geometry, material);
					planeMesh.receiveShadow = true;
					planeMesh.depthWrite = false;
					planeMesh.rotation.x = -Math.PI/2
					arWorldRoot.add(planeMesh);
					
					// add new model and remove the last one
					arWorldRoot.add(object);
			        arWorldRoot.remove(lastObject);
			        arWorldRoot.remove(lastPlane);
			        scene.remove(lastLight);
				    
				    // update references
				    lastObject = object;
				    lastLight = directionalLight;
				    lastPlane = planeMesh;
				}, onProgress, onError );
		});
}

/* Interface utilities */

$(document).ready(function() {
	$("#menu").click(function (){
		$("#models").fadeIn();
		return false;
	});
	$("#close").click(function (){
		$("#models").fadeOut();
		return false;
	});
	$(".elem").click(function(e) {
		var id = this.id.substr(1,1);
		loadModel(id);
		e.preventDefault();
		$("#models").fadeOut();
		return false;
	});
	$('#shadowX').slider({});
	$('#shadowX').slider().on('change', function(ev) {
		directionalLight.position.x = $('#shadowX').slider('getValue');
		directionalLight.position.z = $('#shadowY').slider('getValue');
		directionalLight.position.y = 20;
	});

	$('#shadowY').slider({
		orientation: "vertical"
	});
	$('#shadowY').slider().on('change', function(ev) {
		directionalLight.position.x = $('#shadowX').slider('getValue');
		directionalLight.position.z = $('#shadowY').slider('getValue');
		directionalLight.position.y = 20;
	});

	$("#saveLink").click(function() {
		saveAsImage();
	});
});

/* File saving functions */
var strDownloadMime = "image/octet-stream";
var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}
function loadImages(sources, callback) {
	var images = {};
	var loadedImages = 0;
	var numImages = 0;

	for (var src in sources) {
		numImages++;
	}
	for (var src in sources) {
		images[src] = new Image();
		images[src].onload = function () {
			if (++loadedImages >= numImages) {
				callback(images);
			}
		};
		images[src].src = sources[src];
	}
}
function saveAsImage() {
	var strMime = "image/png";
	var img = new Image();
	var w = window.open('', '');
	w.document.title = "Screenshot";
	var cw = $('#mainCanvas').width();
	var ch = $('#mainCanvas').height();
    try {
		var doubleImageCanvas = document.getElementById('doubleImage');
		doubleImageCanvas.width = cw;
		doubleImageCanvas.height = ch;
		var context = doubleImageCanvas.getContext('2d');
		var sources = {
			firstImage: renderer.domElement.toDataURL(strMime),
			secondImage: arToolkitContext.arController.canvas.toDataURL(strMime)
		};

		loadImages(sources, function(images){
			// Scale images to same size to preserve model/marker alignment
			context.drawImage(images.secondImage, 0, 0, wCamera,hCamera,0,0,cw,ch);
			context.drawImage(images.firstImage, 0, 0, window.innerWidth, window.innerHeight,0,0,cw,ch);
			img.src = doubleImageCanvas.toDataURL("image/png");
			w.document.body.appendChild(img);
			// Optionally save a file directly
			// saveFile(doubleImageCanvas.toDataURL("image/png"), "test.png");
		});
    } catch (e) {
        console.log(e);
        return;
    }
}

/*
Illuminazione automatica non è possibile, ARCore lo fa ma è una funzionalità recente
https://codepen.io/positlabs/post/simplified-lighting-estimation-in-ar
https://www.andreasjakl.com/real-time-light-estimation-with-google-arcore/
*/