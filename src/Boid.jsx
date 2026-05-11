import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationUtils } from 'three';
import { createClone, findAnimationByName } from './utils/animationUtils';
import { getInitialPosition } from './utils/environmentUtils';
import { BirdState } from './BirdStates';

// Pre-load the paper texture once — shared across all boids.
// MeshBasicMaterial is used so lighting doesn't interfere with the texture.
const paperTexture = new THREE.TextureLoader().load(
  './assets/creased_paper.png',
  (tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
  },
  undefined,
  (err) => console.error('Failed to load paper texture:', err)
);

class Boid {
  #blenderData = null;
  #mixer = null;
  #gltf = null;

  constructor(isLeader = true) {
    this.state = BirdState.FLOCKING;
    this.isLeader = isLeader;
    const [x, y, z] = getInitialPosition().position;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = 6;
    this.maxForce = 0.01;
  }

  static async copyBoid(originalBoid) {
    const newBoid = new Boid(originalBoid.isLeader);
    const [x, y, z] = getInitialPosition().position;

    newBoid.isLeader = false;
    newBoid.position = new THREE.Vector3(x, y, z);
    newBoid.velocity.copy(originalBoid.velocity);
    newBoid.acceleration.copy(originalBoid.acceleration);
    newBoid.maxSpeed = originalBoid.maxSpeed;
    newBoid.maxForce = originalBoid.maxForce;
    newBoid.#gltf = originalBoid.#gltf;
    newBoid.state = originalBoid.state;

    const cloneModelData = originalBoid.cloneModel();
    newBoid.#blenderData = cloneModelData.bird;
    newBoid.#mixer = cloneModelData.mixer;

    newBoid.blenderData.mesh.position.set(x, y, z);
    return newBoid;
  }

  cloneModel() {
    if (!this.#gltf) {
      console.error('Cannot cloneModel: GLTF model not loaded yet');
      return null;
    }

    if (!this.#gltf.animations?.length) {
      console.warn('gltfScene animations are missing. Check the boid loader');
      return null;
    }

    const flappingClip = findAnimationByName(this.#gltf.animations, 'Flapping');
    const trimmedFlappingClip = AnimationUtils.subclip(
      flappingClip,
      'FlappingTrimmed',
      70,
      175,
      60
    );
    const foldingClip = findAnimationByName(this.#gltf.animations, 'Object_1.001Action');
    const clonedGltf = createClone(this.#gltf);
    const clonedMesh = clonedGltf.mesh;
    const clonedMixer = clonedGltf.mixer;

    clonedMesh.position.set(this.position.x, this.position.y, this.position.z);

    const flappingAction = clonedMixer.clipAction(trimmedFlappingClip);
    const foldingAction = clonedMixer.clipAction(foldingClip);

    flappingAction.setLoop(THREE.LoopRepeat);
    flappingAction.play();

    foldingAction.setLoop(THREE.LoopOnce);
    foldingAction.clampWhenFinished = true;
    foldingAction.timeScale = 0.3;
    foldingAction.play();
    foldingAction.setEffectiveWeight(0);

    const birdInstance = {
      mesh: clonedMesh,
      mixer: clonedMixer,
      flappingAction,
      foldingAction,
    };

    return { bird: birdInstance, mixer: clonedMixer };
  }

  static async create(isLeader = true, scene) {
    const boid = new Boid(isLeader);
    await boid.initialize(scene);
    return boid;
  }

  async initialize(scene) {
    try {
      await this.loadModel();
      const cloneModelResult = this.cloneModel();
      if (cloneModelResult) {
        this.#blenderData = cloneModelResult.bird;
        this.#mixer = cloneModelResult.mixer;
        scene.scene.add(this.#blenderData.mesh);
      }
    } catch (error) {
      console.error('Failed to initialize Boid:', error);
      throw error;
    }
  }

  get blenderData() {
    return this.#blenderData;
  }

  get mixer() {
    return this.#mixer;
  }

  get gltf() {
    return this.#gltf;
  }

  async loadModel() {
    try {
      const gltfLoader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(
          './assets/3d_origami_crane_gltf/one.glb',
          (gltfScene) => resolve(gltfScene),
          undefined,
          (error) => reject(error)
        );
      });

      // MeshBasicMaterial — ignores lighting entirely so the paper
      // texture always shows exactly as-is regardless of scene lights.
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({
            map: paperTexture,
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
        }
      });

      this.#gltf = gltf;
      return gltf;
    } catch (error) {
      console.error('Error loading GLTF model:', error);
      throw error;
    }
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    if (this.blenderData?.mesh) {
      this.blenderData.mesh.position.copy(this.position);
    }

    this.acceleration.multiplyScalar(0);

    if (this.velocity.length() > 0.01 && this.blenderData?.mesh) {
      const lookAtPoint = new THREE.Vector3().addVectors(this.position, this.velocity);
      this.blenderData.mesh.lookAt(lookAtPoint);
    }
  }

  centripetalForce() {
    const center = new THREE.Vector3(0, 0, 0);
    const toCenter = new THREE.Vector3().subVectors(center, this.position);
    toCenter.normalize();
    return toCenter.multiplyScalar(0.01);
  }

  applyMurmurationWave(scalar = 1) {
    const time = performance.now() * 0.001;
    const waveStrength = 0.5;
    const phase =
      this.position.x * 0.05 + this.position.y * 0.05 + this.position.z * 0.05;
    const x = Math.sin(time + phase) * waveStrength * 0.05 * scalar;
    const y = Math.cos(time + phase) * waveStrength * 0.05 * scalar;
    const z = Math.sin(time * 0.7 + phase) * waveStrength * 0.05 * scalar;
    return new THREE.Vector3(x, y, z);
  }

  calculateSteeringForce(target) {
    const desired = new THREE.Vector3().subVectors(target, this.position);
    desired.normalize();
    desired.multiplyScalar(this.maxSpeed);
    const steer = new THREE.Vector3().subVectors(desired, this.velocity);
    steer.clampLength(0, this.maxForce);
    return steer;
  }

  calculateCohesion(surroundingBoids) {
    let count = 0;
    const perceivedCenter = new THREE.Vector3();

    surroundingBoids.forEach((boid) => {
      if (boid !== this) {
        perceivedCenter.add(boid.position);
        count++;
      }
    });

    if (count === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const centerOfMass = perceivedCenter.divideScalar(count);
    const cohesionForce = new THREE.Vector3().subVectors(centerOfMass, this.position);
    return cohesionForce.multiplyScalar(0.005);
  }

  alignWithNeighbors(surroundingBoids) {
    let count = 0;
    const averageVelocity = new THREE.Vector3();

    surroundingBoids.forEach((boid) => {
      if (boid !== this) {
        averageVelocity.add(boid.velocity);
        count++;
      }
    });

    if (count === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const perceivedVelocity = averageVelocity.divideScalar(count);
    return perceivedVelocity.sub(this.velocity).multiplyScalar(0.1);
  }

  separateFromNeighbors(surroundingBoids) {
    const separationForce = new THREE.Vector3();

    surroundingBoids.forEach((boid) => {
      const distance = this.position.distanceTo(boid.position);
      if (boid !== this && distance < 30 && distance > 0) {
        const away = new THREE.Vector3().subVectors(this.position, boid.position);
        away.normalize();
        away.multiplyScalar(1 / distance);
        separationForce.add(away);
      }
    });

    return separationForce.multiplyScalar(2);
  }

  applyFlockingBehavior(allBoids) {
    const flockingBoids = [];
    allBoids.forEach((boid) => {
      if (boid.state === BirdState.FLOCKING) {
        flockingBoids.push(boid);
      }
    });

    const cohesion = this.calculateCohesion(flockingBoids).multiplyScalar(1);
    const separation = this.separateFromNeighbors(flockingBoids).multiplyScalar(20);
    const alignment = this.alignWithNeighbors(flockingBoids);
    const centerAttraction = this.centripetalForce().multiplyScalar(20);
    const wave = this.applyMurmurationWave(6);

    this.acceleration
      .add(separation)
      .add(alignment)
      .add(cohesion)
      .add(centerAttraction)
      .add(wave);
  }
}

export default Boid;