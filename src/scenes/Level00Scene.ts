import { Vector3 } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene, { COLLISION_GROUPS } from './BaseScene';
import Game from '../Game';

class Level00Scene extends BaseScene {

    constructor(game: Game) {
        // Call parent BaseScene() constructor
        super(game);

        // const grav = new CANNON.Vec3(-6, -9.82, 0);
        // const grav = new CANNON.Vec3(-1, -1, 0);
        // grav.normalize();
        const player1 = new Player(0, this, this.clock, new CANNON.Vec3(-7, 2, -5));
        const player2 = new Player(1, this, this.clock, new CANNON.Vec3(-7, 2, 5));

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        // const level = new Land(this, true);
        const level = new LevelObject(this, 'level0', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
            // quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0.2, 1, 0).normalize())
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
            collideEndCallback: (_self, e) => {
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
            collideEndCallback: (_self, e) => {
                const otherObj = this.getObjByBody(e.body);
                if (otherObj.name == player2.name) {
                    this.state.p2OnPad = false;
                }
            },
            offset: new Vector3(10, 0, 5),
        });

        this.add(level, player1, player2, pad1, pad2);
        // this.add(level, player1, player2);
    }

    update(timeStamp: number): void {
        super.update(timeStamp);

    }
}

export default Level00Scene;
