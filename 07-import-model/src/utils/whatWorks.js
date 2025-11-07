export function animate(birds, mixers, camera, setPaperGrid, setGridDimensions, scene) {
    const clock = new THREE.Clock();

    function render() {
        const delta = clock.getDelta();
        if (mixers.length > 0) {
          mixers.forEach((mixer) => {
            mixer.update(delta);
          });
        }
        let haveArrived = [];
        birds.forEach((surroundingBoids, boid) => {
          if (boid.state === "GRID_FORMATION") {
            const gridBirdsSet = birdStateManager.returnSubscribers();
            const gridBirds = Array.from(gridBirdsSet);
            const gridDimensions = formPaperGrid(camera, gridBirds, 3, 4, scene.scene);
            setGridDimensions(gridDimensions);
            for (let i = 0; i < gridBirds.length; i++) {
              const gridBird = gridBirds[i];
              const hasArrived = Math.abs(gridBird.position.distanceTo(camera.position) - 200) < 120;
              haveArrived.push(hasArrived)
            }
            const allTruthy = haveArrived.every(Boolean);
            if(allTruthy){
              setPaperGrid(true); 
            }
          }
          else if(boid.state === "FLOCKING"){
            boid.apply_flocking_behavior(surroundingBoids);
            boid.update();
          }
          else {
            unfoldAction(null, boid, camera);
            boid.update();
          }
        });
        
        requestAnimationFrame(render);
    }
    render();
}