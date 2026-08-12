const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let code = fs.readFileSync(filePath, 'utf8');

// Ensure logo image uses /stalker_pro_logo.png
code = code.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
code = code.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');

// Ensure Top 10 is placed right after Hero Spotlight Slider in Home View
const homeViewStart = code.indexOf('<section id="view-home"');
const homeViewEnd = code.indexOf('</section>', homeViewStart);

if (homeViewStart !== -1 && homeViewEnd !== -1) {
    let homeHtml = code.substring(homeViewStart, homeViewEnd);

    // Extract Top 10 block if found
    const top10Start = homeHtml.indexOf('<!-- Top 10 Today Shelf -->');
    let top10Block = '';
    if (top10Start !== -1) {
        const top10End = homeHtml.indexOf('<!-- Continue Watching Shelf -->', top10Start);
        if (top10End !== -1) {
            top10Block = homeHtml.substring(top10Start, top10End);
            // Remove from original position
            homeHtml = homeHtml.substring(0, top10Start) + homeHtml.substring(top10End);
        }
    }

    // Insert Top 10 right after Hero Slider Container
    const heroSliderEnd = homeHtml.indexOf('</div>', homeHtml.indexOf('id="heroSliderContainer"')) + 6;
    if (heroSliderEnd !== -1 && top10Block) {
        homeHtml = homeHtml.substring(0, heroSliderEnd) + '\n' + top10Block + '\n' + homeHtml.substring(heroSliderEnd);
        code = code.substring(0, homeViewStart) + homeHtml + code.substring(homeViewEnd);
    }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Reordered Top 10 Today to top of Home section in consumet.html');
