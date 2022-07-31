import * as THREE from  'three';
import { degreesToRadians } from '../../libs/util/util.js';

{/**
    Classe referente ao objeto que controla as
    funcionalidades dos projetes que o avião atira'.
*/}
export class Bullet {
    constructor(speed, color = null) {
        this.geometry = new THREE.SphereGeometry( 0.75, 32, 32 );
        this.material = new THREE.MeshLambertMaterial( { color: color ? color : 0x201cff } );
        this.sphere = new THREE.Mesh( this.geometry, this.material );
        this.speed = speed * 2.25;
        this.boundingBox = new THREE.Box3().setFromObject(this.sphere);
        // this.sphere.geometry.computeBoundingBox();
        return;
    }

    create(airplane) {
        this.sphere.position.set(
            airplane.getGeometry().position.x,
            airplane.getGeometry().position.y,
            airplane.getGeometry().position.z - 5
        );
        return;
    }

    update() {
        this.sphere.translateZ(-this.speed);
        this.boundingBox.copy(this.sphere.geometry.boundingBox).applyMatrix4(this.sphere.matrixWorld);
    }

    getGeometry() {
        return this.sphere;
    }
}

export class Bomb {
    constructor(speed) {
        this.geometry = new THREE.SphereGeometry( 0.75, 32, 32 );
        this.material = new THREE.MeshLambertMaterial( { color: 0xff471a } );
        this.sphere = new THREE.Mesh( this.geometry, this.material );
        this.speed = speed * 2.25;
        this.boundingBox = new THREE.Box3().setFromObject(this.sphere);
        this.turnAngle = 0.5;
        return;
    }

    create(airplane) {
        this.sphere.position.set(
            airplane.getGeometry().position.x,
            airplane.getGeometry().position.y,
            airplane.getGeometry().position.z - 5
        );
        return;
    }

    update() {
        this.sphere.translateZ(-this.speed);
        this.sphere.rotateX(degreesToRadians(-this.turnAngle));
        this.boundingBox.copy(this.sphere.geometry.boundingBox).applyMatrix4(this.sphere.matrixWorld);
    }

    getGeometry() {
        return this.sphere;
    }
}

{/**
    Classe referente ao objeto que controla as
    funcionalidades dos projetes que os inimigos atiram'.
*/}
export class EnemyBullet {
    constructor(speed, color = null) {
        this.geometry = new THREE.SphereGeometry( 0.75, 32, 32 );
        this.material = new THREE.MeshLambertMaterial( { color: color ? color : 0xffa500 } );
        this.sphere = new THREE.Mesh( this.geometry, this.material );
        this.speed = speed * 1.25;
        this.boundingBox = new THREE.Box3().setFromObject(this.sphere);
        return;
    }

    create(enemy) {
        this.sphere.position.set(
            enemy.getGeometry().position.x,
            enemy.getGeometry().position.y,
            enemy.getGeometry().position.z + 5
        );
        return;
    }

    update() {
        this.sphere.translateZ(this.speed);
        this.boundingBox.copy(this.sphere.geometry.boundingBox).applyMatrix4(this.sphere.matrixWorld);
    }

    
    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        return false;
    }

    getGeometry() {
        return this.sphere;
    }
}

export class GroundAirEnemyMissile {
    constructor(model, speed, color = null) {
        this.geometry = new THREE.ConeGeometry( 1, 3, 16 );
        this.material = new THREE.MeshLambertMaterial( {
            color: 0x49fc73,
            transparent: model ? true : false,
            opacity: 0
        });
        this.sphere = new THREE.Mesh( this.geometry, this.material );
        this.speed = speed * 1.25;
        this.boundingBox = new THREE.Box3().setFromObject(this.sphere);
        this.onAirplaneHeight = false;

        if (!model) {
            this.model = null;
            this.sphere.castShadow = true;
            this.sphere.receiveShadow = true;
        }
        else {
            this.model = model;
            this.model.scale.set(8, 8, 8);
            this.sphere.add(this.model);
        }
        return;
    }

    create(enemy) {
        this.sphere.position.set(
            enemy.getGeometry().position.x,
            enemy.getGeometry().position.y,
            enemy.getGeometry().position.z + 5
        );
        return;
    }

    update(airplane) {
        if (this.onAirplaneHeight) {
            this.sphere.translateY(this.speed);
        }
        else {
            this.sphere.translateY(this.speed/3);
            this.onAirplaneHeight = this.sphere.position.y >= airplane.getPosition().y;
            if (this.onAirplaneHeight) {
                this.sphere.lookAt(airplane.getPosition());
                this.sphere.rotateX(degreesToRadians(90));
            }
        }
        this.boundingBox.copy(this.sphere.geometry.boundingBox).applyMatrix4(this.sphere.matrixWorld);
    }

    
    //Checa colisão do objeto com o avião
    checkPlaneCollision(plane) {
        if(this.boundingBox.intersectsBox(plane.boundingBox)) {
            return true;
        }
        return false;
    }

    getGeometry() {
        return this.sphere;
    }
}