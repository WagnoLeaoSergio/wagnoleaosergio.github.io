import * as THREE from  'three';
import { EnemyBullet, GroundAirEnemyMissile } from './bullets.js'
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
// import { degreesToRadians } from '../../libs/util/util';

function degreesToRadians(degrees)
{
    var pi = Math.PI;
    return degrees * (pi/180);
}

const loader = new GLTFLoader();

const loadModel = async (path='./assets/plane.obj', objectName="obj1") => {
    let model = await loader.loadAsync(
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

{/**
    Classe referente ao objeto que controla as
    funcionalidades de um inimigo'.
*/}
export class lineEnemy {
    constructor(speed, model, direction) {
        this.geometry = new THREE.BoxGeometry(6, 6, 6);
        this.material = new THREE.MeshLambertMaterial({
            color: 0x62bf06,
            transparent: model ? true : false,
            opacity: 0
        });
        this.object = new THREE.Mesh( this.geometry, this.material );
        this.direction = direction;

        if (!model) {
            this.model = null;
            this.object.castShadow = true;
            this.object.receiveShadow = true;
        }
        else {
            this.object.castShadow = false;
            this.object.receiveShadow = false;
            this.model = model;
            if (this.direction == 'vertical') {
                this.model.scale.set(0.5, 0.5, 0.5);
                this.model.rotateY(degreesToRadians(-90));
            }
            else {
                this.model.scale.set(1.5, 1.5, 1.5);
                this.model.rotateY(degreesToRadians(90));
            }
            
            this.object.add(this.model);
        }

        this.speed = speed;
        this.boundingBox = new THREE.Box3().setFromObject(this.object);
        this.shootPermission = false;
        this.startTime = new Date();
        return;
    }

    //Define posicao do cubo
    setPosition(x, y, z) {
        this.object.position.set(x, y, z)
        return;
    }

    //Movimenta com base em sua velocidade
    update() {
        let endTime = new Date();
        if(endTime - this.startTime > 1000) {
            this.shootPermission = true;
            this.startTime = new Date();
        }
        if(this.direction == 'vertical'){
            this.object.translateZ(this.speed);
        }
        if(this.direction == 'horizontal'){
            this.object.translateX(this.speed);
            this.object.translateZ(-0.5);
        }
        this.boundingBox.copy(this.object.geometry.boundingBox).applyMatrix4(this.object.matrixWorld);
    }

    shoot(speed, airplane) {
        if(this.shootPermission && this.object.position.z <= airplane.getPosition().z){
            let bullet = new EnemyBullet(speed);
            bullet.create(this);
            bullet.sphere.lookAt(airplane.getGeometry().position);
            this.shootPermission = false;
            return bullet;
        }
        else {
            return null;
        }
    }

    //Checa colisão do objeto com todos os mísseis na tela
    checkMissileCollision(missiles) {
        for(var i = 0; i < missiles.length; i++) {
            if(this.boundingBox.intersectsBox(missiles[i].boundingBox)) {
                return i;
            }
        }
        return -1;
    }

    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        else {
            return false;
        }
    }

    getGeometry() {
        return this.object;
    }
}

export class archEnemy {
    constructor(direction='left', model) {
        this.direction = direction;
        this.geometry = new THREE.BoxGeometry(6, 6, 6);
        this.material = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            transparent: model ? true : false,
            opacity: 0
        });
        this.object = new THREE.Mesh( this.geometry, this.material );

        if (!model) {
            this.model = null;
            this.object.castShadow = true;
            this.object.receiveShadow = true;
        }
        else {
            this.model = model;
            this.model.scale.set(1.5, 1.5, 1.5);
            this.object.add(this.model);
        }

        this.object.rotateY(degreesToRadians(45 * (this.direction == 'left' ? 1 : -1)));

        this.boundingBox = new THREE.Box3().setFromObject(this.object);
        this.shootPermission = false;
        this.startTime = new Date();
        this.t = 0;
        // this.object.geometry.computeBoundingBox();
        return;
    }

    //Define posicao do cubo
    setPosition(x, y, z) {
        this.object.position.set(x, y, z)
        return;
    }

    // WORK IN PROGRESS
    //Movimenta com base em sua velocidade
    update() {
        let endTime = new Date();
        if(endTime - this.startTime > 1000) {
            this.shootPermission = true;
            this.startTime = new Date();
        }
        
        this.object.rotateY(degreesToRadians(0.55 * (this.direction == 'left' ? 1 : -1)));
        this.object.translateZ((this.object.rotation.y * (this.direction == 'left' ? -1 : 1) + 3.5)*0.85);

        this.boundingBox.copy(this.object.geometry.boundingBox).applyMatrix4(this.object.matrixWorld);
    }

    shoot(speed, airplane) {
        if(this.shootPermission && this.object.position.z <= airplane.getPosition().z){
            let bullet = new EnemyBullet(speed);
            bullet.create(this);
            bullet.sphere.lookAt(airplane.getGeometry().position);
            this.shootPermission = false;
            return bullet;
        }
        else {
            return null;
        }
    }

    //Checa colisão do objeto com todos os mísseis na tela
    checkMissileCollision(missiles) {
        for(var i = 0; i < missiles.length; i++) {
            if(this.boundingBox.intersectsBox(missiles[i].boundingBox)) {
                return i;
            }
        }
        return -1;
    }

    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        else {
            return false;
        }
    }

    getGeometry() {
        return this.object;
    }
}

export class diagonalEnemy {
    constructor(direction, speed, model) {
        this.direction = direction;
        this.geometry = new THREE.BoxGeometry(6, 6, 6);
        this.material = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            transparent: model ? true : false,
            opacity: 0
        });
        this.object = new THREE.Mesh( this.geometry, this.material );

        if (!model) {
            this.model = null;
            this.object.castShadow = true;
            this.object.receiveShadow = true;
        }
        else {
            this.model = model;
            this.model.scale.set(1, 0.85, 1);
            this.model.rotateX(degreesToRadians(90));
            this.object.add(this.model);
            this.model.rotateZ(degreesToRadians(45 * (this.direction == 'left' ? -1 : 1) ));
        }


        this.speed = speed;
        this.boundingBox = new THREE.Box3().setFromObject(this.object);
        this.shootPermission = false;
        this.startTime = new Date();
        // this.object.geometry.computeBoundingBox();
        return;
    }

    //Define posicao do cubo
    setPosition(x, y, z) {
        this.object.position.set(x, y, z)
        return;
    }

    //Movimenta com base em sua velocidade
    update() {
        let endTime = new Date();
        if(endTime - this.startTime > 950) {
            this.shootPermission = true;
            this.startTime = new Date();
        }
        this.object.translateZ(this.speed);
        this.object.translateX(this.speed*2 * (this.direction == 'left' ? 1 : -1));
        this.boundingBox.copy(this.object.geometry.boundingBox).applyMatrix4(this.object.matrixWorld);
    }

    shoot(speed, airplane) {
        if(this.shootPermission && this.object.position.z <= airplane.getPosition().z){
            let bullet = new EnemyBullet(speed);
            bullet.create(this);
            bullet.sphere.lookAt(airplane.getGeometry().position);
            this.shootPermission = false;
            return bullet;
        }
        else {
            return null;
        }
    }

    //Checa colisão do objeto com todos os mísseis na tela
    checkMissileCollision(missiles) {
        for(var i = 0; i < missiles.length; i++) {
            if(this.boundingBox.intersectsBox(missiles[i].boundingBox)) {
                return i;
            }
        }
        return -1;
    }

    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        else {
            return false;
        }
    }

    getGeometry() {
        return this.object;
    }
}


export class GroundEnemy {
    constructor(speed, model) {
        this.geometry = new THREE.BoxGeometry( 10, 5, 10 );
        this.material = new THREE.MeshLambertMaterial({
            color: 0x8c6d1f,
            transparent: model ? true : false,
            opacity: 0
        });
        this.object = new THREE.Mesh( this.geometry, this.material );

        if (!model) {
            this.model = null;
            this.object.castShadow = true;
            this.object.receiveShadow = true;
        }
        else {
            this.model = model;
            this.model.scale.set(2.5, 2.5, 2.5);
            this.object.add(this.model);
        }

        this.speed = speed;
        this.boundingBox = new THREE.Box3().setFromObject(this.object);
        this.shootPermission = true;
        this.startTime = new Date();
        return;
    }

    //Define posicao do cubo
    setPosition(x, y, z) {
        this.object.position.set(x, y, z)
        return;
    }

    //Movimenta com base em sua velocidade
    update() {
        let endTime = new Date();
        if(endTime - this.startTime > 10000) {
            this.shootPermission = true;
            this.startTime = new Date();
        }
        this.object.translateZ(this.speed);
        this.boundingBox.copy(this.object.geometry.boundingBox).applyMatrix4(this.object.matrixWorld);
    }

    async shoot(speed, airplane) {
        if(this.shootPermission && this.object.position.z <= airplane.getPosition().z){
            let missileModel = await loadModel("./assets/missile.glb");
            let bullet = new GroundAirEnemyMissile(missileModel, speed);
            bullet.create(this);
            this.shootPermission = false;
            return bullet;
        }
        else {
            return null;
        }
    }

    //Checa colisão do objeto com todos os mísseis na tela
    checkMissileCollision(missiles) {
        for(var i = 0; i < missiles.length; i++) {
            if(this.boundingBox.intersectsBox(missiles[i].boundingBox)) {
                return i;
            }
        }
        return -1;
    }

    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        else {
            return false;
        }
    }

    getGeometry() {
        return this.object;
    }
}