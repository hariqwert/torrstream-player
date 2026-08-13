const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('consumetMaintenance: false')) {
    code = code.replace(
        /maintenanceMode: false,/g,
        `maintenanceMode: false,
    consumetMaintenance: false,
    playMaintenance: false,
    playConsumetMaintenance: false,`
    );

    code = code.replace(
        /systemState\.maintenanceMode = !!db\.maintenanceMode;/g,
        `systemState.maintenanceMode = !!db.maintenanceMode;
            systemState.consumetMaintenance = !!db.consumetMaintenance;
            systemState.playMaintenance = !!db.playMaintenance;
            systemState.playConsumetMaintenance = !!db.playConsumetMaintenance;`
    );

    fs.writeFileSync('server.ts', code);
}
