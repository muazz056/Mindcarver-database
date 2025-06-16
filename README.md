# 📊 CSV Database Manager

A full-stack web application for uploading, storing, and managing CSV data with dynamic filtering and search capabilities.

## 🌟 Features

### 📤 CSV Upload & Database Management
- **Drag & Drop Interface**: Easy CSV file upload with visual feedback
- **Smart Table Creation**: Automatically create new database tables based on CSV headers
- **Data Type Detection**: Intelligent detection of column types (INTEGER, REAL, TEXT)
- **Existing Table Integration**: Insert data into existing tables

### 🔍 Dynamic Data Exploration
- **Advanced Filtering**: Auto-generated filter dropdowns for each column based on unique values
- **Global Search**: Search across all columns simultaneously
- **Real-time Updates**: Filters and search update table data instantly
- **Column Sorting**: Click headers to sort data ascending/descending

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Tailwind CSS**: Clean, modern interface with consistent styling
- **Loading States**: Smooth loading indicators and error handling
- **Pagination**: Handle large datasets with built-in pagination

## 🛠️ Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React.js + Tailwind CSS
- **Database**: SQLite
- **Additional Libraries**:
  - React Table (data grid)
  - React Dropzone (file upload)
  - Lucide React (icons)
  - Axios (HTTP client)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

#### Quick Setup (Windows Users)
For Windows users, you can use the provided batch files for easy setup:

1. **Download/Extract the project folder**
2. **Double-click `install-dependencies.bat`** to install all dependencies
3. **Double-click `start-app.bat`** to start the application

#### Manual Setup (All Platforms)

1. **Clone/Download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd csv-database-manager
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This command installs dependencies for both the root project, server, and client.

3. **Start the application**
   ```bash
   npm start
   ```
   This starts both the backend server (port 5000) and frontend (port 3000) simultaneously.

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Setup (Alternative)

If the automated setup doesn't work, you can install dependencies manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..

# Start both servers
npm start
```

## 📋 Usage Guide

### 1. Upload CSV Data

1. Navigate to the **Insert** page (default homepage)
2. **Drag and drop** a CSV file or **click to browse**
3. Choose your action:
   - **Create new table**: Enter a custom table name
   - **Insert into existing table**: Select from available tables
4. Click **"Upload and Process"**

### 2. View and Filter Data

1. Go to the **View** page to see all your tables
2. Click **"View Data"** on any table card
3. Use the powerful filtering system:
   - **Global Search**: Type in the search box to search all columns
   - **Column Filters**: Use dropdown filters for specific columns
   - **Sorting**: Click column headers to sort
   - **Pagination**: Navigate through large datasets

### 3. Data Management

- **Clear Filters**: Use the "Clear Filters" button to reset all filters
- **Multiple Tables**: Create and manage multiple tables from different CSV files
- **Data Persistence**: All data is stored in SQLite and persists between sessions

## 📁 Project Structure

```
csv-database-manager/
├── package.json                 # Root package.json
├── README.md                   # This file
├── server/                     # Backend (Node.js + Express)
│   ├── package.json
│   ├── index.js               # Main server file
│   ├── uploads/               # Temporary CSV storage
│   └── database.sqlite        # SQLite database (auto-created)
├── client/                    # Frontend (React)
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Navigation.js  # Navigation component
│   │   ├── pages/
│   │   │   ├── InsertPage.js  # CSV upload page
│   │   │   ├── ViewPage.js    # Tables list page
│   │   │   └── TableDetailPage.js # Data viewing with filters
│   │   ├── index.js          # React entry point
│   │   ├── App.js            # Main App component
│   │   └── index.css         # Tailwind CSS styles
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
└── sample-data.csv           # Sample CSV for testing
```

## 🔧 API Endpoints

### Tables
- `GET /api/tables` - Get all table names
- `GET /api/tables/:tableName` - Get table data with optional filtering
- `GET /api/tables/:tableName/schema` - Get table column information
- `GET /api/tables/:tableName/columns/:columnName/values` - Get unique values for a column

### Upload
- `POST /api/upload` - Upload CSV and create/insert into table

## 📊 Sample Data

A sample CSV file (`sample-data.csv`) is included for testing. It contains employee data with various column types to demonstrate the application's features.

## 🎯 Key Features Explained

### Intelligent Type Detection
The application automatically detects column types:
- **INTEGER**: Whole numbers
- **REAL**: Decimal numbers  
- **TEXT**: Strings, dates, and mixed content

### Dynamic Filtering System
- **Auto-generated Filters**: Each column gets its own filter dropdown
- **Unique Values**: Filters show only values that exist in the data
- **Real-time Updates**: Filtering happens instantly without page reload
- **Combined Filtering**: Use multiple filters simultaneously

### Responsive Data Table
- **Sorting**: Click any column header to sort
- **Pagination**: Handle thousands of rows efficiently
- **Search Highlighting**: Global search works across all columns
- **Mobile Friendly**: Horizontal scroll on smaller screens

## 🚧 Development

### Adding New Features

The application is designed to be easily extensible:

- **Backend**: Add new API endpoints in `server/index.js`
- **Frontend**: Create new components in `client/src/components/`
- **Styling**: Modify Tailwind classes or add custom CSS in `client/src/index.css`

### Environment Variables

Create a `.env` file in the server directory for custom configuration:

```env
PORT=5000
DB_PATH=./database.sqlite
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

---

**Happy Data Managing! 🎉** 