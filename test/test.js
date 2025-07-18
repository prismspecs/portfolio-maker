const PortfolioGenerator = require('../src/lib/PortfolioGenerator');
const path = require('path');

async function test() {
    console.log('🧪 Running test generation...');

    const generator = new PortfolioGenerator({
        inputDir: path.join(__dirname, '../examples'),
        outputFile: path.join(__dirname, '../test-output.pdf'),
        configFile: 'config.json',
        debug: true
    });

    try {
        await generator.generate();
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

test();
