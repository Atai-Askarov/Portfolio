import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createClone, findAnimationByName } from './utils/animationUtils';
import { getInitialPosition } from './utils/environmentUtils';
import { AnimationUtils } from 'three';
import { BirdState } from './BirdStates';

class Boid {
  #blenderData = null;
  #mixer = null;
  #gltf = null;

  constructor(isLeader = true) {
    this.state= BirdState.FLOCKING;
    this.isLeader = isLeader;
    const [x, y, z]  = getInitialPosition().position;
    this.position = new THREE.Vector3(x,y,z) ;
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2, // x: -1 to 1
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = 6;
    this.maxForce = 0.01;
  }

  static async copyBoid(originalBoid) {
    const newBoid = new Boid(originalBoid.isLeader);
    const [x, y, z]  = getInitialPosition().position;
        
    // Copy public properties
    newBoid.isLeader = false;
    newBoid.position = new THREE.Vector3(x,y,z)
    newBoid.velocity.copy(originalBoid.velocity);
    newBoid.acceleration.copy(originalBoid.acceleration);
    newBoid.maxSpeed = originalBoid.maxSpeed;
    newBoid.maxForce = originalBoid.maxForce;
    newBoid.#gltf = originalBoid.#gltf;
    newBoid.state = originalBoid.state;
    
    const cloneModeldData = originalBoid.cloneModel();
    newBoid.#blenderData = cloneModeldData.bird;
    newBoid.#mixer = cloneModeldData.mixer;

    newBoid.blenderData.mesh.position.set(
                    x,
                    y,
                    z
                    );
    return newBoid;
  }

  cloneModel() {
    /*
    if true, an actual clone will get created
    otherwise, the object fields will get set
    */
    if (!this.#gltf) {
      console.error('Cannot cloneModel: GLTF model not loaded yet');
      return null;
    }

    

    if (this.#gltf.animations && this.#gltf.animations.length > 0) {
      const flappingClip = findAnimationByName(
        this.#gltf.animations,
        'Flapping'
      );

      const trimmedFlappingClip = AnimationUtils.subclip(
        flappingClip,
        'FlappingTrimmed',
        70,    // start frame
        175,   // end frame these numbers were calculated based on the fps and the time of a clip
        60    // fps (adjust to your animation's fps)
      );
      const foldingClip = findAnimationByName(
        this.#gltf.animations,
        'Object_1.001Action'
      );
      const cloneModeldGLTFScene = createClone(this.#gltf);
      const cloneModeldSceneMesh = cloneModeldGLTFScene.mesh;
      const cloneModeldSceneMixer = cloneModeldGLTFScene.mixer;

      cloneModeldSceneMesh.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );

      const flappingAction = cloneModeldSceneMixer.clipAction(trimmedFlappingClip);
      const foldingAction = cloneModeldSceneMixer.clipAction(foldingClip);

      flappingAction.setLoop(THREE.LoopRepeat);
      flappingAction.play();

      foldingAction.setLoop(THREE.LoopOnce);
      foldingAction.clampWhenFinished = true;
      foldingAction.timeScale = 0.3
      foldingAction.play();
      foldingAction.setEffectiveWeight(0);

      const birdInstance = {
        mesh: cloneModeldSceneMesh,
        mixer: cloneModeldSceneMixer,
        flappingAction: flappingAction,
        foldingAction: foldingAction, // will have a bunch of different collapse actions
      };

      return {
        bird: birdInstance,
        mixer: cloneModeldSceneMixer,
      };
    } else {
      console.log('gltfScene animations are missing. Check the boid loader');
      return null;
    }
  }
  static async create(isLeader = true, scene) {
    const boid = new Boid(isLeader);
    await boid.initialize(scene);
    return boid;
  }

  async initialize(scene) {
    try {
      await this.loadModel();
      // Now that the model is loaded, we can set up the boid data
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

  // Public getters for private fields
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
      const glftLoader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        glftLoader.load(
          './assets/3d_origami_crane_gltf/one.glb',
          (gltfScene) => resolve(gltfScene),
          undefined,
          (error) => reject(error)
        );
      });
      
      this.#gltf = gltf;
      return gltf;
    } catch (error) {
      console.error('Error loading GLTF model:', error);
      throw error;
    }
  }

  update() {
    // Update velocity and position
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    if (this.blenderData && this.blenderData.mesh) {
      this.blenderData.mesh.position.copy(this.position);
    }

    this.acceleration.multiplyScalar(0);
    // Reset acceleration
    if (
      this.velocity.length() > 0.01 &&
      this.blenderData &&
      this.blenderData.mesh
    ) {
      // Only rotate if moving fast enough and mesh exists
      const lookAtPoint = new THREE.Vector3();
      lookAtPoint.addVectors(this.position, this.velocity);
      this.blenderData.mesh.lookAt(lookAtPoint);
    }

  }

  centripetal_force() {
    // Vector pointing toward the center (0,0,0)
    const center = new THREE.Vector3(0, 0, 0);
    const toCenter = new THREE.Vector3();
    toCenter.subVectors(center, this.position);

    toCenter.normalize();
    return toCenter.multiplyScalar(0.01); // Very gentle force
  }
  applyMurmurationWave(scalar = 1){
    const time = performance.now() * 0.001; // seconds
    const waveStrength = 0.5; // tweak for effect
    const phase = this.position.x * 0.05 + this.position.y * 0.05 + this.position.z * 0.05; // spatial phase
    const x = Math.sin(time + phase) * waveStrength * 0.05 * scalar;
    const y = Math.cos(time + phase) * waveStrength * 0.05 * scalar;
    const z = Math.sin(time * 0.7 + phase) * waveStrength * 0.05 * scalar;
    return new THREE.Vector3(x, y, z);
  }
  calculate_steering_force(target) {
    const desired = new THREE.Vector3(); //desired velocity
    desired.subVectors(target, this.position);

    desired.normalize();
    desired.multiplyScalar(this.maxSpeed);

    const steer = new THREE.Vector3();
    steer.subVectors(desired, this.velocity);
    steer.clampLength(0, this.maxForce);

    return steer;
  }
  
  
  calculate_pcm(surrounding_boids) {
    let count = 0;
    let calculated_perceived_point_of_conversion = new THREE.Vector3();

    surrounding_boids.forEach((boid) => {
      if (boid !== this) {
        calculated_perceived_point_of_conversion.add(boid.position);
        count++;
      }
    });

    if (count === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const center_of_mass =
      calculated_perceived_point_of_conversion.divideScalar(count);

    // Return the direction toward center of mass (Rule 1 from pseudocode)
    const cohesion_force = new THREE.Vector3();
    cohesion_force.subVectors(center_of_mass, this.position);
    return cohesion_force.multiplyScalar(0.005); // Reduced for smoother movement
  }

  keep_speed(surrounding_boids) {
    let count = 0;
    let average_velocity = new THREE.Vector3();

    surrounding_boids.forEach((boid) => {
      if (boid !== this) {
        average_velocity.add(boid.velocity);
        count++;
      }
    });

    if (count === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const perceived_velocity = average_velocity.divideScalar(count);
    return perceived_velocity.sub(this.velocity).multiplyScalar(0.1); // Better scaling
  }
  keep_distance(surrounding_boids) {
    let separation_force = new THREE.Vector3();

    surrounding_boids.forEach((boid) => {
      const distance = this.position.distanceTo(boid.position);
      if (boid !== this && distance < 30 && distance > 0) {
        // Increased distance threshold
        // Vector pointing away from the other boid
        const away = new THREE.Vector3().subVectors(
          this.position,
          boid.position
        );

        // Normalize and weight by inverse distance
        away.normalize();
        away.multiplyScalar(1 / distance); // Stronger repulsion when closer

        separation_force.add(away);
      }
    });

    return separation_force.multiplyScalar(2); // Moderate scaling
  }

  apply_flocking_behavior(allBoids) {
    let flockingBoids = [];
    allBoids.forEach(
      (boid)=>{
        if(boid.state === "FLOCKING")
          flockingBoids.push(boid);
      }
    )
    
    const cohesion = this.calculate_pcm(flockingBoids).multiplyScalar(1);
    const separation = this.keep_distance(flockingBoids).multiplyScalar(20);
    const alignment = this.keep_speed(flockingBoids)
    const centerAttraction = this.centripetal_force().multiplyScalar(20);
    const wave = this.applyMurmurationWave(6);

  this.acceleration
    .add(separation)
    .add(alignment)
    .add(cohesion)
    .add(centerAttraction)
    .add(wave);
  }

  // Static factory method for creating initialized Boids
}
export default Boid;
