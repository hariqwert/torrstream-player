const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('isSpecificMaintenance')) {
    code = code.replace(
        /\/\/ 3\. MASTER KILL SWITCH: If system is offline, block public access\s+if \(systemState\.status === 'offline' \|\| systemState\.status === 'killed' \|\| systemState\.maintenanceMode\) \{/,
        `// 3. MASTER KILL SWITCH: If system is offline, block public access
    let isSpecificMaintenance = false;
    if (systemState.consumetMaintenance && (req.path === '/consumet.html' || req.path === '/consumet' || req.path === '/')) isSpecificMaintenance = true;
    if (systemState.playMaintenance && req.path === '/play.php') isSpecificMaintenance = true;
    if (systemState.playConsumetMaintenance && req.path === '/play_consumet.php') isSpecificMaintenance = true;

    if (systemState.status === 'offline' || systemState.status === 'killed' || systemState.maintenanceMode || isSpecificMaintenance) {`
    );

    fs.writeFileSync('server.ts', code);
}
