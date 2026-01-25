# Video Library Application

A comprehensive web-based video management system similar to YouTube, built with Flask and SQLite. Features automated thumbnail generation, video metadata management, and a clean, modern interface.

## 🎯 Purpose

This application provides a complete solution for organizing and managing a personal or organizational video library. It allows users to upload, catalog, search, and stream videos with automatically generated animated thumbnails and comprehensive metadata tracking.

## ✨ Features

### Core Functionality
- **Video Upload & Management**: Upload videos up to 500MB with automatic metadata extraction
- **Automated Thumbnails**: GIF thumbnails automatically generated from 10 key moments in each video
- **Full CRUD Operations**: Create, Read, Update, and Delete video entries
- **Hash-Based Deduplication**: Prevents duplicate videos using SHA256 hashing
- **Pagination**: Browse large libraries with 36 videos per page

### Video Metadata
- Title, Artist, Genre, Description
- Duration (automatically extracted)
- File size (automatically calculated)
- View count tracking
- File hash (SHA256)
- Thumbnail management

### Search & Filter
- Real-time search across titles, artists, and descriptions
- Filter by artist
- Filter by genre
- Combined search and filter capabilities

### Security
- Input sanitization to prevent XSS attacks
- SQL injection protection via parameterized queries
- File type validation
- File size limits (500MB max)

### User Experience
- Responsive grid layout
- Modal video player
- Inline editing interface
- Animated GIF previews
- Duration overlays on thumbnails
- View count tracking

## 🛠️ Requirements

### System Requirements
- Python 3.7+
- FFmpeg (must be in system PATH)
- 1GB+ available disk space

### Python Dependencies
```bash
pip install flask pillow bleach
```

### Supported Video Formats
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WebM (.webm)
- M4V (.m4v)

## 📦 Installation

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
- Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Add to system PATH

### 2. Install Python Dependencies
```bash
pip install flask pillow bleach
```

### 3. Project Structure
```
video-library/
├── app.py                      # Flask backend application
├── templates/
│   ├── index.html             # Main video library interface
│   └── stats.html             # Statistics dashboard
├── static/
│   ├── style.css              # Main stylesheet
│   ├── script.js              # Main JavaScript
│   └── stats.js               # Statistics JavaScript
├── uploads/
│   ├── videos/                # Video files (auto-created)
│   └── thumbnails/            # GIF thumbnails (auto-created)
├── video_library.db           # SQLite database (auto-created)
└── README.md                  # This file
```

## 🚀 Usage

### Starting the Application
```bash
python app.py
```

The application will start on `http://localhost:5001`

### Uploading Videos
1. Navigate to the main page
2. Fill in video metadata (or leave empty for "Unknown")
3. Select a video file (max 500MB)
4. Click "Upload Video"
5. Wait for upload and thumbnail generation

### Searching & Filtering
- Use the search box for real-time text search
- Select artist or genre from dropdown filters
- Combine search and filters for precise results
- Click "Reset Filters" to clear all filters

### Editing Videos
1. Hover over a video card
2. Click the "✏️ Edit" button
3. Modify title, artist, genre, or description
4. Click "Save Changes"

### Deleting Videos
1. Open the edit modal for a video
2. Scroll to "Danger Zone"
3. Click "Delete Video"
4. Confirm deletion

### Playing Videos
- Click any video card to open the player modal
- Video plays automatically
- View count increments on each play
- Press ESC or click background to close

### Viewing Statistics
Navigate directly to `http://localhost:5001/stats` to view comprehensive library statistics.

## 🗄️ Database Schema

```sql
CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    genre TEXT NOT NULL,
    description TEXT,
    duration REAL,              -- In seconds
    file_size INTEGER,          -- In bytes
    view_count INTEGER DEFAULT 0,
    file_name TEXT NOT NULL,    -- Format: {hash}.{ext}
    hash TEXT NOT NULL UNIQUE,  -- SHA256 hash
    thumbnail_file_name TEXT    -- Format: {hash}.gif
);
```

## 🔒 Security Features

### Input Sanitization
- All user inputs are sanitized using bleach
- HTML tags stripped
- Dangerous patterns removed (script tags, javascript:, onclick)
- Length limits enforced

### File Security
- File type validation
- File size limits
- Secure filename handling
- Hash-based duplicate detection

### SQL Injection Protection
- Parameterized queries throughout
- No string concatenation in SQL

## 🎨 Technical Details

### Thumbnail Generation
- Extracts 10 evenly-spaced frames from video
- Resizes to 320px width (maintains aspect ratio)
- Combines into animated GIF (500ms per frame)
- Optimized for file size

### Video Processing
- Uses FFprobe to extract duration
- Uses FFmpeg to extract frames
- Calculates SHA256 hash for deduplication

### File Naming
- Videos: `{sha256_hash}.{extension}`
- Thumbnails: `{sha256_hash}.gif`
- Ensures no duplicates through hash collision

### Pagination
- 36 videos per page
- Server-side pagination for efficiency
- Smart page number display (max 5 visible)
- First/Last page quick access

## 📊 API Endpoints

### GET `/`
Main video library interface

### GET `/stats`
Statistics dashboard

### GET `/api/videos?page=1&artist=&genre=&search=`
Get paginated video list with optional filters

### GET `/api/videos/<id>`
Get single video details

### POST `/api/videos/<id>/view`
Increment view count

### PUT `/api/videos/<id>`
Update video metadata

### DELETE `/api/videos/<id>`
Delete video and associated files

### POST `/api/upload`
Upload new video with metadata

### GET `/api/filters`
Get unique artists and genres

### GET `/api/stats`
Get library statistics

### GET `/videos/<filename>`
Serve video file

### GET `/thumbnails/<filename>`
Serve thumbnail file

## 🐛 Troubleshooting

### FFmpeg Not Found
```
Error: FFmpeg must be installed and available in PATH
```
**Solution**: Install FFmpeg and ensure it's in your system PATH

### Large File Upload Fails
```
Error: File is too large! Maximum size is 500MB
```
**Solution**: File exceeds 500MB limit. Compress or split the video.

### Duplicate Video Error
```
Error: This video already exists in the library
```
**Solution**: This exact video (by content hash) already exists. The duplicate is prevented.

### Thumbnail Generation Fails
**Solution**: Ensure FFmpeg is properly installed. Check video file integrity. The video will still upload without a thumbnail.

## 📝 Logging

The application logs important events:
- Duplicate upload attempts (with hash)
- Database operations
- Error conditions

Logs format: `YYYY-MM-DD HH:MM:SS - LEVEL - Message`

## 🔧 Configuration

Edit `app.py` to modify:
- `MAX_CONTENT_LENGTH`: Maximum upload size (default: 500MB)
- `ALLOWED_EXTENSIONS`: Supported video formats
- Port number (default: 5001)
- Pagination size (default: 36)

## 🤝 Contributing

This is a personal/organizational tool. Feel free to fork and customize for your needs.

## 📄 License

This project is provided as-is for personal and organizational use.

## 🙏 Acknowledgments

- Flask web framework
- FFmpeg for video processing
- Pillow for image manipulation
- Bleach for input sanitization

## 📞 Support

For issues or questions, refer to the documentation in this README or check:
- FFmpeg documentation: https://ffmpeg.org/documentation.html
- Flask documentation: https://flask.palletsprojects.com/
- Python Pillow: https://pillow.readthedocs.io/

---

**Version**: 1.0.0  
**Last Updated**: January 2026
