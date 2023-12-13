import { Group, BoxGeometry, MeshBasicMaterial, Mesh, Vector3, Quaternion, AnimationMixer, AnimationClip, Clock, AnimationAction } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene from '../scenes/LevelScene';

// Import player model as a URL using Vite's syntax
import MODEL from './player.glb?url';

class Player extends Group {
    // Define the type of the state field
    anim: {
        mixer: AnimationMixer | undefined;
        clips: AnimationClip[];
        action: AnimationAction | undefined;
    };
    state: {
        cameraAngle: {
            x: number;
            y: number;
        };
        contactNormal: CANNON.Vec3;
        canJump: boolean;
        quat: Quaternion;
        walkSpeed: number;
        jumpVelocity: number;
    };
    body: CANNON.Body;
    clock: Clock;

    constructor(
        parent: LevelScene,
        show_wireframe = false,
        initialPos = new CANNON.Vec3(),
        clock: Clock
    ) {
        // Call parent Group() constructor
        super();
        this.clock = clock;

        // Init state
        this.state = {
            // spin: () => this.spin(), // or this.spin.bind(this)
            cameraAngle: {
                x: -Math.PI / 2,
                y: Math.PI / 4,
            },
            contactNormal: new CANNON.Vec3(),
            canJump: false,
            quat: new Quaternion(),
            walkSpeed: 0.2,
            jumpVelocity: 7.5,
        };

        // Init body
        this.body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            position: initialPos,
        });
        parent.world.addBody(this.body);

        // Wireframe mesh for visual debugging
        if (show_wireframe) {
            const geometry = new BoxGeometry(1, 1, 1);
            const material = new MeshBasicMaterial({
                color: 0x000000,
                wireframe: true,
            });
            const wireframe = new Mesh(geometry, material);
            this.add(wireframe);
        }

        // Load object
        const loader = new GLTFLoader();
        this.anim = {
            mixer: undefined,
            clips: [],
            action: undefined,
        };

        this.name = 'player' + Math.floor(Math.random() * 10000);
        loader.load(MODEL, (gltf) => {
            const scene = clone(gltf.scene); // clone so that each player has their own mesh, anims, etc
            scene.position.y -= 0.5; // so bottom of mesh aligns with bottom of box
            this.add(scene); // unique scene object for this

            // animations
            this.anim.mixer = new AnimationMixer(scene);
            this.anim.clips = gltf.animations; // don't have to copy clips between object instances
            const idleAnim = AnimationClip.findByName(this.anim.clips, 'idle');
            this.anim.action = this.anim.mixer.clipAction(idleAnim);
            this.anim.action.play(); // start with idle
        });

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // this.state.gui.add(this.state, 'spin');

        // event handler for colliding with world
        this.body.addEventListener('collide', this.collideHandler.bind(this));
    }

    // keeping for animation reference
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

    collideHandler(e: any) {
        const upAxis = new CANNON.Vec3(0, 1, 0);
        const contact = e.contact;

        // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
        // We do not yet know which one is which! const's check.
        if (contact.bi.id == this.body.id)
            // bi is the player body, flip the contact normal
            contact.ni.negate(this.state.contactNormal);
        else this.state.contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is

        // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
        if (this.state.contactNormal.dot(upAxis) > 0.5)
            // Use a "good" threshold value between 0 and 1 here!
            this.state.canJump = true;
    }

    switchToAnim(newAnim: string) {
        this.anim.action?.stop(); // stop old action
        const clip = AnimationClip.findByName(this.anim.clips, newAnim);
        this.anim.action = this.anim.mixer?.clipAction(clip);
        this.anim.action?.play(); // play this new action (no transition rn)
    }

    determineAnimation(inputVel: Vector3) {
        let newAnim = undefined;
        if (inputVel.length() > 0.1 && this.anim.action?.getClip().name == "idle") newAnim = "walk"; // start walking
        if (inputVel.length() <= 0.1 && this.anim.action?.getClip().name == "walk") newAnim = "idle"; // start idling
        if (newAnim === undefined) return;
        this.switchToAnim(newAnim);
    }

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

        // play animation mixer
        if (this.anim.mixer) this.anim.mixer.update(this.clock.getDelta());
    }
}

export default Player;
