import { Quaternion, Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene, { COLLISION_GROUPS } from './BaseScene';
import Game from '../Game';
import Platform from '../objects/Platform';

class Level06Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        const player1 = new Player(0, this, this.clock, new CANNON.Vec3(-11, 0.5, -8));
        const player2 = new Player(1, this, this.clock, new CANNON.Vec3(-11, 0.5, 8));

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        const up = new Vector3(0, 1, 0);
        const upsideDown = new Quaternion().setFromUnitVectors(up, new Vector3(0, -1, 0));

        // const level = new Land(this, true);
        const level = new LevelObject(this, 'level6', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        });

        const plat1 = new Platform(this, 'plat1', {
            start: new CANNON.Vec3(15, -1, -8),
            end: new CANNON.Vec3(0, -1, -8),
            size: new CANNON.Box(new CANNON.Vec3(8, 0.25, 2)),
        });

        // landing pad on the ceiling.
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
            offset: new Vector3(-7, 19, 0),
            quaternion: upsideDown,
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
            offset: new Vector3(7, 0, 0),
        });

        const button = new LevelObject(this, 'button', {
            bodyType: CANNON.Body.STATIC,
            collideCallback: (self, e) => {
                const otherObj = this.getObjByBody(LevelObject.getOtherFromContact(self, e));
                if (otherObj instanceof Player) {
                    // trigger movement of the platform
                    plat1.startMovement();
                }
            },
            offset: new Vector3(-13, 0, 11),
        });

        this.add(level, player1, player2, button, pad1, pad2, plat1);
        // this.add(level, player1, player2);
    }

    winAction() {
        alert("YOU WIN!")
    }
}

export default Level06Scene;