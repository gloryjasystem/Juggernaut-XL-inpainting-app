# AI Image Generator Web UI

A beautiful web interface for your AI image generation using ComfyUI backend. Built with Flask, HTML, CSS, and JavaScript using shadcn UI design principles.

## Features

🎨 **Beautiful UI**: Modern design inspired by shadcn UI components  
📤 **Drag & Drop**: Easy image upload with drag and drop support  
🎛️ **Full Control**: Adjust prompts, steps, CFG scale, and seed  
📊 **Real-time Progress**: Live status updates and progress tracking  
💾 **Download Results**: Save generated images directly  
📱 **Responsive**: Works on desktop and mobile devices  

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py
```

### 3. Open Your Browser
Navigate to: `http://localhost:5000`

## How to Use

### Basic Workflow:
1. **Upload Input Image**: Click or drag & drop your base image
2. **Upload Mask (Optional)**: Add a mask to define areas to modify
3. **Set Prompts**: Write what you want to generate/modify
4. **Adjust Settings**: Fine-tune steps, CFG scale, etc.
5. **Generate**: Click the generate button and wait for results
6. **Download**: Save your generated image

### Settings Explained:

- **Steps (10-50)**: Higher = better quality but slower generation
- **CFG Scale (1-20)**: Controls how closely the AI follows your prompt
- **Seed**: Set a specific number for reproducible results (optional)

### Tips for Best Results:

✅ **Good Prompts**: Be specific and detailed  
✅ **Quality Images**: Use high-resolution input images  
✅ **Clear Masks**: Make sure mask areas are well-defined  
✅ **Balanced Settings**: Start with default values (Steps: 20, CFG: 7)  

## File Structure

```
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main web interface
├── static/
│   └── js/
│       └── app.js        # Frontend JavaScript
├── uploads/              # Temporary uploaded images
├── outputs/              # Generated images
└── send_prompt.py        # Original backend script
```

## Configuration

The app uses your existing RunPod configuration from `send_prompt.py`:
- **Model**: `model.safetensors`
- **LoRA**: `lady.safetensors`
- **Upscaler**: `7200.pth`

To change models or settings, edit the workflow in `app.py`.

## API Endpoints

- `GET /` - Main web interface
- `POST /api/generate` - Start image generation
- `GET /api/status/<task_id>` - Check generation progress
- `GET /outputs/<filename>` - Download generated images

## Troubleshooting

### Common Issues:

1. **"No input image provided"**
   - Make sure to select an image file before generating

2. **"Generation timeout"**
   - Check your RunPod instance is running
   - Verify credentials in `app.py`

3. **"Failed to upload image"**
   - Ensure image file is under 10MB
   - Check supported formats: PNG, JPG, GIF, BMP, WEBP

4. **Port already in use**
   - Change port in `app.py`: `app.run(port=5001)`

### Debug Mode:
Run with debug output:
```bash
python app.py
```

## Customization

### Change UI Colors:
Edit the CSS classes in `templates/index.html`:
- `.btn-primary` - Main button color
- `.status-*` - Status badge colors

### Add New Settings:
1. Add HTML input in `templates/index.html`
2. Handle in JavaScript `static/js/app.js`
3. Process in Flask backend `app.py`

### Change Workflow:
Modify the `workflow` dictionary in `generate_image_async()` function in `app.py`.

---

🚀 **Ready to generate amazing images!** Upload your images and start creating! 