import dat from 'dat.gui';
import { Scene, Color } from 'three';

import * as CANNON from 'cannon-es';

import Flower from '../objects/Flower';
import Land from '../objects/Land';
import BasicLights from '../lights/BasicLights';

// Define an object type which describes each object in the update list
type UpdateChild = {
    // Each object *might* contain an update function
    update?: (timeStamp: number) => void;
};

class SeedScene extends Scene {
    // Define the type of the state field
    state: {
        gui: dat.GUI;
        rotationSpeed: number;
        updateList: UpdateChild[];
    };
    timeStep: number;
    world: CANNON.World;

    constructor() {
        // Call parent Scene() constructor
        super();

        // Init world
        this.timeStep = 1 / 60;
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0),
        }); 

        // Init state
        this.state = {
            gui: new dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
        };

        // Set background to a nice color
        this.background = new Color(0x7ec0ee);

        // Add meshes to scene
        const land = new Land(this, true);
        const flower = new Flower(this, true);
        const lights = new BasicLights();
        this.add(land, flower, lights);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
    }

    addBodyToWorld(object: CANNON.Body): void {
        this.world.addBody(object);
    }

    addToUpdateList(object: UpdateChild): void {
        this.state.updateList.push(object);
    }

    update(timeStamp: number): void {
        const { rotationSpeed, updateList } = this.state;
        this.rotation.y = (rotationSpeed * timeStamp) / 10000;
        this.world.step(this.timeStep);

        // Call update for each object in the updateList
        for (const obj of updateList) {
            if (obj.update !== undefined) {
                obj.update(timeStamp);
            }
        }
    }
}

export default SeedScene;
