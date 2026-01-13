let videos = [];
let filters = { artists: [], genres: [] };
let currentPage = 1;
let pagination = null;

// Load filters
async function loadFilters() {
    const response = await fetch('/api/filters');
    filters = await response.json();
    
    const artistSelect = document.getElementById('artistFilter');
    const genreSelect = document.getElementById('genreFilter');
    
    artistSelect.innerHTML = '<option value="">All Artists</option>';
    filters.artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist;
        option.textContent = artist;
        artistSelect.appendChild(option);
    });
    
    genreSelect.innerHTML = '<option value="">All Genres</option>';
    filters.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

// Load videos
async function loadVideos(page = 1) {
    const search = document.getElementById('searchInput').value;
    const artist = document.getElementById('artistFilter').value;
    const genre = document.getElementById('genreFilter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (artist) params.append('artist', artist);
    if (genre) params.append('genre', genre);
    params.append('page', page);
    
    const response = await fetch(`/api/videos?${params}`);
    const data = await response.json();
    
    videos = data.videos;
    pagination = data.pagination;
    currentPage = page;
    
    renderVideos();
    renderPagination();
}

// Render videos
function renderVideos() {
    const grid = document.getElementById('videoGrid');
    
    if (videos.length === 0) {
        grid.innerHTML = '<div class="no-results">No videos found</div>';
        return;
    }
    
    grid.innerHTML = videos.map(video => `
        <div class="video-card">
            <button class="edit-btn" onclick="openEditModal(${video.id}); event.stopPropagation();">✏️ Edit</button>
            <div onclick="playVideo(${video.id})">
                <div class="video-thumbnail">
                    ${video.thumbnail_file_name 
                        ? `<img src="/thumbnails/${video.thumbnail_file_name}" alt="${escapeHtml(video.title)}">` 
                        : '▶'
                    }
                    ${video.duration_formatted ? `<div class="video-duration">${escapeHtml(video.duration_formatted)}</div>` : ''}
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title)}</div>
                    <div class="video-meta">Artist: ${escapeHtml(video.artist)}</div>
                    <div class="video-meta">Genre: ${escapeHtml(video.genre)}</div>
                    ${video.description ? `<div class="video-description">${escapeHtml(video.description)}</div>` : ''}
                    <div class="video-views">${video.view_count} views • ${escapeHtml(video.file_size_formatted || 'Unknown size')}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render pagination
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    
    if (!pagination || pagination.total_pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    html += `<div class="pagination-info">Page ${pagination.current_page} of ${pagination.total_pages} (${pagination.total_count} videos)</div>`;
    html += '<div class="pagination-buttons">';
    
    // Previous button
    if (pagination.has_prev) {
        html += `<button onclick="loadVideos(${pagination.current_page - 1})" class="pagination-btn">← Previous</button>`;
    } else {
        html += `<button disabled class="pagination-btn">← Previous</button>`;
    }
    
    // Page numbers
    const maxPages = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.total_pages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // First page
    if (startPage > 1) {
        html += `<button onclick="loadVideos(1)" class="pagination-btn">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.current_page) {
            html += `<button class="pagination-btn active">${i}</button>`;
        } else {
            html += `<button onclick="loadVideos(${i})" class="pagination-btn">${i}</button>`;
        }
    }
    
    // Last page
    if (endPage < pagination.total_pages) {
        if (endPage < pagination.total_pages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button onclick="loadVideos(${pagination.total_pages})" class="pagination-btn">${pagination.total_pages}</button>`;
    }
    
    // Next button
    if (pagination.has_next) {
        html += `<button onclick="loadVideos(${pagination.current_page + 1})" class="pagination-btn">Next →</button>`;
    } else {
        html += `<button disabled class="pagination-btn">Next →</button>`;
    }
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Play video
async function playVideo(id) {
    const video = videos.find(v => v.id === id);
    if (!video) return;
    
    // Increment view count
    await fetch(`/api/videos/${id}/view`, { method: 'POST' });
    
    // Update modal
    const metaText = `${video.artist} • ${video.genre} • ${video.view_count + 1} views • ${video.duration_formatted || 'Unknown duration'} • ${video.file_size_formatted || 'Unknown size'}`;
    document.getElementById('modalTitle').textContent = video.title;
    document.getElementById('modalMeta').innerHTML = 
        metaText + (video.description ? `<br><br>${escapeHtml(video.description)}` : '');
    
    const player = document.getElementById('videoPlayer');
    player.src = `/videos/${video.file_name}`;
    
    document.getElementById('videoModal').classList.add('active');
}

// Close video modal
function closeModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    player.pause();
    player.src = '';
    modal.classList.remove('active');
    
    loadVideos(); // Refresh to show updated view count
}

// Open edit modal
async function openEditModal(id) {
    const response = await fetch(`/api/videos/${id}`);
    const video = await response.json();
    
    if (video.error) {
        showMessage('Error loading video details', 'error', 'editMessage');
        return;
    }
    
    document.getElementById('editVideoId').value = video.id;
    document.getElementById('editTitle').value = video.title;
    document.getElementById('editArtist').value = video.artist;
    document.getElementById('editGenre').value = video.genre;
    document.getElementById('editDescription').value = video.description || '';
    
    document.getElementById('editMessage').innerHTML = '';
    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editForm').reset();
}

// Handle edit form submission
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const videoId = document.getElementById('editVideoId').value;
        const data = {
            title: document.getElementById('editTitle').value,
            artist: document.getElementById('editArtist').value,
            genre: document.getElementById('editGenre').value,
            description: document.getElementById('editDescription').value
        };
        
        try {
            const response = await fetch(`/api/videos/${videoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Video updated successfully!', 'success', 'editMessage');
                setTimeout(() => {
                    closeEditModal();
                    loadFilters();
                    loadVideos();
                }, 1500);
            } else {
                showMessage(result.error || 'Update failed', 'error', 'editMessage');
            }
        } catch (error) {
            showMessage('Update failed: ' + error.message, 'error', 'editMessage');
        }
    });

    // Upload video
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const videoFile = document.getElementById('uploadVideo').files[0];
        
        // Check file size (500MB limit)
        const maxSize = 500 * 1024 * 1024; // 500MB in bytes
        if (videoFile && videoFile.size > maxSize) {
            showMessage(`File is too large! Maximum size is 500MB. Your file is ${(videoFile.size / (1024 * 1024)).toFixed(1)}MB.`, 'error', 'uploadMessage');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', document.getElementById('uploadTitle').value);
        formData.append('artist', document.getElementById('uploadArtist').value);
        formData.append('genre', document.getElementById('uploadGenre').value);
        formData.append('description', document.getElementById('uploadDescription').value);
        formData.append('video', videoFile);
        
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading & Generating Thumbnail...';
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Video uploaded successfully! Animated GIF thumbnail has been generated.', 'success', 'uploadMessage');
                document.getElementById('uploadForm').reset();
                await loadFilters();
                await loadVideos();
            } else {
                showMessage(result.error || 'Upload failed', 'error', 'uploadMessage');
            }
        } catch (error) {
            showMessage('Upload failed: ' + error.message, 'error', 'uploadMessage');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Video';
        }
    });

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', () => {
        currentPage = 1;
        loadVideos(1);
    });
    document.getElementById('artistFilter').addEventListener('change', () => {
        currentPage = 1;
        loadVideos(1);
    });
    document.getElementById('genreFilter').addEventListener('change', () => {
        currentPage = 1;
        loadVideos(1);
    });

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeEditModal();
        }
    });

    // Close modals on background click
    document.getElementById('videoModal').addEventListener('click', (e) => {
        if (e.target.id === 'videoModal') closeModal();
    });

    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });

    // Initialize
    loadFilters();
    loadVideos(1);
});

// Confirm delete
function confirmDelete() {
    const videoId = document.getElementById('editVideoId').value;
    const title = document.getElementById('editTitle').value;
    
    if (confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone and will permanently remove the video and its thumbnail.`)) {
        deleteVideo(videoId);
    }
}

// Delete video
async function deleteVideo(videoId) {
    try {
        const response = await fetch(`/api/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Video deleted successfully!', 'success', 'editMessage');
            setTimeout(() => {
                closeEditModal();
                loadFilters();
                loadVideos();
            }, 1500);
        } else {
            showMessage(result.error || 'Delete failed', 'error', 'editMessage');
        }
    } catch (error) {
        showMessage('Delete failed: ' + error.message, 'error', 'editMessage');
    }
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('artistFilter').value = '';
    document.getElementById('genreFilter').value = '';
    currentPage = 1;
    loadVideos(1);
}

// Show message
function showMessage(text, type, elementId = 'uploadMessage') {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}