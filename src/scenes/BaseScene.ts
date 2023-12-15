import dat from 'dat.gui';
import { Scene, Color, Sphere, Vector3, SphereGeometry, Mesh, Clock } from 'three';

import * as CANNON from 'cannon-es';

import Player from '../objects/Player';
import Land from '../objects/Land';
import BasicLights from '../lights/BasicLights';
import LevelObject from '../objects/LevelObject';

// Define an object type which describes each object in the update list
type UpdateChild = {
    // Each object *might* contain an update function
    update?: (timeStamp: number) => void;
};

export enum COLLISION_GROUPS {
    PLAYER = 1,
    SCENE = 2,
    OBJECTS = 4,
    // GROUP4 = 8
}

class BaseScene extends Scene {
    // Define the type of the state field
    state: {
        gui: dat.GUI;
        rotationSpeed: number;
        updateList: UpdateChild[];
        players: Player[];
        activePlayer: number;
    };
    materials: {
        ground: CANNON.Material;
        player: CANNON.Material;
    };
    bodyToObj: Map<CANNON.Body, any>;
    timeStep: number;
    world: CANNON.World;
    clock: Clock;

    constructor() {
        // Call parent Scene() constructor
        super();
        this.clock = new Clock();

        // Init world
        this.timeStep = 1 / 60;
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -0.001, 0),  // sideways gravity for testing friction
        });
        // setup materials
        this.materials = {
            ground: new CANNON.Material('ground'),
            player: new CANNON.Material('player'),
        };
        this._initContactMaterials();
        

        // Init state
        this.state = {
            gui: new dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
            players: [],
            activePlayer: 0,
        };

        this.bodyToObj = new Map<CANNON.Body, any>();

        // add lights
        const lights = new BasicLights();
        this.add(lights);

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        window.addEventListener(
            'keydown',
            this.keydownHandler.bind(this),
            false
        );
    }

    _initContactMaterials() {
        // add contact materials
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.materials.ground,
                this.materials.player,
                {
                    friction: 1,
                    restitution: 0.3,
                    contactEquationStiffness: 1e8,
                    contactEquationRelaxation: 3,
                    frictionEquationStiffness: 1e8,
                }
            )
        );
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.materials.player,
                this.materials.player,
                {
                    friction: 0,
                    restitution: 0.3,
                    contactEquationStiffness: 1e8,
                    contactEquationRelaxation: 3,
                }
            )
        );
    }

    addToUpdateList(object: UpdateChild): void {
        this.state.updateList.push(object);
    }

    registerBody(body: CANNON.Body, obj: any) {
        // store in a mapping from body to its owner object
        this.bodyToObj.set(body, obj);
    }
    getObjByBody(body: CANNON.Body) {
        return this.bodyToObj.get(body);
    }

    getActivePlayer(): Player {
        return this.state.players[this.state.activePlayer];
    }

    update(timeStamp: number): void {
        const { updateList } = this.state;
        // console.log("UPDATING each thing in update list:", updateList);
        this.world.step(this.timeStep);

        // Call update for each object in the updateList
        for (const obj of updateList) {
            if (obj.update !== undefined) {
                obj.update(timeStamp);
            }
        }
    }
    
    keydownHandler (event: any) {
        if (event.key == "x") { // x to switch characters
            this.state.activePlayer = 1 - this.state.activePlayer;
        }
    }
}

export default BaseScene;
