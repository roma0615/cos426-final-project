import { Group, BoxGeometry, MeshBasicMaterial, Mesh, Vector3, Quaternion, AnimationMixer, AnimationClip, Clock, AnimationAction } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as CANNON from 'cannon-es';

import BaseScene, { COLLISION_GROUPS } from '../scenes/BaseScene';

// Import player model as a URL using Vite's syntax
import MODEL1 from '/src/assets/player1.glb?url';
import MODEL2 from '/src/assets/player2.glb?url';

class Player extends Group {
    // Define the type of the state field
    scene: BaseScene;
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

        gravity: CANNON.Vec3;
        gravityClock: Clock
    };
    body: CANNON.Body;
    clock: Clock;
    customUpdate: (self: Player, timeStamp: number) => void;

    constructor(
        index: number,
        scene: BaseScene,
        clock: Clock,
        initialPos = new CANNON.Vec3(),
        gravity = new CANNON.Vec3(0, -9.82, 0),
        customUpdate = (_self: Player, _timeStamp: number) => {},
        show_wireframe = false,
    ) {
        // Call parent Group() constructor
        super();
        this.scene = scene
        this.clock = clock;

        // name
        this.name = `player_${index}`

        // Init state
        this.state = {
            cameraAngle: {
                // todo replace this with a quaternion so we don't get weird jumping
                x: -Math.PI / 2,
                y: Math.PI / 2.2,
            },
            contactNormal: new CANNON.Vec3(),
            canJump: false,
            quat: new Quaternion(),
            walkSpeed: 0.125,
            // walkSpeed: 10,
            jumpVelocity: 8.5,
            gravity: gravity || new CANNON.Vec3(0, -9.82, 0),
            gravityClock: new Clock(),
        };
        this.state.gravityClock.start();
        this.customUpdate = customUpdate

        // Init body
        this.body = new CANNON.Body({
            mass: 1,
            linearDamping: 0.75,
            angularDamping: 0.5,
            material: this.scene.materials.player,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            position: initialPos,
            collisionFilterGroup: COLLISION_GROUPS.PLAYER,
            collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.SCENE | COLLISION_GROUPS.OBJECTS
        });
        this.scene.world.addBody(this.body);
        this.scene.registerBody(this.body, this);

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

        const MODEL = index == 0 ? MODEL1 : MODEL2;
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
        this.scene.addToUpdateList(this);
        // event handler for colliding with world
        this.body.addEventListener('collide', this.collideHandler.bind(this));
    }

    setGravity(newGrav: CANNON.Vec3): boolean {
        // gravity set cooldown is 0.5 seconds
        if (this.state.gravityClock.getDelta() > 0.5) {
            // change quaternion to point in direction of newGrav
            const quat = new CANNON.Quaternion().setFromVectors(this.state.gravity, newGrav);
            this.body.quaternion = this.body.quaternion.mult(quat);
            this.quaternion.copy(this.body.quaternion as any);
            this.state.gravity.copy(newGrav);
            return true;
        }
        return false;
    }

    collideHandler(e: any) {
        const upAxis = this.state.gravity.scale(-1);
        upAxis.normalize();
        const contact = e.contact;

        // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
        // We do not yet know which one is which! const's check.
        if (contact.bi.id == this.body.id) {
            // bi is the player body, flip the contact normal
            contact.ni.negate(this.state.contactNormal);
        }
        else this.state.contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is

        // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
        if (this.state.contactNormal.dot(upAxis) > 0.5) {
            // Use a "good" threshold value between 0 and 1 here!
            this.state.canJump = true;
            this.body.linearDamping = 0.75;
        }
    }

    switchToAnim(newAnim: string) {
        if (this.scene.getActivePlayer().name == this.name) {
            this.anim.action?.stop(); // stop old action
            const clip = AnimationClip.findByName(this.anim.clips, newAnim);
            this.anim.action = this.anim.mixer?.clipAction(clip);
            this.anim.action?.play(); // play this new action (no transition rn)
        }
    }

    determineAnimation(inputVel: Vector3) {
        let newAnim = undefined;
        if (inputVel.length() > 0.025 && this.anim.action?.getClip().name == "idle") newAnim = "walk"; // start walking
        if (inputVel.length() <= 0.025 && this.anim.action?.getClip().name == "walk") newAnim = "idle"; // start idling
        if (newAnim === undefined) return;
        this.switchToAnim(newAnim);
    }

    update(timeStamp: number): void {
        if (this.customUpdate) this.customUpdate(this, timeStamp);

        // apply the player's gravity
        this.body.applyForce(this.state.gravity);

        // Update physics
        this.position.copy(this.body.position as any);


        // this.quaternion.slerp(this.body.quaternion as any, 0.15);
        this.quaternion.copy(this.body.quaternion as any);

        // play animation mixer
        if (this.anim.mixer) this.anim.mixer.update(this.clock.getDelta());
    }
}

export default Player;
