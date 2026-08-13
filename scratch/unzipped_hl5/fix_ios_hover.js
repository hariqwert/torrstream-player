const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

const script = `
        // Fix iOS double-tap issue on hover elements
        document.addEventListener('touchend', function(e) {
            const card = e.target.closest('.group[onclick]');
            if (card) {
                // If the user was dragging, this won't be a simple tap, 
                // but if they just tapped, we want to force the click.
                // We'll let the native click happen, but wait... 
                // To avoid double firing, we can just remove the group-hover classes dynamically on touchstart.
            }
        });
`;
// Actually, the best way to disable hover effects on touch devices is to use a media query, or to add a "touch" class to the body.
