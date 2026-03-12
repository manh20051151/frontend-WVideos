 // Remove no-transition class after page load
        window.addEventListener('load', () => {
            document.body.classList.remove('no-transition');
        });
        
        // Dark mode toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        
        function setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
        }
        
        function updateThemeIcon() {
            if (document.body.classList.contains('dark-mode')) {
                themeIcon.className = 'fas fa-sun';
            } else {
                themeIcon.className = 'fas fa-moon';
            }
        }
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark-mode');
                setCookie('mode', isDark ? 'dark' : 'light', 365);
                updateThemeIcon();
            });
            updateThemeIcon();
        }
        
        // Video Preview Functionality
        document.addEventListener('DOMContentLoaded', function() {
            const videoThumbnails = document.querySelectorAll('.video-thumbnail[data-preview]');
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            videoThumbnails.forEach(function(thumbnail) {
                const previewUrl = thumbnail.getAttribute('data-preview');
                const videoElement = thumbnail.querySelector('.video-preview');
                const videoLink = thumbnail.closest('a');
                
                if (!videoElement || !previewUrl || !videoLink) return;
                
                let isPlaying = false;
                
                function playVideo() {
                    if (!isPlaying) {
                        if (!videoElement.src) {
                            videoElement.src = previewUrl;
                        }
                        videoElement.classList.add('active');
                        const playPromise = videoElement.play();
                        
                        if (playPromise !== undefined) {
                            playPromise.then(function() {
                                isPlaying = true;
                            }).catch(function(error) {
                                console.log('Video play error:', error);
                                videoElement.classList.remove('active');
                            });
                        }
                    }
                }
                
                function stopVideo() {
                    if (isPlaying) {
                        videoElement.pause();
                        videoElement.currentTime = 0;
                        videoElement.classList.remove('active');
                        isPlaying = false;
                    }
                }
                
                if (isMobile) {
                    videoLink.addEventListener('click', function(e) {
                        if (!isPlaying) {
                            e.preventDefault();
                            playVideo();
                        }
                    });
                    
                    let scrollTimer;
                    window.addEventListener('scroll', function() {
                        clearTimeout(scrollTimer);
                        scrollTimer = setTimeout(function() {
                            videoThumbnails.forEach(function(thumb) {
                                const vid = thumb.querySelector('.video-preview');
                                if (vid && !vid.paused) {
                                    vid.pause();
                                    vid.currentTime = 0;
                                    vid.classList.remove('active');
                                }
                            });
                            isPlaying = false;
                        }, 100);
                    });
                } else {
                    thumbnail.addEventListener('mouseenter', playVideo);
                    thumbnail.addEventListener('mouseleave', stopVideo);
                }
            });
        });
        
        // Tags toggle
        function toggleTags() {
            const tagsContent = document.getElementById('tagsContent');
            const arrow = document.getElementById('arrow');
            
            if (tagsContent.classList.contains('active')) {
                tagsContent.classList.remove('active');
                arrow.innerHTML = '▼';
            } else {
                tagsContent.classList.add('active');
                arrow.innerHTML = '▲';
            }
        }