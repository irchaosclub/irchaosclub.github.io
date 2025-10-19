// next.config.js
const { withContentlayer } = require('next-contentlayer');

module.exports = withContentlayer({
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true
});
