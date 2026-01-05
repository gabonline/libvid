"""
Video Library Web Application
Flask backend with SQLite database
Enhanced with editing and automatic GIF thumbnail generation
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3
import hashlib
import os
from werkzeug.utils import secure_filename
import uuid
import subprocess
import tempfile
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/videos'
app.config['THUMBNAIL_FOLDER'] = 'uploads/thumbnails'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v'}

# Ensure upload directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['THUMBNAIL_FOLDER'], exist_ok=True)

def init_db():
    """Initialize the database with videos table"""
    conn = sqlite3.connect('video_library.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            genre TEXT NOT NULL,
            description TEXT,
            view_count INTEGER DEFAULT 0,
            file_name TEXT NOT NULL,
            hash TEXT NOT NULL UNIQUE,
            thumbnail_file_name TEXT
        )
    ''')
    conn.commit()
    conn.close()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def calculate_hash(file_path):
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_video_duration(video_path):
    """Get video duration in seconds using ffprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting video duration: {e}")
        return None

def generate_gif_thumbnail(video_path, output_path, num_frames=10):
    """Generate animated GIF thumbnail with key moments from video"""
    try:
        duration = get_video_duration(video_path)
        if not duration or duration < 1:
            return False
        
        # Calculate timestamps for key moments (evenly distributed)
        timestamps = [duration * i / (num_frames + 1) for i in range(1, num_frames + 1)]
        
        # Create temporary directory for frames
        with tempfile.TemporaryDirectory() as temp_dir:
            frame_paths = []
            
            # Extract frames at each timestamp
            for idx, timestamp in enumerate(timestamps):
                frame_path = os.path.join(temp_dir, f'frame_{idx:03d}.png')
                cmd = [
                    'ffmpeg',
                    '-ss', str(timestamp),
                    '-i', video_path,
                    '-vframes', '1',
                    '-vf', 'scale=320:-1',
                    '-y',
                    frame_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, timeout=30)
                if result.returncode == 0 and os.path.exists(frame_path):
                    frame_paths.append(frame_path)
            
            if not frame_paths:
                return False
            
            # Create GIF from frames
            images = []
            for frame_path in frame_paths:
                try:
                    img = Image.open(frame_path)
                    images.append(img.copy())
                    img.close()
                except Exception as e:
                    print(f"Error loading frame {frame_path}: {e}")
            
            if images:
                # Save as animated GIF
                images[0].save(
                    output_path,
                    save_all=True,
                    append_images=images[1:],
                    duration=500,  # 500ms per frame
                    loop=0,
                    optimize=True
                )
                return True
            
        return False
        
    except Exception as e:
        print(f"Error generating GIF thumbnail: {e}")
        return False

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Get all videos with optional filtering"""
    artist = request.args.get('artist', '')
    genre = request.args.get('genre', '')
    search = request.args.get('search', '')
    
    conn = sqlite3.connect('video_library.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    query = 'SELECT * FROM videos WHERE 1=1'
    params = []
    
    if artist:
        query += ' AND artist = ?'
        params.append(artist)
    
    if genre:
        query += ' AND genre = ?'
        params.append(genre)
    
    if search:
        query += ' AND (title LIKE ? OR artist LIKE ? OR description LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
    
    query += ' ORDER BY id DESC'
    
    c.execute(query, params)
    videos = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return jsonify(videos)

@app.route('/api/videos/<int:video_id>', methods=['GET'])
def get_video(video_id):
    """Get single video details"""
    conn = sqlite3.connect('video_library.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM videos WHERE id = ?', (video_id,))
    video = c.fetchone()
    conn.close()
    
    if video:
        return jsonify(dict(video))
    return jsonify({'error': 'Video not found'}), 404

@app.route('/api/videos/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    """Delete a video and its files"""
    conn = sqlite3.connect('video_library.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get video details before deletion
    c.execute('SELECT file_name, thumbnail_file_name FROM videos WHERE id = ?', (video_id,))
    video = c.fetchone()
    
    if not video:
        conn.close()
        return jsonify({'error': 'Video not found'}), 404
    
    # Delete from database
    c.execute('DELETE FROM videos WHERE id = ?', (video_id,))
    conn.commit()
    conn.close()
    
    # Delete video file
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video['file_name'])
    if os.path.exists(video_path):
        try:
            os.remove(video_path)
        except Exception as e:
            print(f"Error deleting video file: {e}")
    
    # Delete thumbnail file
    if video['thumbnail_file_name']:
        thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], video['thumbnail_file_name'])
        if os.path.exists(thumbnail_path):
            try:
                os.remove(thumbnail_path)
            except Exception as e:
                print(f"Error deleting thumbnail file: {e}")
    
    return jsonify({'success': True})

@app.route('/api/videos/<int:video_id>', methods=['PUT'])
def update_video(video_id):
    """Update video information"""
    data = request.json
    title = data.get('title', '').strip()
    artist = data.get('artist', '').strip()
    genre = data.get('genre', '').strip()
    description = data.get('description', '').strip()
    
    if not all([title, artist, genre]):
        return jsonify({'error': 'Title, artist, and genre are required'}), 400
    
    conn = sqlite3.connect('video_library.db')
    c = conn.cursor()
    
    # Check if video exists
    c.execute('SELECT id FROM videos WHERE id = ?', (video_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Video not found'}), 404
    
    # Update video
    c.execute('''
        UPDATE videos 
        SET title = ?, artist = ?, genre = ?, description = ?
        WHERE id = ?
    ''', (title, artist, genre, description, video_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/filters', methods=['GET'])
def get_filters():
    """Get unique artists and genres for filtering"""
    conn = sqlite3.connect('video_library.db')
    c = conn.cursor()
    
    c.execute('SELECT DISTINCT artist FROM videos ORDER BY artist')
    artists = [row[0] for row in c.fetchall()]
    
    c.execute('SELECT DISTINCT genre FROM videos ORDER BY genre')
    genres = [row[0] for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({'artists': artists, 'genres': genres})

@app.route('/api/videos/<int:video_id>/view', methods=['POST'])
def increment_view(video_id):
    """Increment view count for a video"""
    conn = sqlite3.connect('video_library.db')
    c = conn.cursor()
    c.execute('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', (video_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/upload', methods=['POST'])
def upload_video():
    """Upload a new video"""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    title = request.form.get('title', '')
    artist = request.form.get('artist', '')
    genre = request.form.get('genre', '')
    description = request.form.get('description', '')
    
    if not all([title, artist, genre]):
        return jsonify({'error': 'Title, artist, and genre are required'}), 400
    
    if video_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(video_file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Get file extension
    ext = video_file.filename.rsplit('.', 1)[1].lower()
    
    # Save to temporary location first to calculate hash
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{uuid.uuid4()}.{ext}")
    video_file.save(temp_path)
    
    # Calculate hash
    file_hash = calculate_hash(temp_path)
    
    # Generate filename using hash
    unique_filename = f"{file_hash}.{ext}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Check if file with this hash already exists
    if os.path.exists(file_path):
        os.remove(temp_path)
        return jsonify({'error': 'This video already exists in the library'}), 400
    
    # Move file to final location with hash-based name
    os.rename(temp_path, file_path)
    
    # Generate animated GIF thumbnail
    thumbnail_filename = f"{file_hash}.gif"
    thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], thumbnail_filename)
    
    thumbnail_success = generate_gif_thumbnail(file_path, thumbnail_path)
    if not thumbnail_success:
        thumbnail_filename = None
        if os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
    
    # Save to database
    try:
        conn = sqlite3.connect('video_library.db')
        c = conn.cursor()
        c.execute('''
            INSERT INTO videos (title, artist, genre, description, file_name, hash, thumbnail_file_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (title, artist, genre, description, unique_filename, file_hash, thumbnail_filename))
        conn.commit()
        video_id = c.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': video_id})
    except sqlite3.IntegrityError:
        # Duplicate hash - delete uploaded files
        os.remove(file_path)
        if thumbnail_filename and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        return jsonify({'error': 'This video already exists in the library'}), 400

@app.route('/videos/<filename>')
def serve_video(filename):
    """Serve video files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/thumbnails/<filename>')
def serve_thumbnail(filename):
    """Serve thumbnail files"""
    return send_from_directory(app.config['THUMBNAIL_FOLDER'], filename)

if __name__ == '__main__':
    init_db()
    print("="*60)
    print("Video Library Application")
    print("="*60)
    print("Requirements:")
    print("  - FFmpeg must be installed and available in PATH")
    print("  - pip install flask pillow")
    print("="*60)
    app.run(debug=True, host='0.0.0.0', port=5001)