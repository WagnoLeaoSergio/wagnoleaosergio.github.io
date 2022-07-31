import * as THREE from  'three';
import { degreesToRadians } from '../../libs/util/util.js';
import { Bomb, Bullet } from './bullets.js';

const AIRPLANE_HEIGHT = 20;
const AIRPLANE_CADENCY = 250;
const AIRPLANE_BULLET_COLOR = 0xfcfaff;

{/**
    Classe referente ao objeto que controla as
    funcionalidades do avião.
*/}
export class Airplane {
    constructor(model) {
        this.geometry = new THREE.ConeGeometry( 2, 3, 32 );
        this.material = new THREE.MeshLambertMaterial({ transparent : true, opacity: 0 });
        this.material.depthWrite = false;
        this.object = new THREE.Mesh( this.geometry, this.material );
        this.burst = false;

        if (!model) {
            this.model = null;
            this.object.castShadow = true;
            this.object.receiveShadow = true;
        }
        else {
            this.model = model;
            this.model.rotateY(degreesToRadians(180));
            this.model.rotateX(degreesToRadians(-90));
            this.model.scale.set(1.5,1.5,1.5);
            this.object.add(this.model);
        }

        this.isRotated = false;
        this.boundingBox = new THREE.Box3().setFromObject(this.object);
        this.shootPermission = false;
        this.startTime = new Date();
        this.life = 5;
        this.damageTime = new Date();
        this.bombPermission = false;
        this.bombStartTime = new Date();
    }

    update(speed) {
        let endTime = new Date();
        let bombEndTime = new Date();
        if(endTime - this.startTime >= AIRPLANE_CADENCY) {
            this.shootPermission = true;
            this.startTime = new Date();
        }
        if(bombEndTime - this.bombStartTime >= AIRPLANE_CADENCY) {
            this.bombPermission = true;
            this.bombStartTime = new Date();
        }
        this.object.translateY(speed);
        this.boundingBox.copy(this.object.geometry.boundingBox).applyMatrix4(this.object.matrixWorld);
    }

    setInitialOrResetPosition(initial = true) {
        this.object.position.set(0, AIRPLANE_HEIGHT, 50);
        if (initial) {
            this.object.rotateX(degreesToRadians(-90));
        }
    }

    decreaseLife(hitPoints) {
        this.life = this.life - hitPoints;
    }

    increaseLife() {
        if (this.life < 5) {
            this.life = this.life + 1;
        }
    }

    shoot(speed, airplane, game) {
        if(this.burst){
            if(this.shootPermission){
                let bullet = new Bullet(speed, AIRPLANE_BULLET_COLOR);
                bullet.create(airplane);
                game.addOnScene(bullet.sphere);
                this.shootPermission = false;
                return bullet;
            }
            else {
                return null;
            }
        }
        else{
            let bullet = new Bullet(speed, AIRPLANE_BULLET_COLOR);
            bullet.create(airplane);
            game.addOnScene(bullet.sphere);
            return bullet;
        }
    }

    bomb(speed, airplane, game) {
        if(this.bombPermission){
            let bomb = new Bomb(speed);
            bomb.create(airplane);
            game.addOnScene(bomb.sphere);
            this.bombPermission = false;
            return bomb;
        }
        else {
            return null;
        }
    }

    checkMissileCollision(missiles) {
        for(var i = 0; i < missiles.length; i++) {
            if(this.boundingBox.intersectsBox(missiles[i].boundingBox)) {
                return i;
            }
        }
        return -1;
    }

    getGeometry() {
        return this.object;
    }

    getPosition() {
        return this.object.position;
    }
}
