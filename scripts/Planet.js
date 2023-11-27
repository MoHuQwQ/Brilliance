const libbbb = require("libbbb");
const free = new JavaAdapter(Planet, {
    load() {
        this.meshLoader = prov(() => new HexMesh(free, 2));
        this.super$load();
    }
}, "free", Planets.sun, 1);
const sS = require("sectorSize");
sS.planetGrid(free, 1.0);
free.generator = new SerpuloPlanetGenerator();
free.atmosphereColor = Color.valueOf("87CEEB");
free.atmosphereRadIn = 0.21;
free.atmosphereRadOut = 50;
free.localizedName = "投影星球";;
free.visible = true;
free.bloom = false;
free.accessible = true;
free.alwaysUnlocked = true;
free.startSector = 1;
free.orbitRadius = 41;
const maps = new SectorPreset("降落地区", free, 1);
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

