const fs = require('fs');

let code = fs.readFileSync('src/routes/admin.ts', 'utf8');

code = code.replace(
    /const \{ maintenanceMode, activeTemplate, maintenanceMusicMode, maintenanceMusicQuery, maintenanceMusicPlaylist \} = req\.body;/g,
    `const { maintenanceMode, activeTemplate, maintenanceMusicMode, maintenanceMusicQuery, maintenanceMusicPlaylist, consumetMaintenance, playMaintenance, playConsumetMaintenance } = req.body;
    db.consumetMaintenance = !!consumetMaintenance;
    db.playMaintenance = !!playMaintenance;
    db.playConsumetMaintenance = !!playConsumetMaintenance;`
);

code = code.replace(
    /systemState\.maintenanceMusicPlaylist = db\.maintenanceMusicPlaylist \|\| \[\];/g,
    `systemState.maintenanceMusicPlaylist = db.maintenanceMusicPlaylist || [];
    systemState.consumetMaintenance = db.consumetMaintenance || false;
    systemState.playMaintenance = db.playMaintenance || false;
    systemState.playConsumetMaintenance = db.playConsumetMaintenance || false;`
);

code = code.replace(
    /maintenanceMode: db\.maintenanceMode,/g,
    `maintenanceMode: db.maintenanceMode,
        consumetMaintenance: db.consumetMaintenance,
        playMaintenance: db.playMaintenance,
        playConsumetMaintenance: db.playConsumetMaintenance,`
);

// We need to also patch the get /maintenance route
code = code.replace(
    /maintenanceMode: db\.maintenanceMode \|\| false,/g,
    `maintenanceMode: db.maintenanceMode || false,
        consumetMaintenance: db.consumetMaintenance || false,
        playMaintenance: db.playMaintenance || false,
        playConsumetMaintenance: db.playConsumetMaintenance || false,`
);

fs.writeFileSync('src/routes/admin.ts', code);
