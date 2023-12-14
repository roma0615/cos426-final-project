import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { threeToCannon } from "three-to-cannon";

import LevelScene from '../scenes/LevelScene';

// Import land model as a URL using Vite's syntax
import MODEL from './level1.glb?url';

class Land extends Group {
    parent: LevelScene;
    body: CANNON.Body;
    dynamicBody: CANNON.Body;

    constructor(parent: LevelScene, show_wireframe = false) {
        // Call parent Group() constructor
        super();

        // Init body
        this.parent = parent;

        this.body = new CANNON.Body({
            type: CANNON.Body.STATIC,
        }); // nothing for now
        this.dynamicBody = new CANNON.Body({
            mass: 1,
        }); // nothing for now
        parent.world.addBody(this.body);
        parent.world.addBody(this.dynamicBody);

        

        // old body stuff
        // this.floor = new CANNON.Body({
        //     type: CANNON.Body.STATIC,
        //     material: groundMaterial,
        //     shape: new CANNON.Box(new CANNON.Vec3(10.75, 2.5, 10.75)),
        //     position: new CANNON.Vec3(0, -2.5, 0),
        // });
        // console.log("floor", this.floor);
        // parent.world.addBody(this.floor);
        // this.wall = new CANNON.Body({
        //     type: CANNON.Body.STATIC,
        //     // material: groundMaterial,
        //     shape: new CANNON.Box(new CANNON.Vec3(2, 8, 2)),
        //     position: new CANNON.Vec3(0, 2.5, 4),
        // });
        // // Slant the wall
        // parent.world.addBody(this.wall);

        // Wireframe mesh for visual debugging
        // if (show_wireframe){
        //     const material = new MeshBasicMaterial({ color: 0x000000, wireframe: true });
            
        //     const floor_geo = new BoxGeometry(10.75*2, 2.5*2, 10.75*2);
        //     floor_geo.translate(0, -2.5, 0);
        //     const floor_wireframe = new Mesh(floor_geo, material);
        //     this.add(floor_wireframe);

        //     const wall_geo = new BoxGeometry(2*2, 8*2, 2*2);
        //     wall_geo.translate(0, 2.5, 4);
        //     const wall_wireframe = new Mesh(wall_geo, material);
        //     this.add(wall_wireframe);
        // }

        const loader = new GLTFLoader();

        this.name = 'land';

        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
            gltf.scene.children.forEach((c) => {
                const result = threeToCannon(c);
                const { shape, offset, quaternion } = result;
                this.body.addShape(shape, offset, quaternion);
            })
            // console.log();
            // this.body.
            // this.body.type = CANNON.Body.STATIC;
            // console.log(this.body);
            // this.parent.world.addBody(this.body);
            // this.body.position.y -= 10;
        });
    }
}

export default Land;
