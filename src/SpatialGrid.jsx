class SpatialGrid {
  constructor(windowDimensions, boidCount) {
    this.width = windowDimensions.width;
    this.height = windowDimensions.height;
    this.cellSize = this.getCellSize(windowDimensions, boidCount);
    this.cols = Math.ceil(windowDimensions.width / this.cellSize);
    this.rows = Math.ceil(windowDimensions.height / this.cellSize);
    this.grid = Array.from({ length: this.cols * this.rows }, () => []);
    this.patternId = `spatialGrid-${Math.random().toString(36).substr(2, 9)}`;
  }
  visualizeGrid(windowDimensions) {
    return (
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
        width={windowDimensions.width}
        height={windowDimensions.height}
      >
        <defs>
          <pattern
            id={this.patternId}
            width={this.cellSize}
            height={this.cellSize}
            patternUnits="userSpaceOnUse"
          >
            
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${this.patternId})`} />
      </svg>
    );
  }
  getCellSize(windowDimensions, boidCount = 190) {
    const perceptionRadius = 50;
    const screenArea = windowDimensions.width * windowDimensions.height;
    const density = boidCount / screenArea;
    let cellSize;

    if (density > 0.1) {
      cellSize = perceptionRadius * 0.8; // Smaller cells
    } else {
      cellSize = perceptionRadius * 1.2; // Larger cells
    }
    return cellSize;
  }
  clear() {
    this.grid.forEach((cell) => (cell.length = 0));
  }

  insert(boid) {
    const col = Math.floor(boid.position.x / this.cellSize);
    const row = Math.floor(boid.position.z / this.cellSize);
    const index = row * this.cols + col;

    if (index >= 0 && index < this.grid.length) {
      this.grid[index].push(boid);
    }
  }

  getNearbyBoids(boid) {
    const col = Math.floor(boid.position.x / this.cellSize);
    const row = Math.floor(boid.position.z / this.cellSize);
    const nearby = [];

    // Check surrounding cells
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const checkCol = col + i;
        const checkRow = row + j;
        const index = checkRow * this.cols + checkCol;

        if (index >= 0 && index < this.grid.length) {
          nearby.push(...this.grid[index]);
        }
      }
    }

    return nearby;
  }
}
export default SpatialGrid;
