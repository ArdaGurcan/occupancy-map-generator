// Get query string params
const params = new URLSearchParams(window.location.search)

const resolution = params.get("tileSize") || 2; // tile size in meters
const EQUATOR_LENGTH = 40075016.7; // in meters
const ROAD_WIDTH = 3; // width of road in meters
const zoomLevel = params.get("zoomLevel") || 18;
const mapSize = { x: 1600, y: 1600 };

// Cosmetics
const palette = ["#FCEDDA", "#EE4E34"];

// Create waypoints
const waypoints = [
    L.latLng(params.get("startLat") || 39.78344042525829, params.get("startLng") || 32.8125),
    L.latLng(params.get("endLat") || 39.7844, params.get("endLng") || 32.81435),
];  

// Calculate tile size in pixels
const tileSize = Math.floor(
    (((resolution * mapSize.x) / 2) * 2 ** zoomLevel) / EQUATOR_LENGTH
);

// Create map and use canvas
const map = L.map("map", {
    preferCanvas: true,
});

// Import map data from OpenStreetMap
const tileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: zoomLevel,
        minZoom: zoomLevel,
        attribution: "© OpenStreetMap",
    }
);

tileLayer.addTo(map);

// Create route
const plan = new L.Routing.plan(
    waypoints,
    (options = {
        draggableWaypoints: true,
    })
);

const control = L.Routing.control({
    waypoints: waypoints,
    show: false,
    lineOptions: {
        addWaypoints: false,
        styles: [
            {
                color: palette[1],
                opacity: 1,
                weight:
                    (((ROAD_WIDTH * mapSize.x) / 2) * 2 ** zoomLevel) /
                    EQUATOR_LENGTH,
            },
        ],
    },
    plan: plan,
});

control.addTo(map);


map.on("moveend", () => {
    generateOccupancyMap();
});

control.on("routeselected", () => {
    generateOccupancyMap();
});


const generateOccupancyMap = () => {
    setTimeout(() => {
        let grid = [];

        let leafletCanvas = $("canvas.leaflet-zoom-animated")[0];
        let leafletCtx = leafletCanvas.getContext("2d");

        let displayCanvas = $("canvas#dest-canvas")[0];
        let displayCtx = displayCanvas.getContext("2d");

        displayCtx.fillStyle = palette[0];
        displayCtx.fillRect(0, 0, mapSize.x, mapSize.y);


        // Get pixels from leaflet map
        let imageData = leafletCtx.getImageData(
            mapSize.x * 0.1,
            mapSize.y * 0.1,
            mapSize.x,
            mapSize.y
        );
        let colors = imageData.data;

        // Arrange 1D color array into 2D occupancy map
        for (let m = 0; m < mapSize.y / tileSize; m++) {
            let row = [];
            for (let n = 0; n < mapSize.x / tileSize; n++) {
                let occupied = false;
                for (let y = 0; y < tileSize; y++) {
                    for (let x = 0; x < tileSize; x++) {
                        // Calculate index from tile and sub-tile coords
                        let i =
                            x * 4 +
                            y * 4 * mapSize.x +
                            n * 4 * tileSize +
                            m * 4 * mapSize.x * tileSize;
                        
                        // If a transparent pixel is found mark tile as occupied
                        if (colors[i + 3] < 50) {
                            occupied = true;
                            break;
                        }
                    }
                    if (occupied) {
                        break;
                    }
                }
                row.push(+occupied);
            }
            grid.push(row);
        }

        displayCtx.fillStyle = palette[1];

        // Display occupancy map
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x]) {
                    displayCtx.fillRect(
                        x * tileSize,
                        y * tileSize,
                        tileSize * 0.8,
                        tileSize * 0.8
                    );
                }
            }
        }
        $('#result')[0].innerHTML = JSON.stringify(grid)
    }, 100);
};
