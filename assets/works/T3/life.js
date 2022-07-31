import * as THREE from  'three';
import { degreesToRadians } from '../../libs/util/util.js';
import { CSG } from '../../libs/other/CSGMesh.js';

{/**
    Classe do objeto que recupera vida do aviao.
*/}

function updateObject(mesh) {
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
}

const createObject = () => {
    //PARA AJUSTAR O TAMANHO DO OBJETO MODIFICAR APENAS A CONSTANTE "RADIUS"
    const RADIUS = 4
    const DIAMETER = RADIUS*2
    const DEPTH = 0.5

    let csgObject1, csgObject2;
    let cylinderCSG, board_1CSG, board_2CSG;

    let vidaMaterial = new THREE.MeshPhongMaterial({
        color: "red",
        shininess: "150",
        specular: "white",
    });

    let cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS, RADIUS, DEPTH, 40)
    );
    let board_1 = new THREE.Mesh(
    new THREE.BoxGeometry(DIAMETER/2, DIAMETER/7.5, 10)
    );
    let board_2 = new THREE.Mesh(
    new THREE.BoxGeometry(DIAMETER/2, DIAMETER/7.5, 10)
    );

    cylinder.position.set(0, 1.3, 0);
    board_1.position.set(0, 1.3, 0);
    board_1.rotateX(degreesToRadians(90)),
    board_2.position.set(0, 1.3,0);
    board_2.rotateX(degreesToRadians(90)),
    board_2.rotateZ(degreesToRadians(90)),

    updateObject(cylinder);
    updateObject(board_1);
    updateObject(board_2);

    cylinderCSG = CSG.fromMesh(cylinder);
    board_1CSG = CSG.fromMesh(board_1);
    board_2CSG = CSG.fromMesh(board_2);

    csgObject1 = board_1CSG.union(board_2CSG);
    csgObject2 = cylinderCSG.subtract(csgObject1);
    let vida = CSG.toMesh(csgObject2,  new THREE.Matrix4());
    vida.material = vidaMaterial;
    vida.rotateX(degreesToRadians(90));

    return vida;
}

export class Life {
    constructor(speed) {
        this.life = createObject();
        this.boundingBox = new THREE.Box3().setFromObject(this.life);
        this.speed = speed;
    }

    //Define posicao do vida
    setPosition(x, y, z) {
        this.life.position.set(x, y, z)
        return;
    }

    update() {
        this.boundingBox.copy(this.life.geometry.boundingBox).applyMatrix4(this.life.matrixWorld);
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
        return this.life;
    }
}
