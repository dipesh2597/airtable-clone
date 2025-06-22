# Airtable Clone

A real-time collaborative spreadsheet application built with React and FastAPI, featuring live collaboration, data validation, and Excel import/export capabilities.

## Features

- **Real-time Collaboration**: Multiple users can edit simultaneously with live updates
- **Data Validation**: Automatic type detection and validation for dates, numbers, emails, etc.
- **Excel Integration**: Import/export Excel files with full formatting
- **CSV Support**: Import/export CSV files
- **Live User Presence**: See who's currently editing with color-coded cursors
- **Responsive Design**: Works on desktop and mobile devices
- **Formula Support**: Basic spreadsheet formulas (SUM, AVERAGE, etc.)

## Tech Stack

- **Frontend**: React, Socket.IO Client, Tailwind CSS
- **Backend**: FastAPI, Python Socket.IO, OpenPyXL, Pandas
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Render

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.11+
- Git

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd AirtableClone
```

2. **Start the Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

3. **Start the Frontend**
```bash
cd frontend
npm install
npm start
```

4. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Deployment

### Backend (Render)

1. **Sign up for Render**
   - Go to [render.com](https://render.com/)
   - Create a free account

2. **Deploy the Backend**
   - Create a new "Web Service"
   - Connect your GitHub repository
   - Set the root directory to `/backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `python main.py`
   - Environment: Python 3

3. **Get your backend URL**
   - Render will provide a URL like: `https://airtable-clone-backend.onrender.com`

### Frontend (Vercel)

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Create a free account

2. **Deploy the Frontend**
   - Import your GitHub repository
   - Set the root directory to `/frontend`
   - Vercel will automatically detect it's a React app

3. **Configure Environment Variables**
   - In your Vercel project settings, add:
   ```
   REACT_APP_BACKEND_URL=https://airtable-clone-backend.onrender.com
   REACT_APP_WS_URL=wss://airtable-clone-backend.onrender.com
   ```

4. **Deploy**
   - Vercel will automatically deploy and provide a URL

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /api/spreadsheet` - Get current spreadsheet data
- `POST /api/spreadsheet/save` - Save spreadsheet
- `POST /api/spreadsheet/load` - Load spreadsheet
- `GET /api/spreadsheet/list` - List saved spreadsheets
- `POST /api/spreadsheet/import-csv` - Import CSV data
- `GET /api/spreadsheet/export-csv` - Export as CSV

## Socket.IO Events

- `join_spreadsheet` - Join a spreadsheet session
- `cell_update` - Update a cell value
- `cell_selection` - Select a cell
- `row_operation` - Add/delete rows
- `column_operation` - Add/delete columns
- `sort_operation` - Sort data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 