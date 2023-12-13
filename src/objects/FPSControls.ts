import { Group, BoxGeometry, MeshBasicMaterial, Mesh, Quaternion, Vector3, Camera, Euler } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import * as CANNON from 'cannon-es';

import LevelScene from '../scenes/LevelScene';
import { cannonVecToThree } from '../utils';

// adapted from https://github.com/schteppe/cannon.js/blob/master/examples/js/PointerLockControls.js#L5
class FPSControls {
    // Define the type of the state field
    state: {
        cameraAngle: {
            x: number;
            y: number;
        }
        velocityFactor: number;
        jumpVelocity: number;
        quat: Quaternion;

        walkSpeed: number;
        keysPressed: Set<string>;
        canJump: boolean;

        contactNormal: CANNON.Vec3;
        lastTimeStamp: number;
    };
    camera: Camera;
    cameraDistance: number;
    // body is the body that the camera controls and is tethered to
    body: CANNON.Body;

    constructor (camera: Camera, cannonBody: CANNON.Body) {
        // if (cannonBody === undefined) return;
        this.camera = camera;
        this.cameraDistance = 10;
        this.state = {
            cameraAngle: {
                x: -Math.PI / 2,
                y: Math.PI / 4,
            },
            walkSpeed: 0.15,
            velocityFactor: 0.2,
            jumpVelocity: 7.5,
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
        this.state.cameraAngle.x -= event.movementX * 0.002;
        this.state.cameraAngle.y -= event.movementY * 0.002;
        this.state.cameraAngle.y = Math.max(0.1, Math.min(this.state.cameraAngle.y, Math.PI - 0.1));
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
        const delta = timeStamp - this.state.lastTimeStamp;
        // delta *= 0.1;

        // inputVelocity is local space right now
        inputVelocity.set(0, 0, 0);

        // i know usually x is sideways but since y is up it is weird. so instead
        // if we make +/-x forward/backward, then +z is right and -z is left
        // and +/-y is up/down
        if (this.state.keysPressed.has("w")) {
            inputVelocity.x = this.state.velocityFactor * delta; // not sure why w is flipped
        }
        if (this.state.keysPressed.has("s")) {
            inputVelocity.x = -this.state.velocityFactor * delta;
        }

        if (this.state.keysPressed.has("a")) {
            inputVelocity.z = -this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has("d")) {
            inputVelocity.z = this.state.velocityFactor * delta;
        }
        if (this.state.keysPressed.has(" ") && this.state.canJump) {
            // jump and remove
            // apply impluse vertically
            this.body.velocity.y += this.state.jumpVelocity;
            this.state.canJump = false;
        }


        // put camera behind the player
        this.camera.position.setFromSphericalCoords(this.cameraDistance, this.state.cameraAngle.y, this.state.cameraAngle.x);
        // rotate body to look at camera
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.state.cameraAngle.x + Math.PI / 2);
        const bodyPos = cannonVecToThree(this.body.position);
        this.camera.position.add(bodyPos);
        this.camera.lookAt(bodyPos);

        // Convert velocity to world coordinates based on direction of camera
        const cameraWorldDir = new Vector3();
        this.camera.getWorldDirection(cameraWorldDir);
        cameraWorldDir.setY(0).normalize();
        // console.log("camera world dir:", cameraWorldDir);
        this.state.quat.setFromUnitVectors(new Vector3(1, 0, 0), cameraWorldDir);
        // inputVelocity.applyAxisAngle(new Vector3(0, 1, 0));
        inputVelocity.applyQuaternion(this.state.quat);
        inputVelocity.normalize().multiplyScalar(this.state.walkSpeed);

        // shift the position of the object by inputVelocity
        this.body.position.x += inputVelocity.x;
        this.body.position.z += inputVelocity.z;

        this.state.lastTimeStamp = timeStamp;
    };
};

export default FPSControls;