import { Group, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene from '../scenes/LevelScene';

// Import player model as a URL using Vite's syntax
import MODEL from './player.glb?url';

class Player extends Group {
    // Define the type of the state field
    state: {
        isActive: boolean,
    };
    body: CANNON.Body;

    constructor(parent: LevelScene, isActive: boolean, show_wireframe = false) {
        // Call parent Group() constructor
        super();

        // Init body
        this.body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            position: new CANNON.Vec3(0, 5, 0),
        });
        parent.world.addBody(this.body);

        // Wireframe mesh for visual debugging
        if (show_wireframe){
            const geometry = new BoxGeometry(1, 1, 1);
            const material = new MeshBasicMaterial({ color: 0x000000, wireframe: true });
            const wireframe = new Mesh(geometry, material);
            this.add(wireframe);
        }

        // Init state
        this.state = {
            // spin: () => this.spin(), // or this.spin.bind(this)
            isActive // whether the player is being controlled
        };

        // Load object
        const loader = new GLTFLoader();

        this.name = 'player' + Math.floor(Math.random() * 10000);
        loader.load(MODEL, (gltf) => {
            gltf.scene.position.y -= 0.5;
            this.add(gltf.scene);
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // this.state.gui.add(this.state, 'spin');
    }

    // spin(): void {
    //     // Add a simple twirl
    //     this.state.twirl += 6 * Math.PI;

    //     // Use timing library for more precice "bounce" animation
    //     // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
    //     // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
    //     const jumpUp = new TWEEN.Tween(this.body.position)
    //         .to({ y: this.body.position.y + 1 }, 300)
    //         .easing(TWEEN.Easing.Quadratic.Out);

    //     // Start animation
    //     jumpUp.start();
    // }

    update(timeStamp: number): void {
        // if (this.state.twirl > 0) {
        //     // Lazy implementation of twirl
        //     this.state.twirl -= Math.PI / 8;
        //     this.body.quaternion.setFromEuler(0, this.state.twirl, 0, 'XYZ');
        // }

        // // Advance tween animations, if any exist
        // TWEEN.update();

        // Update physics
        this.position.copy(this.body.position as any);
        this.quaternion.copy(this.body.quaternion as any);
    }
}

export default Player;
