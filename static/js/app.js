class ImageGenerator {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File upload listeners
        this.setupFileUpload('input');
        this.setupFileUpload('mask');
        
        // Drag and drop
        this.setupDragAndDrop('input');
        this.setupDragAndDrop('mask');
        
        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateImage();
        });
        
        // Randomize seed button
        document.getElementById('random-seed').addEventListener('click', () => {
            this.randomizeSeed();
        });
        
        // Download button
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadImage();
        });
        
        // New generation button
        document.getElementById('new-generation-btn').addEventListener('click', () => {
            this.resetForm();
        });

        // Gallery listeners
        document.getElementById('gallery-btn').addEventListener('click', () => {
            this.openGallery();
        });
        document.getElementById('close-gallery-btn').addEventListener('click', () => {
            this.closeGallery();
        });
        
        // Make functions globally accessible for inline onclick
        this.addGlobalFunctions();
    }

    setupFileUpload(type) {
        const fileInput = document.getElementById(`${type}-file`);
        const uploadZone = document.getElementById(`${type}-upload`);
        const placeholder = document.getElementById(`${type}-placeholder`);
        const preview = document.getElementById(`${type}-preview`);
        const img = document.getElementById(`${type}-img`);
        const filename = document.getElementById(`${type}-filename`);

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file, type, placeholder, preview, img, filename);
            }
        });

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    setupDragAndDrop(type) {
        const uploadZone = document.getElementById(`${type}-upload`);
        const fileInput = document.getElementById(`${type}-file`);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.add('border-accent-blue', 'bg-accent-blue/5');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => {
                uploadZone.classList.remove('border-accent-blue', 'bg-accent-blue/5');
            });
        });

        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                this.handleFileUpload(file, type, 
                    document.getElementById(`${type}-placeholder`),
                    document.getElementById(`${type}-preview`),
                    document.getElementById(`${type}-img`),
                    document.getElementById(`${type}-filename`)
                );
                
                // Update file input
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
            }
        });
    }

    handleFileUpload(file, type, placeholder, preview, img, filename) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB');
            return;
        }

        // Show preview with animation
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            filename.textContent = file.name;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
            preview.classList.add('fade-in');
        };
        reader.readAsDataURL(file);
    }

    clearImage(type) {
        const fileInput = document.getElementById(`${type}-file`);
        const placeholder = document.getElementById(`${type}-placeholder`);
        const preview = document.getElementById(`${type}-preview`);
        
        fileInput.value = '';
        placeholder.classList.remove('hidden');
        preview.classList.add('hidden');
    }

    adjustValue(id, delta) {
        const input = document.getElementById(id);
        const currentValue = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const step = parseFloat(input.step) || 1;
        
        let newValue = currentValue + delta;
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Round to appropriate decimal places
        if (step < 1) {
            newValue = Math.round(newValue * 10) / 10;
        } else {
            newValue = Math.round(newValue);
        }
        
        input.value = newValue;
    }

    randomizeSeed() {
        const seed = Math.floor(Math.random() * (2**32 - 1));
        document.getElementById('seed').value = seed;
    }

    async generateImage() {
        const inputFile = document.getElementById('input-file').files[0];
        const maskFile = document.getElementById('mask-file').files[0];
        
        if (!inputFile || !maskFile) {
            this.showError('Please select both input and mask images');
            return;
        }

        const formData = new FormData();
        formData.append('input_image', inputFile);
        formData.append('mask_image', maskFile);
        formData.append('prompt', document.getElementById('prompt').value);
        formData.append('negative_prompt', document.getElementById('negative-prompt').value);
        formData.append('steps', document.getElementById('steps').value);
        formData.append('cfg_scale', document.getElementById('cfg').value);
        
        const seedValue = document.getElementById('seed').value;
        if (seedValue) {
            formData.append('seed', seedValue);
        }

        try {
            this.setGenerateButtonState(true);
            this.updateStatus('generating', 50);
            this.hideError();
            this.showGenerationOverlay();

            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (response.ok && result.status === 'completed') {
                this.handleGenerationComplete(result.image_url);
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (error) {
            this.showError(error.message);
            this.setGenerateButtonState(false);
            this.updateStatus('error', 0);
            this.hideGenerationOverlay();
        }
    }

    handleGenerationComplete(imageUrl) {
        this.setGenerateButtonState(false);
        this.hideGenerationOverlay();
        this.updateStatus('completed', 100);
        
        // Show result image with animation
        const resultPlaceholder = document.getElementById('result-placeholder');
        const resultImage = document.getElementById('result-image');
        const outputImg = document.getElementById('output-img');
        
        outputImg.src = imageUrl;
        outputImg.dataset.imageUrl = imageUrl;
        
        resultPlaceholder.classList.add('hidden');
        resultImage.classList.remove('hidden');
        resultImage.classList.add('fade-in');
    }

    updateStatus(status, progress) {
        const statusBadge = document.getElementById('status-badge');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        // Update overlay progress too if visible
        const overlayProgressBar = document.getElementById('overlay-progress-bar');
        const overlayProgressText = document.getElementById('overlay-progress-text');
        
        // Status badge updates
        statusBadge.className = 'status-badge';
        statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        
        switch (status) {
            case 'uploading':
                statusBadge.classList.add('status-uploading');
                break;
            case 'generating':
                statusBadge.classList.add('status-generating');
                break;
            case 'completed':
                statusBadge.classList.add('status-completed');
                break;
            case 'error':
                statusBadge.classList.add('status-error');
                break;
        }
        
        // Progress bar updates
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        if (overlayProgressBar) {
            overlayProgressBar.style.width = `${progress}%`;
        }
        if (overlayProgressText) {
            overlayProgressText.textContent = `${Math.round(progress)}%`;
        }
    }

    setGenerateButtonState(isGenerating) {
        const btn = document.getElementById('generate-btn');
        const spinner = btn.querySelector('.spinner');
        const text = btn.querySelector('.btn-text');
        
        if (isGenerating) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            spinner.classList.remove('hidden');
            text.textContent = 'Generating...';
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            spinner.classList.add('hidden');
            text.textContent = 'Generate Image';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        errorDiv.classList.add('fade-in');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.add('hidden');
        errorDiv.classList.remove('fade-in');
    }

    showGenerationOverlay() {
        const overlay = document.getElementById('generation-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('fade-in');
    }

    hideGenerationOverlay() {
        const overlay = document.getElementById('generation-overlay');
        overlay.classList.add('hidden');
        overlay.classList.remove('fade-in');
    }

    downloadImage() {
        const outputImg = document.getElementById('output-img');
        const imageUrl = outputImg.dataset.imageUrl;
        
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `generated_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    resetForm() {
        // Clear images
        this.clearImage('input');
        this.clearImage('mask');
        
        // Reset form fields to defaults
        document.getElementById('prompt').value = 'wearing red modern dress';
        document.getElementById('negative-prompt').value = 'easynegative,(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation';
        document.getElementById('steps').value = '20';
        document.getElementById('cfg').value = '7';
        document.getElementById('seed').value = '';
        
        // Hide result
        const resultPlaceholder = document.getElementById('result-placeholder');
        const resultImage = document.getElementById('result-image');
        
        resultImage.classList.add('hidden');
        resultPlaceholder.classList.remove('hidden');
        
        // Reset status
        this.updateStatus('ready', 0);
        this.hideError();
    }

    async openGallery() {
        const modal = document.getElementById('gallery-modal');
        modal.classList.remove('hidden');
        try {
            const response = await fetch('/api/gallery');
            const result = await response.json();
            if (response.ok) {
                this.renderGallery(result.images);
            } else {
                throw new Error(result.error || 'Could not load gallery');
            }
        } catch (error) {
            this.showError(error.message);
            this.renderGallery([]); // Render empty state
        }
    }

    closeGallery() {
        const modal = document.getElementById('gallery-modal');
        modal.classList.add('hidden');
    }

    renderGallery(images) {
        const grid = document.getElementById('gallery-grid');
        const placeholder = document.getElementById('gallery-placeholder');
        grid.innerHTML = ''; // Clear previous images

        if (images.length === 0) {
            placeholder.classList.remove('hidden');
            grid.classList.add('hidden');
        } else {
            placeholder.classList.add('hidden');
            grid.classList.remove('hidden');
            images.forEach(imageFile => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative aspect-square rounded-lg overflow-hidden group fade-in';
                
                const img = document.createElement('img');
                img.src = `/outputs/${imageFile}`;
                img.className = 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-110';
                
                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
                
                const viewButton = document.createElement('button');
                viewButton.className = 'btn-secondary';
                viewButton.innerHTML = '<i class="fas fa-eye"></i>';
                viewButton.onclick = () => {
                    this.handleGenerationComplete(`/outputs/${imageFile}`);
                    this.closeGallery();
                };
                
                overlay.appendChild(viewButton);
                imgContainer.appendChild(img);
                imgContainer.appendChild(overlay);
                grid.appendChild(imgContainer);
            });
        }
    }

    addGlobalFunctions() {
        // Make functions available globally for inline onclick handlers
        window.clearImage = (type) => this.clearImage(type);
        window.adjustValue = (id, delta) => this.adjustValue(id, delta);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ImageGenerator();
}); 