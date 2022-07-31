import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js';  
import {
	initRenderer, 
	initCamera,
	InfoBox,
	onWindowResize,
    degreesToRadians,
    radiansToDegrees
} from "../libs/util/util.js";
import { SecondaryBox } from './helper.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';

import { Scenario, Grass, Rocks } from './scenario.js';
import { Airplane } from './plane.js';
import { lineEnemy, archEnemy, diagonalEnemy, GroundEnemy } from './enemies.js';
import { Life } from './life.js';
import { GroundAirEnemyMissile } from './bullets.js';
import { Explosion } from './explosion.js';

const CAMERA_HEIGHT = 110;
const LIGHT_HEIGHT = 130;
const LIGHT_Z_DISTANCE = 70;
const LIGHT_RANGE = 600;
const AIR_ENEMIES_HEIGHT = 20;
const SPEED = 1;
const ENEMIES_X_LIMITS = [-180, 180]

let bullets = [];
let enemyBullets = [];
let enemies = [];
let lives = [];
let timers = [];
let explosions = []

const infoBox = new SecondaryBox("God Mode OFF");

const clearGeometryArray = (array) => {
    array.forEach((element, idx) => {
        game.scene.remove(element.getGeometry());
    });
    array.length = 0;
};

var Timer = function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        timerId = null;
        remaining -= Date.now() - start;
    };

    this.resume = function() {
        if (timerId) {
            return;
        }

        start = Date.now();
        timerId = window.setTimeout(callback, remaining);
    };

    this.cancel = function() {
        window.clearTimeout(timerId);
        timerId = null;
    };

    this.resume();
};

async function spawnEnemy(type){
    if(type == 'line'){
        if(Math.random() >= 0.5){
            let lineEnemyModel = await game.loadModel('./assets/fighter6.glb');
            var new_enemy = new lineEnemy(1, lineEnemyModel, 'vertical');
            new_enemy.setPosition(Math.ceil(
                Math.random() * 70) * (Math.round(Math.random()) ? 1 : -1),
                AIR_ENEMIES_HEIGHT,
                game.cameraHolder.position.z - 300
            );
        }
        else{
            let lineEnemyModel = await game.loadModel('./assets/airplane.glb');
            var new_enemy = new lineEnemy(1, lineEnemyModel, 'horizontal');
            new_enemy.setPosition(
                -149,
                AIR_ENEMIES_HEIGHT,
                (game.cameraHolder.position.z - 250) + (-1 *  Math.random() * (game.cameraHolder.position.z - 70 ))
            );
        }
        enemies.push(new_enemy);
        game.scene.add(new_enemy.getGeometry());
    }
    if(type == 'arch'){
        let archEnemyModel = await game.loadModel('./assets/fighter1.glb');
        if(Math.random() >= 0.5){
            let new_enemy = new archEnemy('left', archEnemyModel);
            new_enemy.setPosition(-170, AIR_ENEMIES_HEIGHT, game.cameraHolder.position.z - 260);
            enemies.push(new_enemy);
            game.scene.add(new_enemy.getGeometry());
        }
        else{
            let new_enemy = new archEnemy('right', archEnemyModel);
            new_enemy.setPosition(170, AIR_ENEMIES_HEIGHT, game.cameraHolder.position.z - 260);
            enemies.push(new_enemy);
            game.scene.add(new_enemy.getGeometry());
        }
    }
    if(type == 'diag'){
        let diagonalEnemyModel = await game.loadModel('./assets/fighter5.glb');
        if(Math.random() >= 0.5){
            var new_enemy = new diagonalEnemy('left', 1, diagonalEnemyModel);
            new_enemy.setPosition(-170, AIR_ENEMIES_HEIGHT, game.cameraHolder.position.z - 250);
            enemies.push(new_enemy);
            game.scene.add(new_enemy.getGeometry());
        }
        else{
            var new_enemy = new diagonalEnemy('right', 1, diagonalEnemyModel);
            new_enemy.setPosition(170, AIR_ENEMIES_HEIGHT, game.cameraHolder.position.z - 250);
            enemies.push(new_enemy);
            game.scene.add(new_enemy.getGeometry());
        }
    }
    if (type == 'ground') {
        let groundEnemyModel = await game.loadModel('./assets/T90.glb');
        let new_enemy = new GroundEnemy(0, groundEnemyModel);
        new_enemy.setPosition(
            Math.ceil(Math.random() * 80) * (Math.round(Math.random()) ? 1 : -1),
            9,
            game.cameraHolder.position.z - 400
        );
        enemies.push(new_enemy);
        game.scene.add(new_enemy.getGeometry());
    }
}

function spawnLife(){
    let new_life = new Life();
    new_life.setPosition(
        Math.ceil(Math.random() * 70) * (Math.round(Math.random()) ? 1 : -1),
        AIR_ENEMIES_HEIGHT,
        game.cameraHolder.position.z - 300
    );
    lives.push(new_life);
    game.scene.add(new_life.life);
}

function switchEnemySpawnPermission(){
    game.enemySpawnPermission = !game.enemySpawnPermission;
}

function switchLifeSpawnPermission(){
    game.lifeSpawnPermission = !game.lifeSpawnPermission;
}

class Game {
    constructor() {
        this.started = false;
        this.ended = false;
        this.running = false;
        this.firstStart = true;
        this.paused = false;
        this.isGodMode = false;
        this.scene = new THREE.Scene();
        this.renderer = initRenderer({
            alpha:true,
            transparent: true
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Init camera in this position

        this.lightPosition = new THREE.Vector3(0, 0, 0);
        this.light = new THREE.DirectionalLight(0xffffff, 0.9);

        this.light.position.copy(this.lightPosition);
        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 512
        this.light.shadow.mapSize.height = 512
        this.light.shadow.camera.near = 0.5
        this.light.shadow.camera.far = 500

        this.light.shadow.camera.left = -150;
        this.light.shadow.camera.right = 150;
        this.light.shadow.camera.top = 100;
        this.light.shadow.camera.bottom = -50;

        this.scene.add(this.light);
        this.scene.add(this.light.target);

        //this.helper = new THREE.DirectionalLightHelper(this.light, 5);
        //this.scene.add(this.helper);

        this.loader = new GLTFLoader();

        this.listener = new THREE.AudioListener();
        this.camera.add( this.listener );

        // Creating a holder for the camera
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.add(this.camera);
        this.scene.add(this.cameraHolder);

        this.lightTarget = new THREE.Object3D();
        this.light.target = this.lightTarget;
        this.scene.add(this.lightTarget);

        this.gameLevel = 0;
        this.ENEMY_SPAWN_PROBABILITY = 0.05;
        this.LIFE_SPAWN_PROBABILITY = 0.0025;
        this.levelDuration = [ 20000, 20000, 20000, 30000, 20000, 20000, 20000 ]
        this.enemySpawnPermission = true;
        this.lifeSpawnPermission = true;
        this.enemySpawnWait = 800;
        this.lifeSpawnWait = 8000;    
    }

    init(airplane, scenario, leftGrass, rightGrass, leftRock, rightRock) {
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set( 0, 1, 0 );
        this.cameraHolder.position.set(0, CAMERA_HEIGHT, 100);
        this.cameraHolder.rotateX(degreesToRadians(-40));

        this.light.position.set(0, 50, 30);
        this.lightTarget.position.set(0, 10, -20);
       
        this.scene.add(scenario.ground_plane);
        this.scene.add(scenario.second_ground_plane);
        this.scene.add(scenario.water);

        this.scene.add(leftGrass.ground_plane);
        this.scene.add(leftGrass.second_ground_plane);
        this.scene.add(rightGrass.ground_plane);
        this.scene.add(rightGrass.second_ground_plane);
        this.scene.add(leftRock.ground_plane);
        this.scene.add(leftRock.second_ground_plane);
        this.scene.add(rightRock.ground_plane);
        this.scene.add(rightRock.second_ground_plane);
        
        this.scene.add(airplane.getGeometry());
        airplane.setInitialOrResetPosition();
    }

    reset(airplane) {
        this.cameraHolder.position.set(0, CAMERA_HEIGHT, 100);
        this.light.position.set(0, 50, 30);
        this.lightTarget.position.set(0, 10, -20);
        
        this.scene.add(airplane.getGeometry());
        airplane.setInitialOrResetPosition(false);
        this.started = false;
    }

    moveLight(speed=1) {
        this.light.matrixAutoUpdate = false;    
        var mat4 = new THREE.Matrix4();

        this.lightPosition.z -= SPEED;

        this.light.matrix.identity();
        this.light.matrix.multiply(
            mat4.makeTranslation(
                this.lightPosition.x,
                this.lightPosition.y,
                this.lightPosition.z
        ));
    }

    start() {
        this.running = true;
    }

    addOnScene(object) {
        this.scene.add(object);
    }

    async loadModel(path='./assets/plane.obj', objectName="obj1") {
        let model = await this.loader.loadAsync(
            path, 
            null
        );

        model.scene.traverse( 
            function ( child ) {
                if ( child ) {
                    child.castShadow = true;
                }
            }
        );

        model.scene.traverse(
            function( node ) {
                if( node.material ) node.material.side = THREE.DoubleSide;
            }
        );

        return model.scene;
    }

    godMode() {
        this.isGodMode = !this.isGodMode;
    }

    //Adiciona novos inimigos em tempo de jogo com posicao e velocidade aleatórias
    update() {
        if(this.gameLevel == 0 && this.enemySpawnPermission){
            spawnEnemy('line');
            this.enemySpawnPermission = false;
            var permissionTimer1 = new Timer(switchEnemySpawnPermission, this.enemySpawnWait);
            timers[0] = permissionTimer1;
        }
        
        if(this.gameLevel == 1 && this.enemySpawnPermission){
            this.enemySpawnWait = 1500;
            spawnEnemy('line');
            this.enemySpawnPermission = false;
            var permissionTimer2 = new Timer(switchEnemySpawnPermission, this.enemySpawnWait);
            timers[0] = permissionTimer2;
        }
        if(this.gameLevel == 2 && this.enemySpawnPermission){
            this.enemySpawnWait = 1500;
            spawnEnemy('ground');
            spawnEnemy('arch');
            this.enemySpawnPermission = false;
            var permissionTimer3 = new Timer(switchEnemySpawnPermission, this.enemySpawnWait);
            timers[0] = permissionTimer3;
        }
        if(this.gameLevel == 3 && this.enemySpawnPermission){
            this.enemySpawnWait = 1500;
            spawnEnemy('arch');
            spawnEnemy('diag');
            this.enemySpawnPermission = false;
            var permissionTimer3 = new Timer(switchEnemySpawnPermission, this.enemySpawnWait);
            timers[0] = permissionTimer3;
        }
        if(this.gameLevel == 4 && this.enemySpawnPermission){
            this.enemySpawnWait = 1750;
            spawnEnemy('diag');
            spawnEnemy('arch');
            spawnEnemy('ground');
            this.enemySpawnPermission = false;
            var permissionTimer3 = new Timer(switchEnemySpawnPermission, this.enemySpawnWait);
            timers[0] = permissionTimer3;
        }
        if(this.gameLevel >= 1 && this.lifeSpawnPermission){
            spawnLife();
            this.lifeSpawnPermission = false;
            var permissionTimer4 = new Timer(switchLifeSpawnPermission, this.lifeSpawnWait);
            timers[1] = permissionTimer4;
        }
    }
}

let game = new Game();

const background_song = new THREE.Audio( game.listener );
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./assets/background-song.mp3", function( buffer ) {
                background_song.setBuffer( buffer );
                background_song.setLoop( false );
                background_song.setVolume( 0.1 );
});

// Listen window size changes
window.addEventListener(
    'resize',
    function(){ onWindowResize(game.camera, game.renderer) },
    false 
);

// To use the keyboard
let keyboard = new KeyboardState();

// Create the ground plane
let main_scenario = new Scenario(600, 600);
let leftGrass = new Grass(200, 600, -1);
let rightGrass = new Grass(200, 600, 1);
let leftRock = new Rocks(50, 600, -1);
let rightRock = new Rocks(50, 600, 1);

// Create plane
let airplaneModel = await game.loadModel('./assets/plane.glb');
let airplane = new Airplane(airplaneModel);

// Initializing the game
game.init(airplane, main_scenario, leftGrass, rightGrass, leftRock, rightRock);

let controls = new InfoBox();
controls.add("Plane Shooter");
controls.addParagraph();
controls.add("Use keyboard to interact:");
controls.add("* Press P to start/pause");
controls.add("* Press CTRL/SPACE to shoot");
controls.add("* G to turn on/off God Mode");
controls.add("* R to reset the game");
controls.add("* Use arrows to move the airplane");
controls.show();
controls.infoBox.style.display = "none";

render();

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const h1 = document.getElementById('h1');
const p1 = document.getElementById('p1');
const p2 = document.getElementById('p2');
const p3 = document.getElementById('p3');
const p4 = document.getElementById('p4');
const p5 = document.getElementById('p5');
const button  = document.getElementById("btn");
const button2  = document.getElementById("btn2");

const painel = document.getElementById("painel");
const vidas = document.getElementById("vidas");
painel.style.display = 'none';
vidas.style.display = 'none';
const vida1 = document.getElementById("vida1");
const vida2 = document.getElementById("vida2");
const vida3 = document.getElementById("vida3");
const vida4 = document.getElementById("vida4");
const vida5 = document.getElementById("vida5");

const updateLives = () => {
    if (airplane.life == 5) {
        vida1.style.display = '';
        vida2.style.display = '';
        vida3.style.display = '';
        vida4.style.display = '';
        vida5.style.display = '';
    }
    else{
        if (airplane.life == 4) {
            vida1.style.display = '';
            vida2.style.display = '';
            vida3.style.display = '';
            vida4.style.display = '';
            vida5.style.display = 'none';
        }
        else {
            if (airplane.life == 3) {
                vida1.style.display = '';
                vida2.style.display = '';
                vida3.style.display = '';
                vida4.style.display = 'none';
                vida5.style.display = 'none';
            }
            else {
                if (airplane.life == 2) {
                    vida1.style.display = '';
                    vida2.style.display = '';
                    vida3.style.display = 'none';
                    vida4.style.display = 'none';
                    vida5.style.display = 'none';
                }
                else {
                    vida1.style.display = '';
                    vida2.style.display = 'none';
                    vida3.style.display = 'none';
                    vida4.style.display = 'none';
                    vida5.style.display = 'none';
                }
            }
        }
    }
};

const defaultInterface = () => {
    blocker.style.display = 'block';
    instructions.style.display = '';
    h1.innerHTML = "Instructions";
    p1.innerHTML = "Move: ARROWS";
    p2.innerHTML = "Shoot: CTRL/SPACE";
    p3.innerHTML = "God Mode: G";
    p4.innerHTML = "Pause/Start: P";
    p5.innerHTML = "Reset Game: R";
    button.style.display = "";
    button2.style.display = 'none';
    controls.infoBox.style.display = "none";
    painel.style.display = 'none';
    vidas.style.display = 'none';
    updateLives();
}

const victory = () => {
    blocker.style.display = 'block';
    instructions.style.display = '';
    h1.innerHTML = "CONGRATULATIONS!!!";
    p1.innerHTML = "You did it!";
    p2.innerHTML = "Survived and reached";
    p3.innerHTML = "the final of the game!";
    p4.innerHTML = "";
    p5.innerHTML = "";
    button.style.display = "none";
    button2.style.display = '';
    painel.style.display = 'none';
    vidas.style.display = 'none';
    game.ended = true;
}

const defeat = () => {
    background_song.stop();
    blocker.style.display = 'block';
    instructions.style.display = '';
    h1.innerHTML = "DEFEAT!";
    p1.innerHTML = "You were destroyed!";
    p2.innerHTML = ":(";
    p3.innerHTML = "But you can try again!";
    p4.innerHTML = "";
    p5.innerHTML = "";
    button.style.display = "none";
    button2.style.display = "";
    painel.style.display = 'none';
    vidas.style.display = 'none';
    make_sound("./assets/gameOver.wav", 0.3);
    game.ended = true;
}

function fullReset() {
    main_scenario.reset();
    leftGrass.reset();
    rightGrass.reset();
    leftRock.reset();
    rightRock.reset();
    game.reset(airplane);
    game.gameLevel = 0;
    game.firstStart = false;
    clearGeometryArray(bullets);
    clearGeometryArray(enemies);
    clearGeometryArray(enemyBullets);
    clearGeometryArray(lives);
    clearGeometryArray(explosions);
    airplane.getGeometry().scale.set(1, 1, 1);
    airplane.life = 5;
    game.started = false;
    game.running = false;
    game.isGodMode = false;
    game.enemySpawnPermission = true;

    for(var i = 0; i < timers.length; i++){
        if(timers[i] != null){
            timers[i].cancel();
        }
    }
    timers = [];
}

const finishGame = () => {
    fullReset();
    victory();
};

const onStartButtonPressed = () => {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    if(!game.started){
        var levelOneTimer = new Timer(advance_level, sumFirstElements(game.levelDuration, 1));
        timers[2] = levelOneTimer;
        var levelTwoTimer = new Timer(advance_level, sumFirstElements(game.levelDuration, 2));
        timers[3] = levelTwoTimer;
        var levelThreeTimer = new Timer(advance_level, sumFirstElements(game.levelDuration, 3));
        timers[4] = levelThreeTimer;
        var levelFourTimer = new Timer(advance_level, sumFirstElements(game.levelDuration, 4));
        timers[5] = levelFourTimer;
        var levelFiveTimer = new Timer(() => {}, sumFirstElements(game.levelDuration, 5));
        timers[6] = levelFiveTimer;
        var levelSixTimer = new Timer(finishGame, sumFirstElements(game.levelDuration, 6));
        timers[7] = levelSixTimer;
        game.started = true;
    }

    if(game.firstStart){
        setTimeout(() => {
            background_song.play();
        }, 10000);
    }
    else{
        background_song.play();
    }
    game.running = !game.running;
    controls.infoBox.style.display = "";
    painel.style.display = '';
    vidas.style.display = '';
    make_sound("./assets/GameStart.wav", 0.3);
};

button.addEventListener("click", onStartButtonPressed);
button2.addEventListener("click", defaultInterface); 

function advance_level() {
    game.gameLevel++;
}

function make_explosion(object) {
    let temp_explosion = new Explosion(
        object.getGeometry().position.x,
        object.getGeometry().position.y,
        object.getGeometry().position.z + 5
    );
    explosions.push(temp_explosion);
    game.addOnScene(temp_explosion.getGeometry());
    temp_explosion.getGeometry().lookAt(game.cameraHolder.position);
    make_sound("./assets/explosion01.ogg", 0.3);
}

function update_explosions() {
    explosions.forEach((explosion, index) => {
        explosion.update();
        if (explosion.ended) {
            game.scene.remove(explosion.getGeometry());
            explosions.splice(index, 1);
        }
    })
}

function sumFirstElements(array, n){
    var sum = 0;
    for(var i = 0; i < n; i++){
        sum += array[i];
    }
    return sum;
}

async function keyboardUpdate() {
    keyboard.update();

    if ( keyboard.down("P") ) { //PAUSA O GAME
        if(game.started){
            if(!game.paused){
                for(var i = 0; i < timers.length; i++){
                    if(timers[i] != null){
                        timers[i].pause();
                    }
                }
                background_song.pause();
                game.paused = true;
            }
            else{
                for(var i = 0; i < timers.length; i++){
                    if(timers[i] != null){
                        timers[i].resume();
                    }
                }
                background_song.play();
                game.paused = false;
            }
            game.running = !game.running;
        }
    }
    if ( keyboard.pressed("R") ) { //RESETA O GAME
        fullReset();
        blocker.style.display = 'block';
        instructions.style.display = '';
        controls.infoBox.style.display = "none";
        painel.style.display = 'none';
        vidas.style.display = 'none';
        updateLives();
        background_song.stop();
    }
    // Airplane controls
    if ( keyboard.pressed("left") && game.running) { //MOVE AVIAO PARA ESQUERDA
        if ((airplane.getGeometry().position.x - game.cameraHolder.position.x) > -70 ) {
            airplane.getGeometry().translateX(-1);
            
            if (!airplane.isRotated) {
                gsap.to(airplane.model.rotation, { z: degreesToRadians(135), duration: 0.3 });
                airplane.isRotated = true;
            }
        }
    }
    if (keyboard.up("left")) { //ALINHA INCLINACAO DO AVIAO (ESQUERDA)
        gsap.to(airplane.model.rotation, { z: degreesToRadians(180), duration: 0.3 });
        await sleep(250);
        airplane.isRotated = false;
    }
    if ( keyboard.pressed("right") && game.running) { //MOVE AVIAO PARA DIREITA
        if ((airplane.getGeometry().position.x - game.cameraHolder.position.x) < 70 ) {
            airplane.getGeometry().translateX(1);

            if (!airplane.isRotated) {
                gsap.to(airplane.model.rotation, { z: degreesToRadians(225), duration: 0.3 });
                airplane.isRotated = true;
            }
        }
    }
    if (keyboard.up("right")) { //ALINHA INCLINACAO DO AVIAO (DIREITA)
        gsap.to(airplane.model.rotation, { z: degreesToRadians(180), duration: 0.3 });
        await sleep(250);
        airplane.isRotated = false;
    }
    if ( keyboard.pressed("up") && game.running ) { //MOVE AVIAO PARA CIMA
        if ((airplane.getGeometry().position.z - game.cameraHolder.position.z) > -200 )
            airplane.getGeometry().translateY(1);
    }
    if ( keyboard.pressed("down") && game.running ) { //MOVE AVIAO PARA BAIXO
        if ((airplane.getGeometry().position.z - game.cameraHolder.position.z) < -50 )
            airplane.getGeometry().translateY(-1);
    }
    if (keyboard.down("G")) { //GOD MODE
        game.godMode();
    }
    if (keyboard.pressed("space") && game.running) { //TIRO BOMBA
        let bomb = airplane.bomb(SPEED, airplane, game);
        if (bomb != null) {
            bullets.push(bomb);
        }
        make_sound("./assets/shot2.mp3", 0.1);
    }
    if (keyboard.pressed("ctrl") && game.running ) { //TIRO MISSEIS
        airplane.burst = true;
        let bullet = airplane.shoot(SPEED, airplane, game);
        if(bullet != null) {
            bullets.push(bullet);
        }
        make_sound("./assets/shot3.mp3", 0.05);
    }
    if (keyboard.down("ctrl") && game.running ) { //TIRO MISSEIS
        airplane.burst = false;
        let bullet = airplane.shoot(SPEED, airplane, game);
        if(bullet != null) {
            bullets.push(bullet);
        }
    }
}

//Checa se os objetos saíram da tela ou colidiram
async function checkBoundariesAndCollisions() {

    //for INIMIGOS
    for (var i = 0; i < enemies.length; i++) {

        enemies[i].update();

        let enemy_bullet = await enemies[i].shoot(1.4, airplane);
        if (enemy_bullet) {
            game.addOnScene(enemy_bullet.sphere);
            enemyBullets.push(enemy_bullet);
        }
        
        //Removendo inimigos que saíram da tela
        if(enemies[i].getGeometry().position.z > game.cameraHolder.position.z - 40 || enemies[i].getGeometry().position.x > ENEMIES_X_LIMITS[1] || 
            enemies[i].getGeometry().position.x < ENEMIES_X_LIMITS[0]) {
            game.scene.remove(enemies[i].getGeometry());
            enemies.splice(i, 1);
            i--;
            if(i >= enemies.length || i < 0) {
                break;
            }
        }
        
        //Removendo inimigos e mísseis que colidiram
        var shot = enemies[i].checkMissileCollision(bullets);
        if(shot > -1) {
            make_explosion(enemies[i]);
            game.scene.remove(bullets[shot].sphere);
            bullets.splice(shot, 1);
            
            let temp_cube = enemies[i].getGeometry();
            enemies.splice(i, 1);

            //Animação de colisão
            gsap.to(temp_cube.rotation, {y: 3.15, duration: 0.25});
            gsap.to(temp_cube.position, {z: temp_cube.position.z - 20, duration: 0.25});
            await sleep(500);
            game.scene.remove(temp_cube);
            i--;
        }
        
        //Verificar se ainda há inimigos em jogo antes de verificar colisão com avião
        if(i >= enemies.length || i < 0) {
            break;
        }

        //Removendo inimigos e avião que colidiram
        if (!game.isGodMode) {
            var crash = enemies[i].checkPlaneCollision(airplane)
            if(crash) {
                make_explosion(enemies[i]);
                let endTime = new Date();
                if(endTime - airplane.damageTime >= 100) {
                    let temp_cube = enemies[i].getGeometry();
                    enemies.splice(i, 1);
                    airplane.damageTime = new Date();
                    // Aviao toma dano
                    if (airplane.life > 2) {
                        //Animacao de dano
                        gsap.to(airplane.getGeometry().scale, {x:0.3, y: 0.3, z: 0.3, duration: 0.05});
                        gsap.to(temp_cube.scale, {x:0, y: 0, z: 0, duration: 0.05});
                        await sleep(100);
                        game.scene.remove(temp_cube);
                        i--;
                        gsap.to(airplane.getGeometry().scale, {x:1, y: 1, z: 1, duration: 0.1});
                        airplane.decreaseLife(2);
                        updateLives();
                    }
                    else { // Aviao morre
                        //Animação de colisão
                        gsap.to(airplane.getGeometry().scale, {x:0, y: 0, z: 0, duration: 0.25});
                        gsap.to(temp_cube.scale, {x:0, y: 0, z: 0, duration: 0.25});
                        await sleep(550);
                        game.scene.remove(temp_cube);
                        i--;
                        fullReset();
                        await sleep(400);
                        defeat();
                    }
                }
            }
        }
    }

    //for VIDAS
    for(var i = 0; i < lives.length; i++) {
        lives[i].update();
        
        //Removendo vidas que sairam da tela
        if(lives[i].life.position.z > game.cameraHolder.position.z || lives[i].life.position.x > 70 || 
            lives[i].life.position.x < -70) {
            game.scene.remove(lives[i].life);
            lives.splice(i, 1);
            i--;
            if(i >= lives.length || i < 0) {
                break;
            }
        }
        
        //Verificar se ainda existem vidas em jogo antes de verificar colisao com aviao
        if(i >= lives.length || i < 0) {
            break;
        }

        //Removendo vidas e aviao que colidiram
        var crash = lives[i].checkPlaneCollision(airplane)
        if(crash) {
            let temp_life = lives[i].life;
            lives.splice(i, 1);
            //Animacao de colisao
            gsap.to(temp_life.scale, {x:0, y: 0, z: 0, duration: 0.25});
            airplane.increaseLife();
            make_sound("./assets/lifeCatch.ogg", 0.3);
            updateLives();
            await sleep(250);
            game.scene.remove(temp_life);
            i--;
            console.log("VIDAS ATUAIS: ", airplane.life);
        }
    }

    //for MISSEIS INIMIGOS
    if (!game.isGodMode) {
        for (let j = 0; j < enemyBullets.length; j++) {
            //Removendo misseis e avião que colidiram
            let shot = airplane.checkMissileCollision(enemyBullets);
            
            if(shot > -1) {
                make_explosion(airplane);
                const isGroundMissile = (enemyBullets[shot] instanceof GroundAirEnemyMissile);
                let endTime = new Date();

                if(endTime - airplane.damageTime >= 100) {
                    game.scene.remove(enemyBullets[j].getGeometry());
                    enemyBullets.splice(j, 1);
                    airplane.damageTime = new Date();
                    // Aviao toma dano
                    if (airplane.life > 1) {
                        //Animacao de dano
                        gsap.to(airplane.getGeometry().scale, { x:0.3, y: 0.3, z: 0.3, duration: 0.1 });
                        await sleep(100)
                        gsap.to(airplane.getGeometry().scale, { x:1, y: 1, z: 1, duration: 0.1 });

                        if (isGroundMissile)
                            airplane.decreaseLife(2);
                        else
                            airplane.decreaseLife(1);

                        updateLives();
                    }
                    else { // Aviao morre
                        //Animação de colisão
                        gsap.to(airplane.getGeometry().scale, { x:0, y: 0, z: 0, duration: 0.25 });
                        await sleep(300);
                        fullReset();
                        await sleep(400);
                        defeat();
                    }
                    j--;
                }
            }
        }
    }

    //Removendo misseis inimigos que sairam da tela
    for(var i = 0; i < enemyBullets.length; i++) {
        if(enemyBullets[i].sphere.position.z > game.cameraHolder.position.z) {
            game.scene.remove(enemyBullets[i].getGeometry());
            enemyBullets.splice(i, 1);
        }
    }

    //Removendo mísseis que saíram da tela
    for(var i = 0; i < bullets.length; i++) {
        if(bullets[i].getGeometry().position.z < (game.cameraHolder.position.z - 250) || bullets[i].getGeometry().position.y < -1) {
            game.scene.remove(bullets[i].getGeometry());
            bullets.splice(i, 1);
        }
    }

}


function make_sound (soundFile, volume) {
    const sound = new THREE.Audio( game.listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(soundFile, function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume( volume );
        sound.play();
    });
}

function render()
{
    keyboardUpdate();
    if (game.running) {
        //Movimento dos mísseis
        bullets.forEach(bullet => {
            bullet.update();
        });

        enemyBullets.forEach(enemyBullet => {
            enemyBullet.update(airplane);
        });

        update_explosions();
        
        //Movimento do avião
        airplane.update(SPEED);

        main_scenario.update(game.cameraHolder);
        leftGrass.update(game.cameraHolder);
        rightGrass.update(game.cameraHolder);
        leftRock.update(game.cameraHolder);
        rightRock.update(game.cameraHolder);
        game.update();

        game.cameraHolder.position.z -= SPEED;
        game.light.position.z -= SPEED;
        game.lightTarget.position.z -= SPEED;

        //Movimento dos inimigos
        checkBoundariesAndCollisions();
    }
    if ( game.ended && keyboard.pressed("enter") ) {
        onStartButtonPressed();
        updateLives();
        game.ended = false;
    }
    if (game.isGodMode) {
        infoBox.changeMessage("God Mode ON");  
    }
    else {
        infoBox.changeMessage("God Mode OFF");
    }
    requestAnimationFrame(render);
    game.renderer.render(game.scene, game.camera) // Render scene
}
