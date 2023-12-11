import { Group, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import SeedScene from '../scenes/SeedScene';

// Import flower model as a URL using Vite's syntax
import MODEL from './player.glb?url';

class Flower extends Group {
    // Define the type of the state field
    state: {
        gui: dat.GUI;
        bob: boolean;
        spin: () => void;
        twirl: number;
    };
    body: CANNON.Body;

    constructor(parent: SeedScene, show_wireframe = false) {
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
            gui: parent.state.gui,
            bob: true,
            spin: () => this.spin(), // or this.spin.bind(this)
            twirl: 0,
        };

        // Load object
        const loader = new GLTFLoader();

        this.name = 'flower';
        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        this.state.gui.add(this.state, 'bob');
        this.state.gui.add(this.state, 'spin');
    }

    spin(): void {
        // Add a simple twirl
        this.state.twirl += 6 * Math.PI;

        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        const jumpUp = new TWEEN.Tween(this.body.position)
            .to({ y: this.body.position.y + 1 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out);
        const fallDown = new TWEEN.Tween(this.body.position)
            .to({ y: 0 }, 300)
            .easing(TWEEN.Easing.Quadratic.In);

        // Fall down after jumping up
        jumpUp.onComplete(() => fallDown.start());

        // Start animation
        jumpUp.start();
    }

    update(timeStamp: number): void {
        if (this.state.bob) {
            // Bob back and forth
            this.body.quaternion.setFromEuler(0, 0, 0.05 * Math.sin(timeStamp / 300), 'XYZ');
        }
        if (this.state.twirl > 0) {
            // Lazy implementation of twirl
            this.state.twirl -= Math.PI / 8;
            this.body.quaternion.setFromEuler(0, this.state.twirl, 0, 'XYZ');
        }

        // Advance tween animations, if any exist
        TWEEN.update();

        // Update physics
        this.position.copy(this.body.position as any);
        this.quaternion.copy(this.body.quaternion as any);
    }
}

export default Flower;
