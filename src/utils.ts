import * as THREE from 'three';
import { Quaternion, Vec3 } from "cannon-es";

export const cannonVecToThree = (v: Vec3) => new THREE.Vector3(...v.toArray());
export const threeVectorToCannon = (v: THREE.Vector3) => new Vec3(...v.toArray());

export const cannonQuatToThree = (v: Quaternion) => new THREE.Quaternion(...v.toArray());
export const threeQuatToCannon = (v: THREE.Quaternion) => new Quaternion(...v.toArray());

export const EPS = 0.01;
