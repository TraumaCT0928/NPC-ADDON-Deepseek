import { world, system } from "@minecraft/server";

const CONFIG = {
    pursuitDistance: 30,
    attackDistance: 12,
    checkInterval: 10
};

class DroidekaManager {
    constructor() {
        this.droidekas = new Map();
        this.init();
        this.startLoop();
    }

    init() {
        for (const player of world.getPlayers()) {
            const droidekas = player.dimension.getEntities({ type: "totr:droideka" });
            for (const d of droidekas) this.register(d);
        }

        world.afterEvents.entitySpawn.subscribe((event) => {
            if (event.entity.typeId === "totr:droideka") this.register(event.entity);
        });
    }

    register(entity) {
        if (this.droidekas.has(entity.id)) return;

        this.droidekas.set(entity.id, {
            entity: entity,
            isRolled: false
        });

        entity.setProperty("totr:is_rolled", false);
        entity.triggerEvent("totr:unroll");
    }

    findNearestTarget(entity) {
        let nearest = null;
        let nearestDist = Infinity;

        const players = entity.dimension.getPlayers({
            location: entity.location,
            maxDistance: 64
        });

        for (const player of players) {
            const dist = this.getDistance(entity.location, player.location);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = player;
            }
        }

        return { target: nearest, distance: nearestDist };
    }

    getDistance(loc1, loc2) {
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        const dz = loc1.z - loc2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    update(data) {
        const entity = data.entity;
        if (!entity || !entity.isValid()) {
            this.droidekas.delete(entity.id);
            return;
        }

        const { target, distance } = this.findNearestTarget(entity);
        const isRolled = entity.getProperty("totr:is_rolled") === true;

        if (target) {
            if (distance > CONFIG.pursuitDistance && !isRolled) {
                entity.triggerEvent("totr:roll");
                entity.setProperty("totr:is_rolled", true);
            }
            else if (distance <= CONFIG.attackDistance && isRolled) {
                entity.triggerEvent("totr:unroll");
                entity.setProperty("totr:is_rolled", false);
            }
        }
        else if (isRolled) {
            entity.triggerEvent("totr:unroll");
            entity.setProperty("totr:is_rolled", false);
        }
    }

    startLoop() {
        system.runInterval(() => {
            for (const [id, data] of this.droidekas) {
                this.update(data);
            }
        }, CONFIG.checkInterval);
    }
}

let manager = null;
world.afterEvents.worldInitialize.subscribe(() => {
    manager = new DroidekaManager();
    console.log("§a[Droideka] Система запущена!");
});