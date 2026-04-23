const fs = require('fs');
const path = require('path');

const projectsDir = 'public/projects';
const categories = fs.readdirSync(projectsDir).filter(f => fs.statSync(path.join(projectsDir, f)).isDirectory());

const result = {};

categories.forEach(cat => {
    const catDir = path.join(projectsDir, cat);
    const files = [];
    
    function walk(dir) {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walk(filePath);
            } else if (file.match(/\.(jpg|jpeg|png|webp|mov|mp4|MOV|MP4|JPG|JPEG|PNG|WEBP)$/)) {
                files.push(filePath.replace('public', ''));
            }
        });
    }
    
    walk(catDir);
    result[cat] = files;
});

console.log(JSON.stringify(result, null, 2));
