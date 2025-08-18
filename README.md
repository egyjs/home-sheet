# Home Sheet - Text to JSON Parser

A React application for parsing structured text into JSON format and displaying it as formatted tables. Perfect for converting inventory lists, pricing data, or any structured text data into organized tables with totals and percentages.

## Features

- **Text Parser**: Converts structured text with Arabic/English mixed content into JSON
- **Interactive Tables**: Displays parsed data in formatted tables with subtotals and percentages
- **Cloud Storage**: Save and load documents using Firebase Firestore
- **Document Management**: Create, update, delete, and share documents
- **Export Options**: Copy JSON to clipboard or download as JSON/CSV files
- **Arabic Support**: Handles Arabic numerals and text content
- **Responsive Design**: Built with Tailwind CSS for mobile-friendly interface
- **Shareable Links**: Generate links to share documents with others

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions):
   - Create a Firebase project
   - Enable Firestore database
   - Copy your config to `src/firebase.js` or use environment variables
4. (Optional) Create `.env.local` file with your Firebase config:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

1. **Input Text**: Enter your structured text in the left textarea. Use the format:
   ```
   Section Name
   Item Name: Value
   Another Item: Value
   ---
   Next Section
   Item: Value
   ```

2. **View JSON**: The parsed JSON structure appears in the right panel

3. **Export Data**: Use the buttons to:
   - Copy JSON to clipboard
   - Download JSON file
   - Download CSV file

4. **View Tables**: Scroll down to see formatted tables with:
   - Item names and values
   - Percentage of each item within its section
   - Section subtotals
   - Grand total

5. **Save & Load**: Use the database features to:
   - **Save**: Store your documents in the cloud
   - **Load**: Access previously saved documents
   - **Share**: Generate shareable links for collaboration
   - **Update**: Modify existing documents

## Text Format

The parser recognizes:
- **Section headers**: Lines without colons become section names
- **Items**: Lines with format "Name: Value"
- **Separators**: Lines with dashes (`---`) separate sections
- **Arabic numerals**: Automatically converted to standard numbers
- **Empty lines**: Ignored during parsing

## Technologies Used

- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase Firestore**: NoSQL cloud database for data storage
- **JavaScript**: Modern ES6+ features

## Project Structure

```
src/
├── App.jsx          # Main application component with database integration
├── main.jsx         # Application entry point
├── firebase.js      # Firebase configuration
├── database.js      # Database service functions
└── index.css        # Tailwind CSS imports
```

## License

This project is open source and available under the [MIT License](LICENSE).
