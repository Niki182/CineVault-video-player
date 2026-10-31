document.querySelectorAll('.video-container').forEach((container) => {
    const videoPlayer = container.querySelector('#video-custom-player');
    const playButton = container.querySelector('#play-button');
    const currentTimeElement = container.querySelector('#current-time');
    const endTimeElement = container.querySelector('#end-time');
    const seekSlider = container.querySelector('#seek-slider');
    const loader = container.querySelector('#video-loader');
    const replayButton = container.querySelector('#replay-button');
    const videoReplayOverlay = container.querySelector('#video-overlay');
    const volumeControl = container.querySelector('#volume-control');
    const fullScreenBtn = container.querySelector('#fullscreen-button');
    const PictoPicBtn = container.querySelector('#picture-in-picture-button');
    const vidSlider = container.querySelector('.vid-slider');
    const volumeSlider = container.querySelector('.volume-slider');
    const playbackSpeed = container.querySelector('#playback-speed');
    const customControls = container.querySelector('.controls');
    
    const controlsDisplay = customControls ? window.getComputedStyle(customControls).display : '';
    let customControlsVisible = customControls
        ? !customControls.hidden && controlsDisplay !== 'none'
        : false;
    const updateFullscreenVideoSize = () => {
        if (document.fullscreenElement !== container) return;
        const controlsVisible = customControls ? customControlsVisible : videoPlayer.controls;
        const videoHeight = controlsVisible ? 'calc(100vh - 64px)' : '100vh';
        videoPlayer.style.height = videoHeight;
        videoPlayer.style.maxHeight = videoHeight;
    };

    if (!videoPlayer) {
        console.warn('Video player element not found in video container.');
        return;
    }

    if (fullScreenBtn) {
        
        const fullscreenTarget = container;
        const originalFullscreenStyles = {
            containerDisplay: fullscreenTarget.style.display,
            containerPosition: fullscreenTarget.style.position,
            containerWidth: fullscreenTarget.style.width,
            containerHeight: fullscreenTarget.style.height,
            videoHeight: videoPlayer.style.height,
            videoWidth: videoPlayer.style.width,
            videoMaxHeight: videoPlayer.style.maxHeight,
            videoObjectFit: videoPlayer.style.objectFit
        };

        fullScreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement === fullscreenTarget) {
                if (document.exitFullscreen) {
                    fullScreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    document.exitFullscreen().catch((error) => console.warn('Exiting fullscreen failed:', error));
                }
                return;
            }

            if (typeof fullscreenTarget.requestFullscreen !== 'function') {
                console.warn('Fullscreen is not supported by this browser.');
                return;
            }

            videoPlayer.controls = false;
            fullScreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            fullscreenTarget.requestFullscreen().catch((error) => {
                console.warn('Entering fullscreen failed:', error);
            });
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === fullscreenTarget) {
                fullscreenTarget.style.display = 'block';
                fullscreenTarget.style.position = 'relative';
                fullscreenTarget.style.width = '100vw';
                fullscreenTarget.style.height = '100vh';
                videoPlayer.style.display = 'block';
                videoPlayer.style.width = '100%';
                videoPlayer.style.objectFit = 'contain';
                videoPlayer.controls = false;
                updateFullscreenVideoSize();
            } else {
                fullscreenTarget.style.display = originalFullscreenStyles.containerDisplay;
                fullscreenTarget.style.position = originalFullscreenStyles.containerPosition;
                fullscreenTarget.style.width = originalFullscreenStyles.containerWidth;
                fullscreenTarget.style.height = originalFullscreenStyles.containerHeight;
                videoPlayer.style.height = originalFullscreenStyles.videoHeight;
                videoPlayer.style.width = originalFullscreenStyles.videoWidth;
                videoPlayer.style.maxHeight = originalFullscreenStyles.videoMaxHeight;
                videoPlayer.style.objectFit = originalFullscreenStyles.videoObjectFit;
                videoPlayer.style.display = '';
            }
        });
    }

    if (PictoPicBtn) {
        const supportsPictureInPicture =
            typeof videoPlayer.requestPictureInPicture === 'function' &&
            typeof document.exitPictureInPicture === 'function';
        PictoPicBtn.disabled = !supportsPictureInPicture;

        if (supportsPictureInPicture) {
            PictoPicBtn.addEventListener('click', () => {
                const pictureInPicturePromise = document.pictureInPictureElement === videoPlayer
                    ? document.exitPictureInPicture()
                    : videoPlayer.requestPictureInPicture();

                pictureInPicturePromise.catch((error) => {
                    console.warn('Picture-in-picture failed:', error);
                });
            });
        }
    }

    if (playbackSpeed) {
        const updatePlaybackSpeed = () => {
            const speed = Number(playbackSpeed.value);
            if (Number.isFinite(speed) && speed > 0) {
                videoPlayer.playbackRate = speed;
            }
        };

        playbackSpeed.addEventListener('input', updatePlaybackSpeed);
        playbackSpeed.addEventListener('change', updatePlaybackSpeed);
        updatePlaybackSpeed();
    }

    const formatTime = (time) => {
        if (!Number.isFinite(time)) return '0:00';
        const totalSeconds = Math.floor(time);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return hours > 0
            ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            : `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    let isSeeking = false;
    const updateTimes = () => {
        if (currentTimeElement) {
            currentTimeElement.textContent = formatTime(videoPlayer.currentTime);
        }
        if (endTimeElement) {
            endTimeElement.textContent = formatTime(videoPlayer.duration);
        }
        if (seekSlider) {
            const duration = videoPlayer.duration;
            const min = Number(seekSlider.min) || 0;
            const max = Number(seekSlider.max) || 100;
            const progress = Number.isFinite(duration) && duration > 0
                ? videoPlayer.currentTime / duration
                : 0;
            if (!isSeeking) {
                
                seekSlider.value = String(min + progress * (max - min));
            }
            if (vidSlider) {
                const sliderProgress = isSeeking && max > min
                    ? (Number(seekSlider.value) - min) / (max - min)
                    : progress;
                const percentage = Math.max(0, Math.min(100, sliderProgress * 100));
                vidSlider.style.background = `linear-gradient(to right, var(--vid-slider-fill-color, currentColor) ${percentage}%, var(--video-slider-track-color, currentColor) ${percentage}%)`;
            }
        }
    };


    if (seekSlider) {
        seekSlider.addEventListener('input', () => {
            isSeeking = true;
            const duration = videoPlayer.duration;
            if (!Number.isFinite(duration) || duration <= 0) return;

            const min = Number(seekSlider.min) || 0;
            const max = Number(seekSlider.max) || 100;
            if (max <= min) return;
            const progress = (Number(seekSlider.value) - min) / (max - min);
            videoPlayer.currentTime = Math.max(0, Math.min(1, progress)) * duration;
            updateTimes();
        });
        seekSlider.addEventListener('change', () => {
            isSeeking = false;
            updateTimes();
        });
    }

    if (volumeControl) {
        const minValue = Number(volumeControl.min);
        const maxValue = Number(volumeControl.max);
        const min = Number.isFinite(minValue) ? minValue : 0;
        const max = Number.isFinite(maxValue) && maxValue > min ? maxValue : 100;
        const updateVolumeControl = () => {
            const volume = videoPlayer.muted ? 0 : Math.max(0, Math.min(1, videoPlayer.volume));
            const percentage = volume * 100;
            volumeControl.value = String(min + volume * (max - min));
            volumeSlider.style.background = `linear-gradient(to right, var(--volume-slider-fill-color, currentColor) ${percentage}%, var(--volume-slider-track-color, rgba(128, 128, 128, 0.35)) ${percentage}%)`;
        };

        volumeControl.addEventListener('input', () => {
            const value = Number(volumeControl.value);
            if (!Number.isFinite(value)) return;
            videoPlayer.volume = Math.max(0, Math.min(1, (value - min) / (max - min)));
            videoPlayer.muted = videoPlayer.volume === 0;
        });
        videoPlayer.addEventListener('volumechange', updateVolumeControl);
        updateVolumeControl();
    }

    if (playButton) {
        playButton.addEventListener('click', () => {
            if (videoPlayer.paused) {
                const playPromise = videoPlayer.play();
                if (playPromise) playPromise.catch((error) => console.warn('Video playback failed:', error));
            } else {
                videoPlayer.pause();
            }
        });

        if (!container.hasAttribute('tabindex')) container.tabIndex = 0;
        document.addEventListener('keydown', (event) => {
            if (!container.contains(event.target) && document.fullscreenElement !== container) return;
            if (event.code !== 'Space' && event.key !== ' ') return;
            const focusedControl = event.target.closest?.('button, input, select, textarea, a, [contenteditable="true"], [contenteditable=""], [role="slider"]');
            const controlsStyle = customControls ? window.getComputedStyle(customControls) : null;
            const controlsAreHidden = customControls && (
                !customControlsVisible ||
                customControls.hidden ||
                controlsStyle.display === 'none' ||
                controlsStyle.visibility === 'hidden' ||
                Number(controlsStyle.opacity) === 0
            );
            if (event.repeat || (focusedControl && !controlsAreHidden)) return;
            event.preventDefault();

            if (videoPlayer.paused) {
                const playPromise = videoPlayer.play();
                if (playPromise) playPromise.catch((error) => console.warn('Video playback failed:', error));
            } else {
                videoPlayer.pause();
            }
        });

        const updatePlayButton = () => {
            playButton.innerHTML = videoPlayer.paused
                ? '<i class="fas fa-play"></i>'
                : '<i class="fas fa-pause"></i>';
        };
        

        videoPlayer.addEventListener('play', updatePlayButton);
        videoPlayer.addEventListener('pause', updatePlayButton);
        updatePlayButton();
    }

    if (loader || videoReplayOverlay) {
        const setLoaderVisible = (visible) => {
            if (loader) loader.hidden = !visible;
            if (videoReplayOverlay) videoReplayOverlay.hidden = !visible;
        };

        videoPlayer.addEventListener('waiting', () => setLoaderVisible(true));
        videoPlayer.addEventListener('seeking', () => setLoaderVisible(true));
        videoPlayer.addEventListener('seeked', () => setLoaderVisible(false));
        videoPlayer.addEventListener('canplay', () => setLoaderVisible(false));
        videoPlayer.addEventListener('playing', () => setLoaderVisible(false));
        videoPlayer.addEventListener('error', () => setLoaderVisible(false));
        setLoaderVisible(false);
    }

    if (replayButton) {
        replayButton.hidden = true;
        if (videoReplayOverlay) videoReplayOverlay.hidden = true;

        videoPlayer.addEventListener('ended', () => {
            if (playButton) playButton.innerHTML = '<i class="fas fa-play"></i>';
            replayButton.hidden = false;
            if (videoReplayOverlay) videoReplayOverlay.hidden = false;
        });

        videoPlayer.addEventListener('seeking', () => {
            if (videoPlayer.currentTime < videoPlayer.duration) {
                replayButton.hidden = true;
            }
        });

        replayButton.addEventListener('click', () => {
            videoPlayer.currentTime = 0;
            const playPromise = videoPlayer.play();
            if (playPromise) playPromise.catch((error) => console.warn('Video playback failed:', error));
            replayButton.hidden = true;
            if (videoReplayOverlay) videoReplayOverlay.hidden = true;
        });

        videoPlayer.addEventListener('play', () => {
            replayButton.hidden = true;
            if (videoReplayOverlay) videoReplayOverlay.hidden = true;
        });
    }

    if (videoPlayer.hasAttribute('controls') && playButton) {
        videoPlayer.controls = false;
    }
    
    const videoPlayerVersion = '1.0.1';
    const videoPlayerName = 'CineVault';
    const videoContextMenu = document.createElement('div');
    videoContextMenu.setAttribute('role', 'menu');
    videoContextMenu.setAttribute('aria-label', 'Video options');
    videoContextMenu.style.cssText = 'position:fixed;z-index:10000;display:none;min-width:170px;padding:2px;background:#000;color:#fff;border:2px solid rgba(255,255,255,.18);border-radius:7px;box-shadow:0 4px 14px rgba(0,0,0,.35);font:14px sans-serif;';
    document.body.appendChild(videoContextMenu);

    const closeVideoContextMenu = () => {
        videoContextMenu.style.display = 'none';
    };

    const showVideoContextMenu = (event) => {
        event.preventDefault();
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        const menuContainer = fullscreenElement || document.body;
        if (videoContextMenu.parentElement !== menuContainer) {
            menuContainer.appendChild(videoContextMenu);
        }
        videoContextMenu.replaceChildren();

        const addMenuItem = (label, action, selected = false) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.setAttribute('role', 'menuitem');
            item.textContent = `${selected ? '✓ ' : ''}${label}`;
            item.style.cssText = 'display:block;width:100%;padding:7px 7px;border:0;border-radius:4px;background:#000;color:inherit;text-align:left;font:inherit;cursor:pointer;';
            item.addEventListener('mouseenter', () => { item.style.background = 'rgba(255, 255, 255, 0.15)'; });
            item.addEventListener('mouseleave', () => { item.style.background = '#000'; });
            item.addEventListener('click', () => {
                closeVideoContextMenu();
                action();
            });
            videoContextMenu.appendChild(item);
        };

        addMenuItem(videoPlayer.paused ? 'Play' : 'Pause', () => {
            if (videoPlayer.paused) {
                const playPromise = videoPlayer.play();
                if (playPromise) playPromise.catch((error) => console.warn('Video playback failed:', error));
            } else {
                videoPlayer.pause();
            }
        });
        addMenuItem(videoPlayer.muted ? 'Unmute' : 'Mute', () => { videoPlayer.muted = !videoPlayer.muted; }, videoPlayer.muted);

        const divider = document.createElement('div');
        divider.style.cssText = 'height:1px;margin:5px 4px;background:rgba(255,255,255,.2);';
        videoContextMenu.appendChild(divider);
        addMenuItem('Loop', () => { videoPlayer.loop = !videoPlayer.loop; }, videoPlayer.loop);
        addMenuItem('Show all controls', () => {
            if (customControls) {
                customControlsVisible = !customControlsVisible;
                customControls.hidden = !customControlsVisible;
                customControls.style.setProperty(
                    'display',
                    customControlsVisible ? (controlsDisplay === 'none' ? 'flex' : controlsDisplay) : 'none',
                    'important'
                );
            } else {
                videoPlayer.controls = !videoPlayer.controls;
            }
            updateFullscreenVideoSize();
        }, customControls ? customControlsVisible : videoPlayer.controls);
        addMenuItem('Download video', () => {
            const source = videoPlayer.currentSrc || videoPlayer.src;
            if (!source) return;

            const downloadLink = document.createElement('a');
            downloadLink.href = source;
            try {
                const pathname = new URL(source, document.baseURI).pathname;
                downloadLink.download = decodeURIComponent(pathname.split('/').pop()) || 'video';
            } catch (error) {
                downloadLink.download = 'video';
            }
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();
        });
        const bottomDivider = document.createElement('div');
        bottomDivider.style.cssText = 'height:1px;margin:5px 4px;background:rgba(255,255,255,.2);';
        videoContextMenu.appendChild(bottomDivider);

        const versionLabel = document.createElement('div');
        versionLabel.textContent = `${videoPlayerName} Video Player Version ${videoPlayerVersion}`;
        versionLabel.style.cssText = 'padding:5px 7px;color:rgba(255,255,255,.7);font:12px sans-serif;';
        videoContextMenu.appendChild(versionLabel);
        
        videoContextMenu.style.display = 'block';
        
        const bounds = videoContextMenu.getBoundingClientRect();
        videoContextMenu.style.left = `${Math.max(0, Math.min(event.clientX, window.innerWidth - bounds.width))}px`;
        videoContextMenu.style.top = `${Math.max(0, Math.min(event.clientY, window.innerHeight - bounds.height))}px`;
    };

    videoPlayer.addEventListener('contextmenu', showVideoContextMenu);
    document.addEventListener('click', (event) => {
        if (!videoContextMenu.contains(event.target)) closeVideoContextMenu();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeVideoContextMenu();
    });
    
    videoPlayer.addEventListener('timeupdate', updateTimes);
    videoPlayer.addEventListener('loadedmetadata', updateTimes);
    videoPlayer.addEventListener('durationchange', updateTimes);
    updateTimes();
});
