# PDF Portfolio Generator

A Node.js application that generates professional PDF portfolios from a structured directory of projects and images.

## Features

- Automatically generates PDF portfolios from directory structure
- Supports multiple image layouts per page
- Configurable page layouts through simple JSON structure
- Professional typography and spacing
- High-quality image rendering
- Customizable portfolio metadata

## Directory Structure

```
portfolio/
├── project1/
│   ├── project.json
│   ├── image1.jpg
│   ├── image2.jpg
│   └── image3.jpg
├── project2/
│   ├── project.json
│   ├── cover.png
│   └── detail.jpg
└── config.json
```

## Project Configuration

Each project directory must contain a `project.json` file with the following structure:

```json
{
  "title": "Project Title",
  "medium": "Digital Art / Photography / etc.",
  "year": "2024",
  "description": "Brief description of the project and creative process.",
  "images": [
    {
      "name": "image1.jpg",
      "border": true
    },
    "image2.jpg",
    "image3.jpg"
  ],
  "layout": {
    "pages": [
      {
        "type": "info",
        "content": ["title", "medium", "year", "description", "image1.jpg"]
      },
      {
        "type": "gallery",
        "content": ["image2.jpg", "image3.jpg"]
      },
      {
        "type": "full",
        "content": ["image4.jpg"]
      }
    ]
  }
}
```

## Layout Types

- **info**: Title page with project information and optional image
- **gallery**: Multiple images arranged on a single page (smart layout based on aspect ratios)
- **full**: Single full-page image

### Smart Gallery Layouts

The gallery layout automatically determines the best arrangement:
- **Portrait images**: Stacked vertically for better visibility
- **Landscape images**: Placed side-by-side when space allows
- **Multiple images**: Arranged in optimal grid pattern

## Portfolio Configuration

Create a `config.json` in your portfolio root directory:

```json
{
  "title": "Your Name - Portfolio",
  "subtitle": "Creative Work 2024",
  "author": "Your Name",
  "email": "your.email@example.com",
  "website": "www.yourwebsite.com",
  "output": "portfolio.pdf",
  "pageSize": "A4",
  "orientation": "landscape",
  "margin": 30,
  "dpi": 300,
  "fonts": {
    "title": "Helvetica-Bold",
    "heading": "Helvetica",
    "body": "Helvetica",
    "caption": "Helvetica-Oblique"
  },
  "imageBorder": {
    "enabled": false,
    "width": 0.5,
    "color": "#CCCCCC"
  }
}
```

### Configuration Options

- **pageSize**: "A4", "A3", "Letter", etc.
- **orientation**: "portrait" or "landscape" 
- **margin**: Margin size in points (default: 30)
- **dpi**: Image resolution - 300 for print quality, 150 for web-friendly (default: 300)
- **fonts**: Typography configuration (see Font Options below)
- **imageBorder**: Subtle border around images (see Image Border Options below)
- **title/subtitle/author**: Portfolio metadata
- **email/website**: Contact information for cover page

### Font Options

Available built-in fonts:
- **Helvetica** (default body font)
- **Helvetica-Bold** (default title font)
- **Helvetica-Oblique** (default caption font)
- **Times-Roman**
- **Times-Bold**
- **Times-Italic**
- **Courier**
- **Courier-Bold**
- **Courier-Oblique**

Font roles:
- **title**: Project titles and portfolio title
- **heading**: Medium, year, metadata
- **body**: Descriptions and main text
- **caption**: Links and secondary text

### Image Border Options

You can add subtle borders around images to distinguish them from white backgrounds. Borders are **disabled by default** and can be enabled either globally or per-image.

#### Global Border Configuration (config.json)

```json
"imageBorder": {
  "enabled": false,
  "width": 0.5,
  "color": "#CCCCCC"
}
```

- **enabled**: Set to `true` to add borders to all images by default
- **width**: Border thickness in points (0.5 = very subtle, 1.0 = thin, 2.0 = medium)
- **color**: Border color in hex format (e.g., "#CCCCCC" for light gray, "#000000" for black)

#### Per-Image Border Configuration (project.json)

You can enable borders for specific images by using object format in your images array:

```json
"images": [
  {
    "name": "image-with-border.jpg",
    "border": true
  },
  "image-without-border.png"
]
```

**Backward Compatibility**: Both string format (`"image.jpg"`) and object format (`{"name": "image.jpg", "border": true}`) are supported.

#### Recommended Settings

- **Subtle borders**: `"width": 0.5, "color": "#CCCCCC"` - barely visible gray border
- **Thin borders**: `"width": 1.0, "color": "#999999"` - more defined gray border
- **High contrast**: `"width": 1.0, "color": "#000000"` - black border for emphasis

#### Complete Example

Here's a practical example showing mixed border usage in a project.json:

```json
{
  "title": "Digital Art Project",
  "medium": "Digital Installation",
  "year": "2024",
  "description": "Project description here.",
  "images": [
    {
      "name": "screenshot-white-bg.png",
      "border": true
    },
    "photo-dark-background.jpg",
    {
      "name": "diagram-minimal.png", 
      "border": true
    },
    "installation-view.jpg"
  ]
}
```

In this example:
- Screenshots and diagrams with white/light backgrounds get borders for visibility
- Photos and dark images don't need borders

### DPI Settings for Different Use Cases

- **Print Portfolio (300 DPI)**: High quality for professional printing
- **Web Portfolio (150 DPI)**: Smaller file size, faster loading
- **Email/Digital Sharing (72-150 DPI)**: Optimized for digital viewing

## Installation

```bash
npm install
```

## Usage

```bash
# Generate portfolio from current directory
npm start

# Generate portfolio from specific directory
npm start -- --input ./my-portfolio

# Specify output file
npm start -- --output my-portfolio.pdf

# Custom config
npm start -- --config custom-config.json
```

## Dependencies

- **PDFKit**: PDF generation
- **Sharp**: Image processing and optimization
- **Commander**: CLI argument parsing
- **Path**: File system utilities

## Example Output

The generator creates a professional PDF with:
- Cover page with portfolio title and author info
- Project pages with consistent formatting
- High-quality image reproduction
- Proper spacing and typography
- Table of contents (optional)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## License

MIT