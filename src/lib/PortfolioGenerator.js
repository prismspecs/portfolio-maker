const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

class PortfolioGenerator {
    constructor(options) {
        this.inputDir = options.inputDir;
        this.outputFile = options.outputFile;
        this.configFile = options.configFile;
        this.debug = options.debug;
        this.config = {};
        this.projects = [];
    }

    async generate() {
        await this.loadConfig();
        await this.loadProjects();
        await this.createPDF();
    }

    async loadConfig() {
        const configPath = path.join(this.inputDir, this.configFile);

        try {
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            console.warn(`⚠️  Config file not found, using defaults: ${configPath}`);
            this.config = {
                title: 'Portfolio',
                subtitle: 'Creative Work',
                author: 'Artist',
                email: '',
                website: '',
                output: 'portfolio.pdf',
                pageSize: 'A4',
                margin: 50
            };
        }

        if (this.debug) {
            console.log('📋 Config loaded:', this.config);
        }
    }

    async loadProjects() {
        const entries = await fs.readdir(this.inputDir, { withFileTypes: true });
        const projectDirs = entries.filter(entry => entry.isDirectory());

        for (const dir of projectDirs) {
            const projectPath = path.join(this.inputDir, dir.name);
            const projectJsonPath = path.join(projectPath, 'project.json');

            try {
                const projectData = await fs.readFile(projectJsonPath, 'utf8');
                const project = JSON.parse(projectData);
                project.path = projectPath;
                project.directory = dir.name;

                // Validate and process images
                await this.processProjectImages(project);

                this.projects.push(project);

                if (this.debug) {
                    console.log(`📁 Loaded project: ${project.title}`);
                }
            } catch (error) {
                console.warn(`⚠️  Skipping directory ${dir.name}: ${error.message}`);
            }
        }

        console.log(`📚 Loaded ${this.projects.length} projects`);
    }

    async processProjectImages(project) {
        const processedImages = [];

        for (const imageItem of project.images || []) {
            // Support both string format and object format
            let imageName, imageConfig;
            if (typeof imageItem === 'string') {
                imageName = imageItem;
                imageConfig = {}; // No special config
            } else {
                imageName = imageItem.name || imageItem.file;
                imageConfig = imageItem;
            }

            const imagePath = path.join(project.path, imageName);

            try {
                await fs.access(imagePath);

                // Get image metadata
                const metadata = await sharp(imagePath).metadata();

                processedImages.push({
                    name: imageName,
                    path: imagePath,
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    border: imageConfig.border || false // Per-image border setting
                });
            } catch (error) {
                console.warn(`⚠️  Image not found: ${imagePath}`);
            }
        }

        project.processedImages = processedImages;
    }

    async createPDF() {
        // Set DPI for print quality (300 DPI for print, 150 DPI for web-friendly)
        const dpi = this.config.dpi || 300;

        const doc = new PDFDocument({
            size: this.config.pageSize || 'A4',
            layout: this.config.orientation || 'landscape',
            margins: {
                top: this.config.margin || 30,
                bottom: this.config.margin || 30,
                left: this.config.margin || 30,
                right: this.config.margin || 30
            },
            pdfVersion: '1.4',
            compress: true,
            info: {
                Title: this.config.title || 'Portfolio',
                Author: this.config.author || 'Artist',
                Subject: 'Creative Portfolio',
                Creator: 'PDF Portfolio Generator'
            }
        });

        // Pipe PDF to file
        doc.pipe(require('fs').createWriteStream(this.outputFile));

        // Generate cover page
        await this.createCoverPage(doc);

        // Generate project pages
        for (const project of this.projects) {
            await this.createProjectPages(doc, project);
        }

        // Finalize PDF
        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', resolve);
            doc.on('error', reject);
        });
    }

    createCoverPage(doc) {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = this.config.margin || 30;

        // Font configuration
        const fonts = this.config.fonts || {
            title: 'Helvetica-Bold',
            heading: 'Helvetica',
            body: 'Helvetica',
            caption: 'Helvetica-Oblique'
        };

        // Title
        doc.fontSize(36)
            .font(fonts.title)
            .text(this.config.title, margin, pageHeight / 3, {
                width: pageWidth - (margin * 2),
                align: 'center'
            });

        // Subtitle
        if (this.config.subtitle) {
            doc.fontSize(18)
                .font(fonts.heading)
                .text(this.config.subtitle, margin, doc.y + 20, {
                    width: pageWidth - (margin * 2),
                    align: 'center'
                });
        }

        // Author info - positioned higher to prevent spillover
        const authorY = pageHeight - (margin * 5); // More space from bottom
        doc.fontSize(12)
            .font(fonts.body)
            .text(this.config.author, margin, authorY, {
                width: pageWidth - (margin * 2),
                align: 'center'
            });

        if (this.config.email) {
            doc.text(this.config.email, margin, doc.y + 15, {
                width: pageWidth - (margin * 2),
                align: 'center'
            });
        }

        if (this.config.website) {
            doc.text(this.config.website, margin, doc.y + 15, {
                width: pageWidth - (margin * 2),
                align: 'center'
            });
        }

        doc.addPage();
    }

    async createProjectPages(doc, project) {
        if (!project.layout || !project.layout.pages) {
            // Default layout: info page + gallery pages
            await this.createDefaultProjectLayout(doc, project);
            return;
        }

        for (const page of project.layout.pages) {
            await this.createProjectPage(doc, project, page);
            doc.addPage();
        }
    }

    async createDefaultProjectLayout(doc, project) {
        // Info page
        await this.createInfoPage(doc, project);
        doc.addPage();

        // Gallery pages
        const images = project.processedImages || [];
        for (let i = 0; i < images.length; i += 2) {
            const pageImages = images.slice(i, i + 2);
            await this.createGalleryPage(doc, pageImages);
            if (i + 2 < images.length) {
                doc.addPage();
            }
        }
    }

    async createProjectPage(doc, project, page) {
        switch (page.type) {
            case 'info':
                await this.createInfoPageFromLayout(doc, project, page);
                break;
            case 'gallery':
                const galleryImages = page.content
                    .filter(item => item.endsWith('.jpg') || item.endsWith('.png') || item.endsWith('.jpeg'))
                    .map(imageName => project.processedImages.find(img => img.name === imageName))
                    .filter(Boolean);
                await this.createGalleryPage(doc, galleryImages);
                break;
            case 'full':
                const fullImage = project.processedImages.find(img => img.name === page.content[0]);
                if (fullImage) {
                    await this.createFullPage(doc, fullImage);
                }
                break;
        }
    }

    createInfoPage(doc, project) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;

        // Project title
        doc.fontSize(24)
            .font('Helvetica-Bold')
            .text(project.title, margin, margin + 20);

        // Medium and year
        let mediumYearText = `${project.medium} • ${project.year}`;
        if (project.duration) {
            mediumYearText += ` • ${project.duration}`;
        }
        doc.fontSize(14)
            .font('Helvetica')
            .text(mediumYearText, margin, doc.y + 20);

        // Additional credits
        if (project.collective || project.curator || project.publisher) {
            let creditsText = '';
            if (project.collective) creditsText += `Collective: ${project.collective}`;
            if (project.curator) creditsText += `Curator: ${project.curator}`;
            if (project.publisher) creditsText += `Published by: ${project.publisher}`;

            doc.fontSize(12)
                .font('Helvetica-Oblique')
                .text(creditsText, margin, doc.y + 15);
        }

        // Description
        if (project.description) {
            doc.fontSize(12)
                .font('Helvetica')
                .text(project.description, margin, doc.y + 30, {
                    width: pageWidth - (margin * 2),
                    align: 'left'
                });
        }

        // Link
        if (project.link) {
            doc.fontSize(10)
                .font('Helvetica-Oblique')
                .text(project.link, margin, doc.y + 20, {
                    width: pageWidth - (margin * 2),
                    align: 'left'
                });
        }
    }

    async createInfoPageFromLayout(doc, project, page) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Check if this layout has an image - if so, use two-column layout for landscape
        const hasImage = page.content.some(item => item.match(/\.(jpg|jpeg|png)$/i));
        const isLandscape = pageWidth > pageHeight;

        if (hasImage && isLandscape) {
            // Two-column layout: text on left, image on right
            await this.createTwoColumnInfoPage(doc, project, page);
        } else {
            // Single column layout
            await this.createSingleColumnInfoPage(doc, project, page);
        }
    }

    async createSingleColumnInfoPage(doc, project, page) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        let currentY = margin + 20;

        // Font configuration
        const fonts = this.config.fonts || {
            title: 'Helvetica-Bold',
            heading: 'Helvetica',
            body: 'Helvetica',
            caption: 'Helvetica-Oblique'
        };

        for (const item of page.content) {
            switch (item) {
                case 'title':
                    doc.fontSize(24).font(fonts.title);
                    doc.text(project.title, margin, currentY);
                    currentY = doc.y + 20;
                    break;
                case 'medium':
                    doc.fontSize(14).font(fonts.heading);
                    let mediumText = project.medium;
                    if (project.duration) {
                        mediumText += ` • ${project.duration}`;
                    }
                    doc.text(mediumText, margin, currentY);
                    currentY = doc.y + 10;
                    break;
                case 'year':
                    doc.fontSize(14).font(fonts.heading);
                    doc.text(project.year, margin, currentY);
                    currentY = doc.y + 10;
                    break;
                case 'credits':
                    if (project.collective || project.curator || project.publisher) {
                        doc.fontSize(12).font(fonts.caption);
                        let creditsText = '';
                        if (project.collective) creditsText += `Collective: ${project.collective}\n`;
                        if (project.curator) creditsText += `Curator: ${project.curator}\n`;
                        if (project.publisher) creditsText += `Published by: ${project.publisher}`;

                        doc.text(creditsText.trim(), margin, currentY);
                        currentY = doc.y + 15;
                    }
                    break;
                case 'description':
                    doc.fontSize(12).font(fonts.body);
                    doc.text(project.description, margin, currentY, {
                        width: pageWidth - (margin * 2)
                    });
                    currentY = doc.y + 20;
                    break;
                case 'link':
                    if (project.link) {
                        doc.fontSize(10).font(fonts.caption);
                        doc.text(project.link, margin, currentY, {
                            width: pageWidth - (margin * 2)
                        });
                        currentY = doc.y + 15;
                    }
                    break;
                default:
                    // Assume it's an image
                    if (item.match(/\.(jpg|jpeg|png)$/i)) {
                        const image = project.processedImages.find(img => img.name === item);
                        if (image) {
                            // Calculate appropriate image height based on available space
                            const remainingHeight = pageHeight - currentY - margin;
                            const maxImageHeight = Math.min(
                                remainingHeight * 0.6, // Use up to 60% of remaining space
                                pageHeight * 0.4, // Or 40% of total page height
                                400 // But never more than 400 pixels
                            );

                            await this.addImageToPage(doc, image, margin, currentY, pageWidth - (margin * 2), maxImageHeight);
                            currentY += maxImageHeight + 20;
                        }
                    }
            }
        }
    }

    async createTwoColumnInfoPage(doc, project, page) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Font configuration
        const fonts = this.config.fonts || {
            title: 'Helvetica-Bold',
            heading: 'Helvetica',
            body: 'Helvetica',
            caption: 'Helvetica-Oblique'
        };

        // Define column layout
        const columnGap = 40;
        const textColumnWidth = (pageWidth - (margin * 2) - columnGap) * 0.45; // 45% for text
        const imageColumnWidth = (pageWidth - (margin * 2) - columnGap) * 0.55; // 55% for image
        const imageColumnX = margin + textColumnWidth + columnGap;

        // First, calculate total text height to center it vertically
        let textHeight = 0;
        const lineSpacing = {
            title: 44 + 20,  // fontSize + spacing
            medium: 14 + 10,
            year: 14 + 10,
            description: 0,  // Will calculate dynamically
            link: 10 + 15
        };

        // Calculate description height
        doc.fontSize(12).font(fonts.body);
        const descriptionHeight = doc.heightOfString(project.description, {
            width: textColumnWidth
        });

        // Calculate total height
        for (const item of page.content) {
            if (item.match(/\.(jpg|jpeg|png)$/i)) continue;

            switch (item) {
                case 'title':
                    textHeight += lineSpacing.title;
                    break;
                case 'medium':
                    textHeight += lineSpacing.medium;
                    break;
                case 'year':
                    textHeight += lineSpacing.year;
                    break;
                case 'description':
                    textHeight += descriptionHeight + 20;
                    break;
                case 'link':
                    if (project.link) textHeight += lineSpacing.link;
                    break;
            }
        }

        // Center text vertically
        const availableHeight = pageHeight - (margin * 2);
        let currentY = margin + (availableHeight - textHeight) / 2;

        // Find the image item
        const imageItem = page.content.find(item => item.match(/\.(jpg|jpeg|png)$/i));

        // Render text content in left column
        for (const item of page.content) {
            if (item.match(/\.(jpg|jpeg|png)$/i)) continue; // Skip image for now

            switch (item) {
                case 'title':
                    doc.fontSize(24).font(fonts.title);
                    doc.text(project.title, margin, currentY, {
                        width: textColumnWidth
                    });
                    currentY = doc.y + 20;
                    break;
                case 'medium':
                    doc.fontSize(14).font(fonts.heading);
                    let mediumText = project.medium;
                    if (project.duration) {
                        mediumText += ` • ${project.duration}`;
                    }
                    doc.text(mediumText, margin, currentY, {
                        width: textColumnWidth
                    });
                    currentY = doc.y + 10;
                    break;
                case 'year':
                    doc.fontSize(14).font(fonts.heading);
                    doc.text(project.year, margin, currentY, {
                        width: textColumnWidth
                    });
                    currentY = doc.y + 10;
                    break;
                case 'description':
                    doc.fontSize(12).font(fonts.body);
                    doc.text(project.description, margin, currentY, {
                        width: textColumnWidth
                    });
                    currentY = doc.y + 20;
                    break;
                case 'link':
                    if (project.link) {
                        doc.fontSize(10).font(fonts.caption);
                        doc.text(project.link, margin, currentY, {
                            width: textColumnWidth
                        });
                        currentY = doc.y + 15;
                    }
                    break;
            }
        }

        // Render image in right column (already centered vertically)
        if (imageItem) {
            const image = project.processedImages.find(img => img.name === imageItem);
            if (image) {
                const imageHeight = pageHeight - (margin * 3); // Use most of the page height
                await this.addImageToPage(doc, image, imageColumnX, margin + 20, imageColumnWidth, imageHeight);
            }
        }
    } async createGalleryPage(doc, images) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        if (images.length === 1) {
            // Single image, centered
            await this.addImageToPage(doc, images[0], margin, margin, availableWidth, availableHeight);
        } else if (images.length === 2) {
            // Always stack two images vertically for better visual impact
            // This gives each image more space and looks more professional
            const imageHeight = (availableHeight - 20) / 2;
            await this.addImageToPage(doc, images[0], margin, margin, availableWidth, imageHeight);
            await this.addImageToPage(doc, images[1], margin, margin + imageHeight + 20, availableWidth, imageHeight);
        } else {
            // Multiple images in grid
            const cols = Math.ceil(Math.sqrt(images.length));
            const rows = Math.ceil(images.length / cols);
            const imageWidth = (availableWidth - (20 * (cols - 1))) / cols;
            const imageHeight = (availableHeight - (20 * (rows - 1))) / rows;

            for (let i = 0; i < images.length; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = margin + (col * (imageWidth + 20));
                const y = margin + (row * (imageHeight + 20));

                await this.addImageToPage(doc, images[i], x, y, imageWidth, imageHeight);
            }
        }
    }

    async createFullPage(doc, image) {
        const margin = this.config.margin || 30;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        await this.addImageToPage(doc, image, margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
    }

    async addImageToPage(doc, image, x, y, maxWidth, maxHeight) {
        try {
            // Calculate dimensions maintaining aspect ratio
            const aspectRatio = image.width / image.height;
            let width = maxWidth;
            let height = maxWidth / aspectRatio;

            if (height > maxHeight) {
                height = maxHeight;
                width = maxHeight * aspectRatio;
            }

            // Center the image in the available space
            const centerX = x + (maxWidth - width) / 2;
            const centerY = y + (maxHeight - height) / 2;

            // Process image for optimal DPI
            const dpi = this.config.dpi || 300;
            const targetWidth = Math.round(width * dpi / 72); // Convert points to pixels
            const targetHeight = Math.round(height * dpi / 72);

            // Only resize if we need to optimize for web or if image is much larger
            let imagePath = image.path;
            if (dpi < 300 || (image.width > targetWidth * 2)) {
                try {
                    const processedBuffer = await sharp(image.path)
                        .resize(targetWidth, targetHeight, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .jpeg({ quality: dpi >= 300 ? 95 : 85 })
                        .toBuffer();

                    // Use the processed buffer directly
                    doc.image(processedBuffer, centerX, centerY, {
                        width: width,
                        height: height
                    });
                } catch (sharpError) {
                    // Fallback to original image if processing fails
                    doc.image(image.path, centerX, centerY, {
                        width: width,
                        height: height
                    });
                }
            } else {
                // Use original image
                doc.image(image.path, centerX, centerY, {
                    width: width,
                    height: height
                });
            }

            // Add border if configured (per-image setting takes precedence over global setting)
            const borderConfig = this.config.imageBorder;
            const shouldDrawBorder = image.border || (borderConfig && borderConfig.enabled);
            
            if (shouldDrawBorder) {
                const borderWidth = borderConfig?.width || 0.5;
                const borderColor = borderConfig?.color || '#CCCCCC';

                doc.save()
                    .lineWidth(borderWidth)
                    .strokeColor(borderColor)
                    .rect(centerX, centerY, width, height)
                    .stroke()
                    .restore();
            }

            if (this.debug) {
                console.log(`🖼️  Added image: ${image.name} (${Math.round(width)}x${Math.round(height)}) DPI: ${dpi}${shouldDrawBorder ? ' [BORDER]' : ''}`);
            }
        } catch (error) {
            console.error(`❌ Error adding image ${image.name}:`, error.message);
        }
    }
}

module.exports = PortfolioGenerator;
