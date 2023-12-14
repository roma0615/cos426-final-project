import dat from 'dat.gui';
import { Scene, Color, Sphere, Vector3, SphereGeometry, Mesh, Clock } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import LevelObject from '../objects/LevelObject';
import BaseScene from './BaseScene';

export enum COLLISION_GROUPS {
    PLAYER = 1,
    SCENE = 2,
    OBJECTS = 4,
    // GROUP4 = 8
}

class Level01Scene extends BaseScene {

    constructor() {
        // Call parent BaseScene() constructor
        super(); // 

        const player1 = new Player(0, this, new CANNON.Vec3(-7, 2, -2.5), this.clock);
        const player2 = new Player(1, this, new CANNON.Vec3(-7, 2, 2.5), this.clock);

        // update state
        this.state.players.push(player1);
        this.state.players.push(player2);
        this.state.activePlayer = 0;

        // --- LEVEL COMPONENTS --- //
        const level = new LevelObject(this, 'level1', {
            bodyType: CANNON.Body.STATIC,
            collisionGroup: COLLISION_GROUPS.SCENE,
            generateShapesOfChildren: true,
        });
        // start pad
        const pad = new LevelObject(this, 'landing_pad', {
            collideCallback: (self, e) => {
                const otherBody =
                    e.contact.bi.id == self.body.id
                        ? e.contact.bj
                        : e.contact.bi;
                console.log('Other body', otherBody);
            },
            offset: new Vector3(10, 0, 0),
        });

        // cube for pushing into place
        const cube = new LevelObject(this, 'cube', {
            mass: 1,
            collideCallback: (self, e) => {
                const otherBody =
                    e.contact.bi.id == self.body.id
                        ? e.contact.bj
                        : e.contact.bi;
                console.log('U PUSHED THE CUBE YAY', otherBody);
            },
            offset: new Vector3(6, 0, 2),
        });

        this.add(level, cube, player1, player2, pad);
    }
}

export default Level01Scene;
