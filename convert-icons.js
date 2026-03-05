const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svgDir = path.join(__dirname, 'src', 'assets', 'img', 'action-icons');

fs.readdirSync(svgDir)
    .filter(f => f.endsWith('.svg'))
    .forEach(file => {
        const svgData = fs.readFileSync(path.join(svgDir, file), 'utf8');
        const resvg = new Resvg(svgData, {
            fitTo: { mode: 'width', value: 24 },
            background: 'rgba(0,0,0,0)'
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        const outFile = path.join(svgDir, file.replace('.svg', '.png'));
        fs.writeFileSync(outFile, pngBuffer);
        console.log('Created: ' + outFile);
    });
