import { Group, BoxGeometry, MeshBasicMaterial, Mesh, Quaternion, Vector3, Camera, Euler } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene from '../scenes/LevelScene';

// adapted from https://github.com/schteppe/cannon.js/blob/master/examples/js/PointerLockControls.js#L5
class FPSControls {
    // Define the type of the state field
    state: {
        eyeYPos: number;
        velocityFactor: number;
        jumpVelocity: number;
        quat: Quaternion;

        keysPressed: Set<string>;
        canJump: boolean;

        contactNormal: CANNON.Vec3;
        lastTimeStamp: number;
    };
    camera: Camera;
    // yawObject: Group;
    // pitchObject: Group;
    body: CANNON.Body;

    constructor (camera: Camera, cannonBody: CANNON.Body) {
        // if (cannonBody === undefined) return;
        this.camera = camera;
        this.state = {
            eyeYPos: 2, // eyes 2 meters above ground
            velocityFactor: 0.2,
            jumpVelocity: 5,
            quat: new Quaternion(),
            keysPressed: new Set(), // keep track of keys pressed
            canJump: false,
            contactNormal: new CANNON.Vec3(),
            lastTimeStamp: 0,
        }
        this.body = cannonBody;

        // groups for controlling camera rotation
        // this.pitchObject = new Group();
        // this.pitchObject.add(camera); // breaks things?

        // this.yawObject = new Group();
        // this.yawObject.position.y = this.state.eyeYPos;
        // this.yawObject.add(this.pitchObject);

        // setup event listeners
        this.body.addEventListener('collide', this.collideHandler.bind(this));
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

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

    onMouseMove (event: MouseEvent) {
        const PI_2 = Math.PI / 2;
        // if (this.enabled === false) return;

        this.camera.rotation.z += event.movementX * 0.002;
        this.camera.rotation.x += event.movementY * 0.002;

        this.camera.rotation.z = Math.max(
            -PI_2,
            Math.min(PI_2, this.camera.rotation.z)
        );
    }

    onKeyDown (event: KeyboardEvent) {
        if (["w", "a", "s", "d", " "].includes(event.key)) {
            this.state.keysPressed.add(event.key);
        }
    };

    onKeyUp (event: KeyboardEvent) {
        if (["w", "a", "s", "d", " "].includes(event.key)) {
            this.state.keysPressed.delete(event.key);
        }
    };

    getObject() {
        return this.camera;
    };

    getDirection() {
        const targetVec = new Vector3(0, 0, -1);
        targetVec.applyQuaternion(this.state.quat);
        return targetVec;
    };

    // Moves the camera to the Cannon.js object position and adds velocity to the object if the run key is down
    update(timeStamp: number) {
        const inputVelocity = new Vector3();
        const euler = new Euler();
        const delta = timeStamp - this.state.lastTimeStamp;
        // delta *= 0.1;

        inputVelocity.set(0, 0, 0);

        if (this.state.keysPressed.has("w")) {
            inputVelocity.z = -this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has("s")) {
            inputVelocity.z = this.state.velocityFactor * delta;
        }

        if (this.state.keysPressed.has("a")) {
            inputVelocity.x = this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has("d")) {
            inputVelocity.x = -this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has(" ") && this.state.canJump) {
            // jump and remove
            // apply impluse vertically
            this.body.velocity.y += this.state.jumpVelocity;
            this.state.canJump = false;
        }

        // Convert velocity to world coordinates
        euler.x = this.camera.rotation.x;
        euler.y = this.camera.rotation.y;
        euler.order = 'XYZ';
        this.state.quat.setFromEuler(euler);
        inputVelocity.applyQuaternion(this.state.quat);
        //quat.multiplyVector3(inputVelocity);

        // Add to the object
        this.body.position.x += 0.1 * inputVelocity.x;
        this.body.position.z += 0.1 * inputVelocity.z;

        this.camera.position.copy(new Vector3(...this.body.position.toArray()));

        this.state.lastTimeStamp = timeStamp;
    };
};

export default FPSControls;