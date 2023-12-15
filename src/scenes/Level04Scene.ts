import { Quaternion, Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene from './BaseScene';
import Land from '../objects/Land';
import Game from '../Game';

export enum COLLISION_GROUPS {
    PLAYER = 1,
    SCENE = 2,
    OBJECTS = 4,
    // GROUP4 = 8
}

class Level04Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        const player1 = new Player(0, this, this.clock, new CANNON.Vec3(-7, 1, -2.5));
        const player2 = new Player(1, this, this.clock, new CANNON.Vec3(-7, 1, 2.5));

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        // const level = new Land(this, true);
        const level = new LevelObject(this, 'level4', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        });


        // gravity pad!!! omg
        const gravityPad = new LevelObject(this, 'gravity_pad', {
            bodyType: CANNON.Body.STATIC,
            generateShapesOfChildren: true,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj instanceof Player) {
                    const p = otherObj as Player;
                    // set gravity in the orientation of the pad
                    p.setGravity(self.body.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0)).scale(9.82));
                    // this.state.p1OnPad = true;
                }
            },
            offset: new Vector3(7, 0, 7),
            // quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(-1, 3, -1).normalize())
            // quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(-1, -1, -1).normalize())
        });

        // landing pad
        const pad1 = new LevelObject(this, 'landing_pad1', {
            bodyType: CANNON.Body.STATIC,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj.name == player1.name) {
                    this.state.p1OnPad = true;
                }
            },
            collideEndCallback: (self, e) => {
                const otherObj = this.getObjByBody(e.body);
                if (otherObj.name == player1.name) {
                    this.state.p1OnPad = false;
                }
            },
            offset: new Vector3(10, 0, -5),
        });
        // landing pad
        const pad2 = new LevelObject(this, 'landing_pad2', {
            bodyType: CANNON.Body.STATIC,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj.name == player2.name) {
                    this.state.p2OnPad = true;
                }
            },
            collideEndCallback: (self, e) => {
                const otherObj = this.getObjByBody(e.body);
                if (otherObj.name == player2.name) {
                    this.state.p2OnPad = false;
                }
            },
            offset: new Vector3(10, 0, 5),
        });

        // cube for pushing into place
        const cube = new LevelObject(this, 'cube', {
            mass: 1,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                // demo: invert gravity once u touch the red box
                if (otherObj instanceof Player) {
                    const p = otherObj as Player;
                    p.setGravity(p.state.gravity.scale(-1));
                }
            },
            offset: new Vector3(6, 0, -2),
        });

        this.add(level, cube, player1, player2, pad1, pad2, gravityPad);
        // this.add(level, player1, player2);
    }

    winAction() {
        alert("YOU WIN!")
    }
}

export default Level04Scene;
