var speed;
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x6f00ff);
var camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 30;
camera.position.y = 30;

var ctx, pieces, numberOfPieces, lastUpdateTime, back, played = false;

function randomColor() {
    let colors = ['#f00', '#0f0', '#00f', '#0ff', '#f0f', '#ff0'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function update() {
    let now = Date.now(),
        dt = now - lastUpdateTime;

    for (let i = pieces.length - 1; i >= 0; i--) {
        let p = pieces[i];

        if (p.y > canvas.height) {
            pieces.splice(i, 1);
            continue;
        }

        p.y += p.gravity * dt;
        p.rotation += p.rotationSpeed * dt;
    }


    while (pieces.length < numberOfPieces) {
        pieces.push(new Piece(Math.random() * canvas.width, -20));
    }

    lastUpdateTime = now;

    setTimeout(update, 1);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(function(p) {
        ctx.save();

        ctx.fillStyle = p.color;

        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
        ctx.rotate(p.rotation);

        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

        ctx.restore();
    });

    requestAnimationFrame(draw);
}

function Piece(x, y) {
    this.x = x;
    this.y = y;
    this.size = (Math.random() * 0.5 + 0.75) * 15;
    this.gravity = (Math.random() * 0.5 + 0.75) * 0.1;
    this.rotation = (Math.PI * 2) * Math.random();
    this.rotationSpeed = (Math.PI * 2) * (Math.random() - 0.5) * 0.001;
    this.color = randomColor();
}

var lightPos = [new THREE.Vector3(0, 50, 20), new THREE.Vector3(0, 15, -20), new THREE.Vector3(-20, 15, 20), new THREE.Vector3(20, -15, 0)];

var tetha = 0.0,
    edgeSize = 20,
    padding = 0.15,
    cubeSize = edgeSize + (edgeSize - 1) * padding,
    halfCubeSize = cubeSize / 2;

var paused = false,
    pause_x = [],
    pause_y = [],
    pause_z = [];

var snake = [],
    apple,
    hole1,
    hole2,
    sphere = new THREE.SphereGeometry(0.5, 32, 32),
    cube = new THREE.BoxGeometry(1, 1, 1),
    gameCube = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
    direction = new THREE.Vector3(1, 0, 0),
    score = 0;

var renderer = new THREE.WebGLRenderer({ antialias: true });

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableKeys = false;

var clock = new THREE.Clock(),
    text = document.createElement("div"),
    texter = document.createElement("div"),
    canvas = document.createElement("canvas"),
    p = document.createElement("p"),
    label = document.createElement("label"),
    input = document.createElement("input"),
    div = document.createElement("div"),
    keysQueue = [],
    end = false,
    body_texture = new THREE.TextureLoader().load('textures/scales.jpg'),
    head_texture = new THREE.TextureLoader().load('textures/head_scales.jpg'),
    apple_texture = new THREE.TextureLoader().load('textures/apple.jpg');

function init() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "absolute";
    canvas.style.top = 20 + "px";
    canvas.style.left = 20 + "px";

    ctx = canvas.getContext('2d');
    pieces = [];
    numberOfPieces = 100;
    lastUpdateTime = Date.now();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    lightPos.forEach(function(v) {
        var light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(v.x, v.y, v.z);
        scene.add(light)
    });

    for (var i = 0; i < 5; i++) {
        var snakeCubeMaterial = new THREE.MeshPhongMaterial({ map: (i == 4) ? head_texture : body_texture });
        snake.push(new Cube(new THREE.Vector3((i + i * padding) - halfCubeSize + 0.5, 0.5 + padding / 2, 0.5 + padding / 2), snakeCubeMaterial, scene));
    }

    var appleCubeMaterial = new THREE.MeshPhongMaterial({ map: apple_texture });
    var blackHoleMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    apple = new Sphere(spawnAppleVector(), appleCubeMaterial, scene);
    hole1 = new Sphere(spawnHole1Vector(), blackHoleMaterial, scene)
    hole2 = new Sphere(spawnHole2Vector(), blackHoleMaterial, scene);
    var edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    new Cube(new THREE.Vector3(0, 0, 0), edgesMaterial, scene, gameCube, true).setPosition(0, 0, 0);

    text.style.position = "absolute";
    text.style.width = 200;
    text.style.height = 100;
    texter.innerHTML = "Score: " + score;
    text.style.top = 20 + "px";
    text.style.left = 20 + "px";
    text.style.fontSize = 50 + "px";

    document.body.appendChild(text);

    text.appendChild(texter);

    input.type = "text";
    input.id = "amount";
    input.readOnly = true;
    input.style = "border:0; color:#f6931f; font-weight:bold; width:80px; height:60px; text-align: center;font-size:40px";
    label.htmlFor = "amount";
    label.innerHTML = "Speed: ";

    p.appendChild(label);
    p.appendChild(input);

    text.appendChild(p);

    div.id = "slider-vertical";
    div.style = style = "height:400px;";

    text.appendChild(div);

    $("#slider-vertical").slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 100,
        value: 60,
        slide: function(event, ui) {
            $("#amount").val(ui.value);
            speed = ui.value;
        }
    });
    $("#amount").val($("#slider-vertical").slider("value"));
    speed = $("#slider-vertical").slider("value")

    clock.startTime = 0.0;
    render();
}

function restart() {
    while (snake.length > 5) scene.remove(snake.shift().mesh);

    for (var i = 0; i < snake.length; i++) {
        snake[i].setPosition((i + i * padding) - halfCubeSize + 0.5, 0.5 + padding / 2, 0.5 + padding / 2);
    }
    end = false;
    direction = new THREE.Vector3(1, 0, 0);
    texter = "Score: " + 0;
    score = 0;
}

function pause() {
    if (paused) {
        paused = false;
        for (var i = 0; i < snake.length; i++) {
            snake[i].setPosition(pause_x[i], pause_y[i], pause_z[i]);
        }
        pause_x = [];
        pause_y = [];
        pause_z = [];
    } else {
        paused = true;
        for (var i = 0; i < snake.length; i++) {
            pause_x.push(snake[i].mesh.position.x);
            pause_y.push(snake[i].mesh.position.y);
            pause_z.push(snake[i].mesh.position.z);
        }
    }
}

document.onload = init();

function spawnAppleVector() {
    var x = randInRange(0, edgeSize - 1),
        y = randInRange(0, edgeSize - 1),
        z = randInRange(0, edgeSize - 1);
    var returner = new THREE.Vector3(x + x * padding - halfCubeSize + 0.5, y + y * padding - halfCubeSize + 0.5, z + z * padding - halfCubeSize + 0.5);
    if (spawnHole1Vector() == returner || spawnHole2Vector() == returner) {
        return spawnAppleVector();
    } else {
        return returner;
    }
}

function spawnHole1Vector() {
    var x = 0.25 * edgeSize,
        y = 0.25 * edgeSize,
        z = 0.25 * edgeSize;
    return new THREE.Vector3(x + x * padding - halfCubeSize + 0.5, y + y * padding - halfCubeSize + 0.5, z + z * padding - halfCubeSize + 0.5);
}

function spawnHole2Vector() {
    var x = 0.75 * edgeSize,
        y = 0.75 * edgeSize,
        z = 0.75 * edgeSize;
    return new THREE.Vector3(x + x * padding - halfCubeSize + 0.5, y + y * padding - halfCubeSize + 0.5, z + z * padding - halfCubeSize + 0.5);
}

function Cube(vec, material, scene, geometry, renderWireframe) {
    this.geometry = typeof geometry === 'undefined' ? cube : geometry;
    this.mesh = new THREE.Mesh(this.geometry, material);

    if (typeof renderWireframe === 'undefined' || !renderWireframe) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
        scene.add(this.mesh);
    } else {
        var edges = new THREE.EdgesGeometry(this.mesh.geometry);
        scene.add(new THREE.LineSegments(edges, material));
    }

    this.setPosition = function(vec) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
    };
}

function Sphere(vec, material, scene, geometry, renderWireframe) {
    this.geometry = typeof geometry === 'undefined' ? sphere : geometry;
    this.mesh = new THREE.Mesh(this.geometry, material);

    if (typeof renderWireframe === 'undefined' || !renderWireframe) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
        scene.add(this.mesh);
    } else {
        var edges = new THREE.EdgesGeometry(this.mesh.geometry);
        scene.add(new THREE.LineSegments(edges, material));
    }

    this.setPosition = function(vec) {
        this.mesh.position.set(vec.x, vec.y, vec.z);
    };
}

function randInRange(a, b) {
    return a + Math.floor((b - a) * Math.random());
}

function render() {

    requestAnimationFrame(render);

    tetha += clock.getDelta();

    if (tetha > 20 / speed) {
        var tail = snake.shift();
        var head = snake[snake.length - 1];

        if (!paused) {
            head.mesh.material.map = body_texture;
            tail.mesh.material.map = head_texture;

            direction = keysQueue.length > 0 ? keysQueue.pop(0) : direction;
            var newPosition = new THREE.Vector3(head.mesh.position.x + direction.x + Math.sign(direction.x) * padding, head.mesh.position.y + direction.y + Math.sign(direction.y) * padding, head.mesh.position.z + direction.z + Math.sign(direction.z) * padding);
            tail.setPosition(newPosition);
        }

        snake.push(tail);
        head = tail;


        for (var i = snake.length - 2; i > -1; i--) {
            if (head.mesh.position.distanceTo(snake[i].mesh.position) < 1) {
                end = true;
                break;
            }
        }

        if (end) {
            restart();
        }
        if (head.mesh.position.distanceTo(apple.mesh.position) < 1) {
            console.log("c");
            apple.setPosition(spawnAppleVector());
            texter.innerHTML = "Score: " + (++score);
            new Audio("textures/level.wav").play();

            document.body.appendChild(canvas);

            while (pieces.length < numberOfPieces) {
                pieces.push(new Piece(Math.random() * canvas.width, Math.random() * canvas.height));
            }
            update();
            draw();

            setTimeout(function() { document.body.removeChild(canvas); }, 1000);

            snake.unshift(new Cube(new THREE.Vector3(snake[0].mesh.position.x, snake[0].mesh.position.y, snake[0].mesh.position.z), new THREE.MeshPhongMaterial({ map: body_texture }), scene));

        }

        if (head.mesh.position.x < -halfCubeSize) {
            head.mesh.position.x = halfCubeSize - 0.5;
        } else if (head.mesh.position.x > halfCubeSize) {
            head.mesh.position.x = -halfCubeSize + 0.5;
        } else if (head.mesh.position.y < -halfCubeSize) {
            head.mesh.position.y = halfCubeSize - 0.5;
        } else if (head.mesh.position.y > halfCubeSize) {
            head.mesh.position.y = -halfCubeSize + 0.5;
        } else if (head.mesh.position.z < -halfCubeSize) {
            head.mesh.position.z = halfCubeSize - 0.5;
        } else if (head.mesh.position.z > halfCubeSize) {
            head.mesh.position.z = -halfCubeSize + 0.5;
        }

        if (head.mesh.position.distanceTo(hole1.mesh.position) < 1) {
            head.setPosition(hole2.mesh.position);
        } else if (head.mesh.position.distanceTo(hole2.mesh.position) < 1) {
            head.setPosition(hole1.mesh.position);
        }

        tetha = 0;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

document.addEventListener("keydown", function(e) {

    if (!played) {
        played = true;
        back = new Audio("textures/back.mp3");
        back.play();
        back.loop = true;
    }

    switch (e.key) {
        case 'q':
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 1, 0));
            }
            break;
        case 'e':
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, -1, 0));
            }
            break;
        case 'Q':
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 1, 0));
            }
            break;
        case 'E':
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, -1, 0));
            }
            break;
        case "ArrowDown":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, 1));
            }
            break;
        case "ArrowUp":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, -1));
            }
            break;
        case "ArrowLeft":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(-1, 0, 0));
            }
            break;
        case "ArrowRight":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(1, 0, 0));
            }
            break;
        case "s":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, 1));
            }
            break;
        case "w":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, -1));
            }
            break;
        case "a":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(-1, 0, 0));
            }
            break;
        case "d":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(1, 0, 0));
            }
            break;
        case "r":
            restart();
            break;
        case "S":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, 1));
            }
            break;
        case "W":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(0, 0, -1));
            }
            break;
        case "A":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(-1, 0, 0));
            }
            break;
        case "D":
            if (!paused) {
                keysQueue.push(new THREE.Vector3(1, 0, 0));
            }
            break;
        case "R":
            restart();
            break;
        case "Escape":
            pause();
            break;
    }
});