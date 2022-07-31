import * as THREE from 'three';
import { createGroundPlaneWired, degreesToRadians, createGroundPlane } from "../libs/util/util.js";
import { Water } from "../build/jsm/objects/Water2.js";

const textureLoader = new THREE.TextureLoader();

const waterNormal1 = textureLoader.load("./assets/Water_1_M_Normal.jpg");
const waterNormal2 = textureLoader.load("./assets/Water_2_M_Normal.jpg");

{/*
	Classe referente a geração do ambiente do jogo e
	armazenamento das informações do mesmo.
*/}

const GRASS_HEIGHT = 17;
const ROCKS_HEIGHT = 4;
const AIRPLANE_LIMIT_X = 75;

const loader = new THREE.TextureLoader();

const GRASS_TEXTURE = loader.load("./assets/ground_textures/grass5.jpg");
const GRASS_DISPLACEMENT = loader.load("./assets/ground_textures/grass5.jpg");
const ROCKS_TEXTURE = loader.load("./assets/ground_textures/rock4.png");

export class Scenario {
	constructor(height, width) {
		this.clock = 1;
		this.threshold = width/2;
		this.height = height;
		this.width = width;

		this.ground_plane =  createGroundPlane(height, width, 30, 30, 'MediumSlateBlue');
		this.ground_plane.receiveShadow = true;
		this.ground_plane.position.set(0, -20, 0);
		this.ground_plane.rotation.x = Math.PI * (-0.5);
        this.ground_plane.material.transparent = true;
		
		this.second_ground_plane = createGroundPlane(height, width, 30, 30, 'MediumSlateBlue');
		this.second_ground_plane.receiveShadow = true;
		this.second_ground_plane.position.set(0, -20, 2*width);
		this.second_ground_plane.rotation.x = Math.PI * (-0.5);
        this.second_ground_plane.material.transparent = true;

		this.waterGeometry = new THREE.PlaneGeometry(170, height);	

		this.water = new Water(
			this.waterGeometry,
			{
				color: 'MediumSlateBlue',
				scale: 0.5,
				reflectivity: 0,
				flowDirection: new THREE.Vector2(1, 1),
				textureWidth: 128,
				textureHeight: 128,
				normalMap0: waterNormal1,
				normalMap1: waterNormal2
			}
		);

		this.water.position.y = 10;
		this.water.rotation.x = Math.PI * (-0.5);
	}

	update(cameraHolder) {
		if (this.clock) {
			if (cameraHolder.position.z - this.threshold <= (this.ground_plane.position.z)) {
				this.second_ground_plane.position.set(0, 0, this.ground_plane.position.z - (this.width / 2));
				this.clock = 0;
			}
		}
		else {
			if (cameraHolder.position.z - this.threshold <= (this.second_ground_plane.position.z)) {
				this.ground_plane.position.set(0, 0, this.second_ground_plane.position.z - (this.width / 2));
				this.clock = 1;
			}			
		}
		this.water.position.z -= 1;
		return;
	}

	reset() {
		this.ground_plane.position.set(0.0, 0.0, -0.02);
		this.second_ground_plane.position.set(0.0, 0.0, -0.02);
		this.water.position.z = 0;
		return;
	}
}

export class Grass {
	constructor(height, width, side) {
		this.clock = 1;
		this.threshold = width/2;
		this.height = height;
		this.width = width;
		this.x_position = (AIRPLANE_LIMIT_X + height/2)*side;

		this.ground_geometry = new THREE.PlaneBufferGeometry(height, width, 128, 128);
		this.ground_material = new THREE.MeshStandardMaterial({
			transparent: true,
			alphaTest: 0.5,
			map: GRASS_TEXTURE,
			displacementMap: GRASS_DISPLACEMENT,
			displacementScale: 2
		});
		this.ground_material.map.wrapT = THREE.RepeatWrapping;
		this.ground_material.map.wrapS = THREE.RepeatWrapping;
		this.ground_material.map.repeat.set(8,8);
		this.ground_plane = new THREE.Mesh(this.ground_geometry, this.ground_material);
		this.ground_plane.receiveShadow = true;
		this.ground_plane.rotateX(degreesToRadians(-90));
		this.ground_plane.position.set(this.x_position, GRASS_HEIGHT, 0);
		
		this.second_ground_plane = new THREE.Mesh(this.ground_geometry, this.ground_material);
		this.second_ground_plane.receiveShadow = true;
		this.second_ground_plane.position.set(this.x_position, GRASS_HEIGHT, 2*width);
		this.second_ground_plane.rotateY(degreesToRadians(-180));
		this.second_ground_plane.rotateX(degreesToRadians(-90));
	}

	update(cameraHolder) {
		if (this.clock) {
			if (cameraHolder.position.z - this.threshold <= (this.ground_plane.position.z)) {
				this.second_ground_plane.position.set(this.x_position, GRASS_HEIGHT, this.ground_plane.position.z - (this.width - 1));
				this.clock = 0;
			}
		}
		else {
			if (cameraHolder.position.z - this.threshold <= (this.second_ground_plane.position.z)) {
				this.ground_plane.position.set(this.x_position, GRASS_HEIGHT, this.second_ground_plane.position.z - (this.width - 1));
				this.clock = 1;
			}			
		}
		return;
	}

	reset() {
		this.ground_plane.position.set(this.x_position, GRASS_HEIGHT, -0.02);
		this.second_ground_plane.position.set(this.x_position, GRASS_HEIGHT, -0.02);
		return;
	}
}

export class Rocks {
	constructor(height, width, side) {
		this.clock = 1;
		this.threshold = width/2;
		this.height = height;
		this.width = width;
		this.x_position = (AIRPLANE_LIMIT_X - 20)*side;

		this.ground_geometry = new THREE.PlaneBufferGeometry(height, width, 128, 128);
		this.ground_material = new THREE.MeshStandardMaterial({
			transparent: true,
			alphaTest: 0.5,
			map: ROCKS_TEXTURE,
			displacementMap: GRASS_DISPLACEMENT,
			displacementScale: 7,
		});
		this.ground_material.map.wrapT = THREE.RepeatWrapping;
		this.ground_material.map.wrapS = THREE.RepeatWrapping;
		this.ground_material.map.repeat.set(4,16);
		this.ground_plane = new THREE.Mesh(this.ground_geometry, this.ground_material);
		this.ground_plane.receiveShadow = true;
		this.ground_plane.rotateX(degreesToRadians(-90));
		this.ground_plane.rotateY(degreesToRadians(side == -1 ? 30 : -30));
		this.ground_plane.position.set(this.x_position, ROCKS_HEIGHT, 0);
		
		this.second_ground_plane = new THREE.Mesh(this.ground_geometry, this.ground_material);
		this.second_ground_plane.receiveShadow = true;
		this.second_ground_plane.position.set(this.x_position, ROCKS_HEIGHT, 2*width);
		this.second_ground_plane.rotateX(degreesToRadians(-90));
		this.second_ground_plane.rotateY(degreesToRadians(side == -1 ? 30 : -30));
	}

	update(cameraHolder) {
		if (this.clock) {
			if (cameraHolder.position.z - this.threshold <= (this.ground_plane.position.z)) {
				this.second_ground_plane.position.set(this.x_position, ROCKS_HEIGHT, this.ground_plane.position.z - (this.width - 3));
				this.clock = 0;
			}
		}
		else {
			if (cameraHolder.position.z - this.threshold <= (this.second_ground_plane.position.z)) {
				this.ground_plane.position.set(this.x_position, ROCKS_HEIGHT, this.second_ground_plane.position.z - (this.width - 3));
				this.clock = 1;
			}			
		}
		return;
	}

	reset() {
		this.ground_plane.position.set(this.x_position, ROCKS_HEIGHT, -0.02);
		this.second_ground_plane.position.set(this.x_position, ROCKS_HEIGHT, -0.02);
		return;
	}
}