const fs = require('fs');

let code = fs.readFileSync('public/hari.js', 'utf8');

if (!code.includes('consumetMaintenanceToggle')) {
    code = code.replace(
        /maintenanceToggle\.checked = !!data\.maintenanceMode;/g,
        `maintenanceToggle.checked = !!data.maintenanceMode;
        if (document.getElementById('consumetMaintenanceToggle')) document.getElementById('consumetMaintenanceToggle').checked = !!data.consumetMaintenance;
        if (document.getElementById('playMaintenanceToggle')) document.getElementById('playMaintenanceToggle').checked = !!data.playMaintenance;
        if (document.getElementById('playConsumetMaintenanceToggle')) document.getElementById('playConsumetMaintenanceToggle').checked = !!data.playConsumetMaintenance;`
    );

    code = code.replace(
        /maintenanceMode: maintenanceToggle\.checked,/g,
        `maintenanceMode: maintenanceToggle.checked,
        consumetMaintenance: document.getElementById('consumetMaintenanceToggle') ? document.getElementById('consumetMaintenanceToggle').checked : false,
        playMaintenance: document.getElementById('playMaintenanceToggle') ? document.getElementById('playMaintenanceToggle').checked : false,
        playConsumetMaintenance: document.getElementById('playConsumetMaintenanceToggle') ? document.getElementById('playConsumetMaintenanceToggle').checked : false,`
    );

    fs.writeFileSync('public/hari.js', code);
}
