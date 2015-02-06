(function () {
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    var container,stats;

    var camera, scene, renderer;

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var triangles;

    var pointCloud = [];
    var pcl = [];

    var numVertices =1000;
    var w = 598/2;
    var h = 362/2;
    var vertices = [];
    var colors = [];
    var meshes = [];
    var blob;
    var dirs = [];
    var texture1;
    var material1;
    var controls;
    var sphereObj;

    for (var i = 0; i < numVertices; i++) {
        var x = Math.random() * w;
        var y = Math.random() * h;
        vertices.push([x, y]);
        colors.push(Math.round(Math.random() * 0xFFFFFF));


        var r = Math.random() * 5 + 40;
        var p = Math.random() * Math.PI;
        var t = Math.random() * Math.PI * 2.0 - Math.PI;

        if (Math.random() > 0.5) {
            r = Math.random() * 5 + 50;
        }

        var x = Math.random() * 100 - 50;
        var y = Math.random() * 100 - 50;
        var z = Math.random() * 100 - 50;

        var v = toCartesian(r, p, t);
        x = v.x;
        y = v.y;
        z = v.z;

        pointCloud.push(new THREE.Vector3(x, y, z));
        var pc = toPolar(x, y, z);
        pcl.push([pc.t, pc.p, pc.r]);
        var dir = new THREE.Vector3(Math.random()*5-2.5, Math.random()*5-2.5, Math.random()*5-2.5);
        if (pc.p < -Math.PI + 0.4) {
            pcl.push([pc.t, pc.p + 2*Math.PI, pc.r]);
            pointCloud.push(new THREE.Vector3(x, y, z));
            dirs.push(dir);
        }/*
        if (pc.t < 1.6) {
            pcl.push([pc.t + Math.PI, pc.p, pc.r]);
            pointCloud.push(new THREE.Vector3(x, y, z));
            dirs.push(dir);
        }*/
        dirs.push(dir);
    }



    var tri2 = Delaunay.triangulate(pcl);


    var triangles = Delaunay.triangulate(vertices);

    function triangleCenter(v) {
        var x2 = v[0][0] + 1/2*(v[1][0]-v[0][0]);
        var x1 = v[2][0];
        var y2 = v[0][1] + 1/2*(v[1][1]-v[0][1]);
        var y1 = v[2][1];
        return [x1 + 2/3 * (x2 - x1), y1 + 2/3*(y2 - y1)];
    }

    var blobChildren = [];
    var first = true;

    function buildMesh() {

        //blob = new THREE.Object3D();

        if (!first) {
            for (var i = 0; i < meshes.length; i++) {
                blob.remove(meshes[i]);
                meshes[i].geometry.dispose();
                meshes[i].material.dispose();
            }
            meshes = [];
        }
        if (texture1) {
            texture1.dispose();
        }
        texture1 = new THREE.ImageUtils.loadTexture( 'img/earth-clouds-art.jpg' );

        // add box 1 - grey8 texture
        material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );



        for (var i = 0; i < tri2.length; i += 3) {
            var geom = new THREE.Geometry();
            var p1 = pointCloud[tri2[i]];
            var p2 = pointCloud[tri2[i + 1]];
            var p3 = pointCloud[tri2[i + 2]];

            geom.vertices.push(p1);
            geom.vertices.push(p2);
            geom.vertices.push(p3);

            var face = new THREE.Face3(1, 2, 0);
            face.normal.set(0, 0, 1); // normal
            geom.faces.push(face);
            geom.faceVertexUvs[0].push([new THREE.Vector2(p2[0] / w, p2[1] / h), new THREE.Vector2(p3[0] / w, p3[1] / h), new THREE.Vector2(p1[0] / w, p1[1] / h)]); // uvs

            var face2 = new THREE.Face3(0, 2, 1);
            face2.normal.set(0, 0, 1); // normal
            geom.faces.push(face2);
            geom.faceVertexUvs[0].push([new THREE.Vector2(p1[0] / w, p1[1] / h), new THREE.Vector2(p3[0] / w, p3[1] / h), new THREE.Vector2(p2[0] / w, p2[1] / h)]); // uvs

            var cubeMaterial = new THREE.MeshBasicMaterial(
                { color: 0xffffff, vertexColors: THREE.VertexColors } );

            var color, face, numberOfSides, vertexIndex;

            // faces are indexed using characters
            var faceIndices = [ 'a', 'b', 'c', 'd' ];

            // assign color to each vertex of current face
            for( var j = 0; j < 3; j++ )
            {
                vertexIndex = face2[ faceIndices[ j ] ];
                // initialize color variable
                color = new THREE.Color( 0xffffff );
                color.setHex( Math.random() * 0xffffff );
                face2.vertexColors[ j ] = color;
            }

            // assign color to each vertex of current face
            for( var j = 0; j < 3; j++ )
            {
                vertexIndex = face[ faceIndices[ j ] ];
                // initialize color variable
                color = new THREE.Color( 0xffffff );
                color.setHex( Math.random() * 0xffffff );
                face.vertexColors[ j ] = color;
            }

            var tri = new THREE.Mesh(geom, cubeMaterial);

            tri.doubleSided = true;

            blob.add(tri);
            meshes.push(tri);
        }
        first = false;

    }
	window.onresize = function () {
			SCREEN_WIDTH = window.innerWidth;
			SCREEN_HEIGHT = window.innerHeight;
			camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000 );
        camera.position.z = 200;
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		};

    function init() {
        var sphere = new THREE.SphereGeometry( 62, 16, 8 );
        var spMat = new THREE.MeshBasicMaterial( { color: 0x100afa } );
        var spMat2 = new THREE.MeshPhongMaterial({
            // light
            specular: '#1001aa',
            // intermediate
            color: '#1001ff',
            // dark
            emissive: '#006063',
            shininess: 5
        });
        container = document.createElement( 'div' );
        document.body.appendChild( container );

        renderer = new THREE.WebGLRenderer( { antialias: true } );

        camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000 );
        camera.position.z = 200;

        scene = new THREE.Scene();

        sphereObj = new THREE.Mesh(sphere, spMat2);

        //scene.add(sphereObj);

        var light = new THREE.DirectionalLight( 0x222222, 2 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        var ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);
        //scene.add()

        var geometry = new THREE.PlaneGeometry(598 / 2, 362 / 2, 1, 1);
        var mesh1 = new THREE.Mesh( geometry, material1 );
        mesh1.rotation.x = -Math.PI / 2;
        mesh1.position.x = 0;
        blob = new THREE.Object3D();
        blob.position.x = 0;
        blob.position.y = 0;
        blob.position.z = 0;
       //scene.add( mesh1 );
        buildMesh();
        scene.add(blob);
        //scene.add(blob);
        blob.rot=0;
        blob.rotZ=0;
        /*
        for (var i = 0; i < triangles.length; i += 3) {
            var geom = new THREE.Geometry();
            var p1 = vertices[triangles[i]];
            var p2 = vertices[triangles[i+1]];
            var p3 = vertices[triangles[i+2]];

            var tri = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture1 }));
            tri.triangleCenter = triangleCenter([p1, p2, p3]);

            geom.vertices.push(new THREE.Vector3(p1[0]-tri.triangleCenter[0], 0, p1[1]-tri.triangleCenter[1]));
            geom.vertices.push(new THREE.Vector3(p2[0]-tri.triangleCenter[0], 0, p2[1]-tri.triangleCenter[1]));
            geom.vertices.push(new THREE.Vector3(p3[0]-tri.triangleCenter[0], 0, p3[1]-tri.triangleCenter[1]));

            var face = new THREE.Face3(1, 2, 0);
            face.normal.set(0, 0, 1); // normal
            geom.faces.push(face);
            geom.faceVertexUvs[0].push([new THREE.Vector2(p2[0]/w, p2[1]/h), new THREE.Vector2(p3[0]/w, p3[1]/h), new THREE.Vector2(p1[0]/w, p1[1]/h)]); // uvs

            face = new THREE.Face3(0, 2, 1);
            face.normal.set(0, 0, 1); // normal
            geom.faces.push(face);
            geom.faceVertexUvs[0].push([new THREE.Vector2(p1[0]/w, p1[1]/h), new THREE.Vector2(p3[0]/w, p3[1]/h), new THREE.Vector2(p2[0]/w, p2[1]/h)]); // uvs

            tri.doubleSided = true;

            var dummy = new THREE.Object3D();
            dummy.position.x = tri.triangleCenter[0];
            dummy.position.z = tri.triangleCenter[1];
            dummy.position.x -= w/2;
            dummy.position.z -= h/2;
            scene.add( dummy );

            dummy.add(tri);

            vertices[triangles[i]].push(tri);
            vertices[triangles[i+1]].push(tri);
            vertices[triangles[i+2]].push(tri);

            tri.maxHeight = vertices[triangles[i]][2].position.y = Math.random() * 400;

            tri.speed = Math.random() * 5;
            tri.rot = 0;
            tri.rot2 = 0;
            tri.dummy = dummy;
            tri.trans = 0;

            tri.direc = new THREE.Vector3(Math.random(),Math.random(),Math.random());

            meshes.push(tri);
        }*/

        // RENDERER
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.setClearColor( 0xf2f7ff, 1 );
        renderer.autoClear = false;

        renderer.domElement.style.position = "relative";
        container.appendChild( renderer.domElement );

        controls = new THREE.OrbitControls( camera, renderer.domElement );

        // STATS1
        stats = new Stats();
        container.appendChild( stats.domElement );

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

        lastTime = new Date().getTime();
    }

    function onDocumentMouseMove(event) {

        mouseX = ( event.clientX - windowHalfX );
        mouseY = ( event.clientY - windowHalfY );

    }

    // Rotate an object around an arbitrary axis in object space
    var rotObjectMatrix;
    function rotateAroundObjectAxis(object, axis, radians) {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

        // old code for Three.JS pre r54:
        // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
        // new code for Three.JS r55+:
        object.matrix.multiply(rotObjectMatrix);

        // old code for Three.js pre r49:
        // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
        // old code for Three.js r50-r58:
        // object.rotation.setEulerFromRotationMatrix(object.matrix);
        // new code for Three.js r59+:
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space
    function rotateAroundWorldAxis(object, axis, radians) {
        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

        // old code for Three.JS pre r54:
        //  rotWorldMatrix.multiply(object.matrix);
        // new code for Three.JS r55+:
        rotWorldMatrix.multiply(object.matrix);                // pre-multiply

        object.matrix = rotWorldMatrix;

        // old code for Three.js pre r49:
        // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
        // old code for Three.js pre r59:
        // object.rotation.setEulerFromRotationMatrix(object.matrix);
        // code for r59+:
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    var lastTime;
    var timePassed = 0;

    function toCartesian(r, theta, phi) {
        var x = r * Math.sin(theta) * Math.cos(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(theta);

        return new THREE.Vector3(x, y, z);
    }

    function toPolar(x,y,z) {
        var sqrd = (x*x)+(y*y)+(z*z);
        var radius = Math.pow(sqrd,.5);
        var theta = Math.acos(z/radius);
        var phi = Math.atan2(y,x);
        var toReturn={
            r:radius,
            t:theta,
            p:phi
        }
        return toReturn;
    }

    function animate() {
        var thisTime = new Date().getTime();
        var deltaTime = thisTime - lastTime;
        timePassed += deltaTime;

        requestAnimationFrame( animate );
        var sc = Math.sin(timePassed/1000) * 0.15 + 1.0;
        sphereObj.scale.set(sc, sc, sc);

        pcl = [];
/*
        for (var i = 0; i < numVertices; i++) {
            pointCloud[i].x += deltaTime / 1000 * dirs[i].x;
            pointCloud[i].y += deltaTime / 1000 * dirs[i].y;
            pointCloud[i].z += deltaTime / 1000 * dirs[i].z;

            if (pointCloud[i].x >= 50) {
                dirs[i].x = Math.abs(dirs[i].x) * -1;
            }
            if (pointCloud[i].x <= -50) {
                dirs[i].x = Math.abs(dirs[i].x);
            }
            if (pointCloud[i].y >= 50) {
                dirs[i].y = Math.abs(dirs[i].y) * -1;
            }
            if (pointCloud[i].y <= -50) {
                dirs[i].y = Math.abs(dirs[i].y);
            }
            if (pointCloud[i].z >= 50) {
                dirs[i].z = Math.abs(dirs[i].z) * -1;
            }
            if (pointCloud[i].z <= -50) {
                dirs[i].z = Math.abs(dirs[i].z);
            }
            var pc = toPolar(pointCloud[i].x, pointCloud[i].y, pointCloud[i].z);
            pcl.push([pc.t, pc.p, pc.r]);
            if (pc.p < -Math.PI + 0.6) {
                pcl.push([pc.t, pc.p + 2*Math.PI, pc.r]);
            }
        }
*/
        if (false) {//thisTime > nextUpdate) {
            tri2 = Delaunay.triangulate(pcl);
            //console.log(tri2);
            buildMesh();
            nextUpdate = thisTime + 5000;
        }

        var axis3 = new THREE.Vector3(0,0,1);
        var axis4 = new THREE.Vector3(1,0,0);
        //var euler = new THREE.Euler( meshes[i].rot, 0, 0, 'XYZ' );
        //meshes[i].position.applyEuler(euler);
        //meshes[i].geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -y ) );
        rotateAroundWorldAxis(blob, axis3,mouseX / 5000);
        rotateAroundWorldAxis(blob, axis4,mouseY / 5000);
        //rotateAroundWorldAxis(meshes[i].dummy, axis3,meshes[i].rot2-mouseY / 50);
        blob.rot = mouseX / 50;
        blob.rotZ = mouseY / 50;
        render();
        controls.update();
        stats.update();
        lastTime = thisTime;
    }

    var nextUpdate = 0;

    function render() {

        camera.position.x = 0;//+= ( mouseX - camera.position.x ) * .05;
        camera.position.y = -70;// THREE.Math.clamp( camera.position.y + ( - ( mouseY - 200 ) - camera.position.y ) * .05, 50, 1000 );
        camera.position.z = 70;

        camera.lookAt( new THREE.Vector3(0, 100, 0) );

        renderer.enableScissorTest( false );
        renderer.clear();
        renderer.enableScissorTest( true );

        renderer.setScissor( 0, 0, SCREEN_WIDTH - 2, SCREEN_HEIGHT );
        renderer.render( scene, camera );

    }

    function update() {
        controls.update();
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        init();
        animate();
    });
})();