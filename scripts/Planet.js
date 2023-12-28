const libbbb = require("libbbb");
const BrilliancePlanet = new JavaAdapter(Planet, {
    load() {
        this.meshLoader = prov(() => new HexMesh(BrilliancePlanet, 2));
        this.super$load();
    }
}, "BrilliancePlanet", Planets.sun, 1);
const sS = require("sectorSize");
sS.planetGrid(BrilliancePlanet, 1.0);
BrilliancePlanet.generator = new SerpuloPlanetGenerator();
BrilliancePlanet.atmosphereColor = Color.valueOf("87CEEB");
BrilliancePlanet.atmosphereRadIn = 0.21;
BrilliancePlanet.atmosphereRadOut = 50;
BrilliancePlanet.localizedName = "投影星球";;
BrilliancePlanet.visible = true;
BrilliancePlanet.bloom = false;
BrilliancePlanet.accessible = true;
BrilliancePlanet.alwaysUnlocked = true;
BrilliancePlanet.startSector = 1;
BrilliancePlanet.orbitRadius = 41;
const maps = new SectorPreset("降落地区", BrilliancePlanet, 1);
maps.alwaysUnlocked = true;
maps.captureWave = 1;
maps.difficulty = 1;
maps.localizedName = "降落地区";
exports.maps = maps;
libbbb.addToResearch(maps, {
    parent: 'planetaryTerminal',
    objectives: Seq.with(
        new Objectives.SectorComplete(SectorPresets.groundZero))
});

