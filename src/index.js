#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const PortfolioGenerator = require('./lib/PortfolioGenerator');

const program = new Command();

program
    .name('pdf-portfolio-generator')
    .description('Generate professional PDF portfolios from directory structure')
    .version('1.0.0')
    .option('-i, --input <path>', 'input portfolio directory', process.cwd())
    .option('-o, --output <file>', 'output PDF file', 'portfolio.pdf')
    .option('-c, --config <file>', 'config file', 'config.json')
    .option('--debug', 'enable debug mode');

program.parse();

const options = program.opts();

async function main() {
    try {
        console.log('🎨 Starting PDF Portfolio Generator...');
        console.log(`📁 Input directory: ${options.input}`);
        console.log(`📄 Output file: ${options.output}`);

        const generator = new PortfolioGenerator({
            inputDir: path.resolve(options.input),
            outputFile: path.resolve(options.output),
            configFile: options.config,
            debug: options.debug
        });

        await generator.generate();

        console.log('✅ Portfolio generated successfully!');
        console.log(`📄 Output: ${path.resolve(options.output)}`);

    } catch (error) {
        console.error('❌ Error generating portfolio:', error.message);
        if (options.debug) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
