import * as THREE from  'three';

let explosionTextures = []

try {
    for (let i = 0; i < 16; i++) {
        explosionTextures.push(new THREE.TextureLoader().load(`./assets/${i+1}.png`));
    }
}
catch (err) {
    console.log("Error ao carregar textura de explosao.");
}

export class Explosion {
    constructor (x0, y0, z0) {
        this.geometry = new THREE.PlaneGeometry( 15, 15 );
        this.material = new THREE.MeshBasicMaterial({ 
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        this.object = new THREE.Mesh( this.geometry, this.material );
        this.object.position.set(x0, y0, z0);

        this.texture = new THREE.TextureLoader().load('./assets/14.png');
        this.material.map = this.texture;
        this.texCounter = 0;
        this.clock = 0;
        this.ended = false;
    }

    update(){
        this.object.position.z -= 1;
        this.material.map = explosionTextures[this.texCounter];
        if (!this.ended) {
            if (this.clock % 2 == 0) {
                this.texCounter = (this.texCounter + 1) % 16;
                if (this.texCounter == 0)
                    this.ended = true;
            }
            this.clock = (this.clock + 1) % 2;
        }
    }

    //Define posicao do cubo
    setPosition(x, y, z) {
        this.object.position.set(x, y, z)
        return;
    }

    getGeometry() {
        return this.object;
    }
}