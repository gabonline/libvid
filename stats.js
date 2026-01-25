// Load and render statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        renderStats(stats);
    } catch (error) {
        document.getElementById('statsContent').innerHTML = 
            '<div class="loading">Error loading statistics: ' + error.message + '</div>';
    }
}

function renderStats(stats) {
    const container = document.getElementById('statsContent');
    
    let html = '';
    
    // Summary cards
    html += '<div class="stats-grid">';
    html += createStatCard('Total Videos', stats.totals.count);
    html += createStatCard('Total Size', stats.totals.total_size_formatted);
    html += createStatCard('Total Duration', stats.totals.total_duration_formatted);
    html += createStatCard('Total Views', stats.totals.total_views);
    html += '</div>';
    
    // Genre distribution
    if (stats.genres && stats.genres.length > 0) {
        html += '<div class="chart-section">';
        html += '<div class="chart-title">Videos by Genre</div>';
        const maxGenreCount = Math.max(...stats.genres.map(g => g.count));
        stats.genres.forEach(genre => {
            const percentage = (genre.count / maxGenreCount * 100);
            html += `
                <div class="chart-bar">
                    <div class="chart-label">${escapeHtml(genre.genre)}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${percentage}%">${genre.count}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Top artists
    if (stats.top_artists && stats.top_artists.length > 0) {
        html += '<div class="chart-section">';
        html += '<div class="chart-title">Top 10 Artists by Video Count</div>';
        const maxArtistCount = Math.max(...stats.top_artists.map(a => a.video_count));
        stats.top_artists.forEach(artist => {
            const percentage = (artist.video_count / maxArtistCount * 100);
            html += `
                <div class="chart-bar">
                    <div class="chart-label">${escapeHtml(artist.artist)}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${percentage}%">${artist.video_count}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Top viewed videos
    if (stats.top_videos && stats.top_videos.length > 0) {
        html += '<div class="table-section">';
        html += '<div class="chart-title">Top 10 Most Viewed Videos</div>';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Title</th><th>Artist</th><th>Genre</th><th>Views</th><th>Duration</th><th>Size</th></tr></thead>';
        html += '<tbody>';
        stats.top_videos.forEach(video => {
            html += `
                <tr>
                    <td>${escapeHtml(video.title)}</td>
                    <td>${escapeHtml(video.artist)}</td>
                    <td>${escapeHtml(video.genre)}</td>
                    <td>${video.view_count}</td>
                    <td>${escapeHtml(video.duration_formatted)}</td>
                    <td>${escapeHtml(video.file_size_formatted)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        html += '</div>';
    }
    
    // Recent uploads
    if (stats.recent_videos && stats.recent_videos.length > 0) {
        html += '<div class="table-section">';
        html += '<div class="chart-title">Recent Uploads (Last 10)</div>';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Title</th><th>Artist</th><th>Genre</th><th>Views</th><th>Duration</th><th>Size</th></tr></thead>';
        html += '<tbody>';
        stats.recent_videos.forEach(video => {
            html += `
                <tr>
                    <td>${escapeHtml(video.title)}</td>
                    <td>${escapeHtml(video.artist)}</td>
                    <td>${escapeHtml(video.genre)}</td>
                    <td>${video.view_count}</td>
                    <td>${escapeHtml(video.duration_formatted)}</td>
                    <td>${escapeHtml(video.file_size_formatted)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        html += '</div>';
    }
    
    // Largest videos
    if (stats.largest_videos && stats.largest_videos.length > 0) {
        html += '<div class="table-section">';
        html += '<div class="chart-title">10 Largest Videos</div>';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Title</th><th>Artist</th><th>Genre</th><th>Size</th><th>Duration</th></tr></thead>';
        html += '<tbody>';
        stats.largest_videos.forEach(video => {
            html += `
                <tr>
                    <td>${escapeHtml(video.title)}</td>
                    <td>${escapeHtml(video.artist)}</td>
                    <td>${escapeHtml(video.genre)}</td>
                    <td>${escapeHtml(video.file_size_formatted)}</td>
                    <td>${escapeHtml(video.duration_formatted)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        html += '</div>';
    }
    
    // Longest videos
    if (stats.longest_videos && stats.longest_videos.length > 0) {
        html += '<div class="table-section">';
        html += '<div class="chart-title">10 Longest Videos</div>';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Title</th><th>Artist</th><th>Genre</th><th>Duration</th><th>Size</th></tr></thead>';
        html += '<tbody>';
        stats.longest_videos.forEach(video => {
            html += `
                <tr>
                    <td>${escapeHtml(video.title)}</td>
                    <td>${escapeHtml(video.artist)}</td>
                    <td>${escapeHtml(video.genre)}</td>
                    <td>${escapeHtml(video.duration_formatted)}</td>
                    <td>${escapeHtml(video.file_size_formatted)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function createStatCard(label, value) {
    return `
        <div class="stat-card">
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', loadStats);