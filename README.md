# libvid
A video library based on Flask, SQLite, HTML

## The file structure should be

video-library/  
├── app.py                      # Flask backend  
├── templates/  
│   └── index.html             # Main HTML template  
├── static/  
│   ├── style.css              # All CSS styling  
│   └── script.js              # All JavaScript  
├── uploads/  
│   ├── videos/                # Video files (hash-named)  
│   └── thumbnails/            # Animated GIF thumbnails  
└── video_library.db           # SQLite database  

## Following setup steps are needed:
* pip install flask
* pip install flask pillow 
* pip install flask pillow bleach

* sudo apt-get update && sudo apt-get install ffmpeg
Or for Mac
* brew install ffmpeg

## API Endpoints:  

GET / - Main page  
GET /api/videos - Get videos with optional filtering (artist, genre, search)  
GET /api/filters - Get unique artists and genres  
POST /api/videos/<id>/view - Increment view count  
POST /api/upload - Upload new video  
