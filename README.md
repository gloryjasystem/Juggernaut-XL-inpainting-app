# 🎨 ComfyUI Serverless Image Generator

A beautiful, modern web application for AI-powered image inpainting using RunPod's serverless ComfyUI API. Upload an input image and mask, customize your prompt, and generate stunning inpainted results instantly.

## ✨ Features

- **🚀 Serverless Architecture**: Lightning-fast generation using RunPod's serverless API
- **🎯 Real-time Processing**: No polling required - get instant results
- **🖼️ Drag & Drop Interface**: Easy image uploads with visual previews
- **⚙️ Advanced Controls**: Customize prompts, steps, CFG scale, and seed values
- **📱 Responsive Design**: Modern UI that works on all devices
- **🔒 Secure**: Environment-based credential management

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- RunPod account with serverless endpoint
- Basic knowledge of ComfyUI workflows

### Installation

1. **Clone or download the project**
   ```bash
   git clone <your-repo-url>
   cd comfyui-web-generator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   copy .env.example .env
   ```
   
   Edit `.env` and add your RunPod serverless credentials:
   ```env
   # RunPod Serverless Configuration
   SERVERLESS_API_ID=your_serverless_api_id_here
   API_KEY=your_runpod_api_key_here
   
   # Optional: Flask Configuration
   FLASK_DEBUG=True
   FLASK_HOST=0.0.0.0
   FLASK_PORT=5000
   ```

4. **Create required directories**
   ```bash
   mkdir uploads outputs
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🔧 Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVERLESS_API_ID` | Your RunPod serverless endpoint ID | `2a32vm5bz2dywb` |
| `API_KEY` | Your RunPod API key | `rpa_XXXXX...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_DEBUG` | Enable Flask debug mode | `True` |
| `FLASK_HOST` | Flask server host | `0.0.0.0` |
| `FLASK_PORT` | Flask server port | `5000` |

### Getting RunPod Credentials

1. **Create a RunPod Account**: Sign up at [runpod.io](https://runpod.io)
2. **Create Serverless Endpoint**: 
   - Go to Serverless → My Endpoints
   - Create a new endpoint with ComfyUI template
   - Copy your endpoint ID
3. **Get API Key**:
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key (starts with `rpa_`)

## 📖 Usage Guide

### Workflow

1. **Upload Images**: 
   - Drag and drop or click to upload input image
   - Upload mask image (white areas will be inpainted)

2. **Customize Settings**:
   - **Prompt**: Describe what you want to generate
   - **Negative Prompt**: Describe what to avoid
   - **Steps**: Number of generation steps (more = higher quality, slower)
   - **CFG Scale**: How closely to follow the prompt
   - **Seed**: For reproducible results (leave empty for random)

3. **Generate**: Click "Generate Image" and wait for results

4. **Download**: Save your generated image

### Settings Guide

- **Steps (1-100)**: Higher values produce better quality but take longer
- **CFG Scale (1-20)**: Higher values follow prompts more strictly
- **Seed**: Use the same seed with identical settings for reproducible results

### Pro Tips

- Use clear, descriptive prompts for better results
- Higher CFG values (7-12) work well for most cases
- 20-30 steps provide good quality/speed balance
- White areas in mask = areas to regenerate
- Black areas in mask = areas to keep unchanged

## 🏗️ Project Structure

```
comfyui-web-generator/
├── app.py                 # Flask backend with serverless API integration
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── .env                  # Your credentials (not in git)
├── .gitignore           # Git ignore rules
├── api.json             # ComfyUI workflow definition
├── templates/
│   └── index.html       # Main web interface
├── static/
│   └── js/
│       └── app.js       # Frontend JavaScript
├── uploads/             # Temporary uploaded files
└── outputs/             # Generated images
```

## 🔧 Workflow Customization

### Using Different ComfyUI Workflows

If you want to use a different ComfyUI workflow:

1. **Export Your Workflow**:
   - In ComfyUI, set up your desired workflow
   - Click "Save (API Format)" to export as JSON
   - Save the JSON content to `api.json`

2. **Update the Workflow in Code**:
   ```python
   # In app.py, update the workflow structure in the payload
   payload = {
       "input": {
           "workflow": {
               # Your exported workflow nodes here
           },
           "images": [
               {"name": "input_image.png", "image": input_base64},
               {"name": "mask_image.png", "image": mask_base64}
           ]
       }
   }
   ```

3. **Update Node References**:
   - Find the node IDs for your input images
   - Update the workflow to reference `input_image.png` and `mask_image.png`
   - Ensure the output node saves images correctly

### Common Workflow Types

- **Basic Inpainting**: Load image → Inpaint → Save
- **SDXL Inpainting**: Checkpoint → LoRA → Inpaint → Upscale → Save
- **ControlNet Inpainting**: Add ControlNet preprocessing nodes
- **Multi-step Workflows**: Chain multiple processing steps

### Finding Node IDs

1. In ComfyUI, right-click any node
2. Select "Properties" or hover to see node ID
3. Use these IDs to reference inputs/outputs between nodes

### Testing Your Workflow

1. Test in ComfyUI first to ensure it works
2. Export and update `api.json`
3. Test with your images using the web interface
4. Check the browser console for any errors

## 🔍 Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Check your `.env` file exists and has correct variable names
- Ensure no extra spaces around the `=` signs

**"API request failed"**
- Verify your RunPod serverless endpoint is running
- Check your API key is correct and has proper permissions
- Ensure your serverless endpoint has the required ComfyUI workflow

**"No images found in response"**
- Check your workflow has a SaveImage node
- Verify the workflow completes without errors
- Check the serverless logs in RunPod console

**Images not uploading**
- Check file size (max 10MB)
- Ensure file format is supported (PNG, JPG, JPEG, GIF, BMP, WEBP)

### Debug Mode

Enable debug mode in `.env`:
```env
FLASK_DEBUG=True
```

This will show detailed error messages and automatically reload the server when you make changes.

## 📦 Dependencies

- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **python-dotenv**: Environment variable management
- **requests**: HTTP client for API calls
- **Pillow**: Image processing

## 🔒 Security

- Environment variables keep credentials secure
- File uploads are validated and size-limited
- Temporary files are automatically cleaned up
- No credentials are logged or exposed in the UI

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🆘 Support

For issues:
1. Check the troubleshooting section above
2. Enable debug mode to see detailed error messages
3. Check your serverless endpoint logs in RunPod console
4. Verify your workflow works in ComfyUI directly first 