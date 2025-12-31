/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    turbopack: {
        // Set the root to this directory explicitly
        root: path.join(__dirname),
    },
}

module.exports = nextConfig
