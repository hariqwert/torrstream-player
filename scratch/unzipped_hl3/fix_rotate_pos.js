const fs = require('fs');

function fixPos(file) {
    let code = fs.readFileSync(file, 'utf8');

    // Introduce original styles to restore them correctly
    if (!code.includes('window.originalContainerStyles = null;')) {
        code = code.replace(
            /window\.currentRotation = 0;/,
            "window.currentRotation = 0;\n        window.originalContainerStyles = null;"
        );
    }

    code = code.replace(
        /if \(!playerContainer\) return;\n            window\.currentRotation = \(window\.currentRotation \+ 90\) % 360;\s*if \(window\.currentRotation === 90 \|\| window\.currentRotation === 270\) \{/g,
        `if (!playerContainer) return;
            if (!window.originalContainerStyles) {
                window.originalContainerStyles = {
                    position: playerContainer.style.position || window.getComputedStyle(playerContainer).position,
                    width: playerContainer.style.width || window.getComputedStyle(playerContainer).width,
                    height: playerContainer.style.height || window.getComputedStyle(playerContainer).height,
                    top: playerContainer.style.top || window.getComputedStyle(playerContainer).top,
                    left: playerContainer.style.left || window.getComputedStyle(playerContainer).left,
                    zIndex: playerContainer.style.zIndex || window.getComputedStyle(playerContainer).zIndex
                };
            }
            window.currentRotation = (window.currentRotation + 90) % 360;
            
            if (window.currentRotation === 90 || window.currentRotation === 270) {`
    );

    code = code.replace(
        /\} else \{\s*playerContainer\.style\.width = '100%';\s*playerContainer\.style\.height = '100%';\s*playerContainer\.style\.position = 'relative';\s*playerContainer\.style\.top = 'auto';\s*playerContainer\.style\.left = 'auto';\s*playerContainer\.style\.transform = `rotate\(\$\{window\.currentRotation\}deg\)`;\s*playerContainer\.style\.zIndex = 'auto';\s*\}/g,
        `} else {
                playerContainer.style.width = window.originalContainerStyles.width;
                playerContainer.style.height = window.originalContainerStyles.height;
                playerContainer.style.position = window.originalContainerStyles.position;
                playerContainer.style.top = window.originalContainerStyles.top;
                playerContainer.style.left = window.originalContainerStyles.left;
                playerContainer.style.transform = \`rotate(\${window.currentRotation}deg)\`;
                playerContainer.style.zIndex = window.originalContainerStyles.zIndex;
            }`
    );

    fs.writeFileSync(file, code);
}

fixPos('play.php');
fixPos('play_consumet.php');
