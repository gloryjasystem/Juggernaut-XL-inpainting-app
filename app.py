from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import base64
import uuid
import time
import requests
import json
from dotenv import load_dotenv
from PIL import Image
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure upload and output folders
UPLOAD_FOLDER = '/tmp/uploads'
OUTPUT_FOLDER = '/tmp/outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# Load serverless configuration from environment
SERVERLESS_API_ID = os.getenv('SERVERLESS_API_ID')
API_KEY = os.getenv('API_KEY')

if not all([SERVERLESS_API_ID, API_KEY]):
    raise ValueError("Missing required environment variables. Please check your .env file for SERVERLESS_API_ID and API_KEY.")

# RunPod Serverless API endpoint
SERVERLESS_URL = f"https://api.runpod.ai/v2/{SERVERLESS_API_ID}/runsync"

print(f"🚀 Using RunPod Serverless API: {SERVERLESS_URL}")
print(f"🔑 API Key: {'*' * (len(API_KEY) - 4) + API_KEY[-4:] if len(API_KEY) > 4 else '****'}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def image_to_base64(image_path):
    """Convert image file to base64 string"""
    with open(image_path, 'rb') as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def save_base64_image(base64_string, filename):
    """Save base64 image to outputs folder"""
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        
        with open(output_path, 'wb') as f:
            f.write(image_data)
        
        return output_path
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_image():
    try:
        # Check if files are present
        if 'input_image' not in request.files or 'mask_image' not in request.files:
            return jsonify({'error': 'Both input_image and mask_image are required'}), 400
        
        input_file = request.files['input_image']
        mask_file = request.files['mask_image']
        
        if input_file.filename == '' or mask_file.filename == '':
            return jsonify({'error': 'No files selected'}), 400
        
        if not (allowed_file(input_file.filename) and allowed_file(mask_file.filename)):
            return jsonify({'error': 'Invalid file type. Please use PNG, JPG, JPEG, GIF, BMP, or WEBP files.'}), 400
        
        # Get parameters from form
        prompt = request.form.get('prompt', 'wearing red modern dress')
        negative_prompt = request.form.get('negative_prompt', 'easynegative,(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation')
        steps = int(request.form.get('steps', 20))
        cfg_scale = float(request.form.get('cfg_scale', 7.0))
        seed = int(request.form.get('seed', -1))
        
        # Generate random seed if not provided
        if seed == -1:
            seed = int(time.time() * 1000) % (2**32)
        
        # Save uploaded files temporarily
        task_id = f"task_{int(time.time() * 1000)}"
        input_filename = f"{task_id}_input.png"
        mask_filename = f"{task_id}_mask.png"
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
        mask_path = os.path.join(app.config['UPLOAD_FOLDER'], mask_filename)
        
        input_file.save(input_path)
        mask_file.save(mask_path)
        
        # Convert images to base64
        input_base64 = image_to_base64(input_path)
        mask_base64 = image_to_base64(mask_path)
        
        # Create serverless payload
        payload = {
            "input": {
                "workflow": {
                    "1": {
                        "inputs": {
                            "ckpt_name": "model.safetensors"
                        },
                        "class_type": "CheckpointLoaderSimple",
                        "_meta": {
                            "title": "Load Checkpoint"
                        }
                    },
                    "2": {
                        "inputs": {
                            "stop_at_clip_layer": -2,
                            "clip": ["1", 1]
                        },
                        "class_type": "CLIPSetLastLayer",
                        "_meta": {
                            "title": "CLIP Set Last Layer"
                        }
                    },
                    "3": {
                        "inputs": {
                            "text": prompt,
                            "clip": ["15", 1]
                        },
                        "class_type": "CLIPTextEncode",
                        "_meta": {
                            "title": "CLIP Text Encode (Prompt)"
                        }
                    },
                    "4": {
                        "inputs": {
                            "text": negative_prompt,
                            "clip": ["15", 1]
                        },
                        "class_type": "CLIPTextEncode",
                        "_meta": {
                            "title": "CLIP Text Encode (Prompt)"
                        }
                    },
                    "5": {
                        "inputs": {
                            "seed": seed,
                            "steps": steps,
                            "cfg": cfg_scale,
                            "sampler_name": "dpmpp_2m",
                            "scheduler": "karras",
                            "denoise": 1,
                            "model": ["15", 0],
                            "positive": ["9", 0],
                            "negative": ["9", 1],
                            "latent_image": ["9", 2]
                        },
                        "class_type": "KSampler",
                        "_meta": {
                            "title": "KSampler"
                        }
                    },
                    "7": {
                        "inputs": {
                            "samples": ["5", 0],
                            "vae": ["1", 2]
                        },
                        "class_type": "VAEDecode",
                        "_meta": {
                            "title": "VAE Decode"
                        }
                    },
                    "8": {
                        "inputs": {
                            "filename_prefix": "output",
                            "images": ["12", 0]
                        },
                        "class_type": "SaveImage",
                        "_meta": {
                            "title": "Save Image"
                        }
                    },
                    "9": {
                        "inputs": {
                            "noise_mask": True,
                            "positive": ["3", 0],
                            "negative": ["4", 0],
                            "vae": ["1", 2],
                            "pixels": ["11", 1],
                            "mask": ["11", 2]
                        },
                        "class_type": "InpaintModelConditioning",
                        "_meta": {
                            "title": "InpaintModelConditioning"
                        }
                    },
                    "10": {
                        "inputs": {
                            "image": "input_image.png",
                            "upload": "image"
                        },
                        "class_type": "LoadImage",
                        "_meta": {
                            "title": "Load Input Image"
                        }
                    },
                    "11": {
                        "inputs": {
                            "context_expand_pixels": 20,
                            "context_expand_factor": 1,
                            "fill_mask_holes": True,
                            "blur_mask_pixels": 16,
                            "invert_mask": False,
                            "blend_pixels": 16,
                            "rescale_algorithm": "bicubic",
                            "mode": "forced size",
                            "force_width": 1024,
                            "force_height": 1024,
                            "rescale_factor": 1,
                            "min_width": 512,
                            "min_height": 512,
                            "max_width": 768,
                            "max_height": 768,
                            "padding": 32,
                            "image": ["10", 0],
                            "mask": ["17", 1]
                        },
                        "class_type": "InpaintCrop",
                        "_meta": {
                            "title": "Inpaint Crop"
                        }
                    },
                    "12": {
                        "inputs": {
                            "rescale_algorithm": "bislerp",
                            "stitch": ["11", 0],
                            "inpainted_image": ["7", 0]
                        },
                        "class_type": "InpaintStitch",
                        "_meta": {
                            "title": "Inpaint Stitch"
                        }
                    },
                    "15": {
                        "inputs": {
                            "lora_name": "lady.safetensors",
                            "strength_model": 1.0000000000000002,
                            "strength_clip": 1.0000000000000002,
                            "model": ["1", 0],
                            "clip": ["2", 0]
                        },
                        "class_type": "LoraLoader",
                        "_meta": {
                            "title": "Load LoRA"
                        }
                    },
                    "17": {
                        "inputs": {
                            "image": "mask_image.png",
                            "upload": "image"
                        },
                        "class_type": "LoadImage",
                        "_meta": {
                            "title": "Load Mask Image"
                        }
                    }
                },
                "images": [
                    {
                        "name": "input_image.png",
                        "image": input_base64
                    },
                    {
                        "name": "mask_image.png",
                        "image": mask_base64
                    }
                ]
            }
        }
        
        # Headers for serverless API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }
        
        print(f"🎨 Starting image generation with task ID: {task_id}")
        print(f"📝 Prompt: {prompt}")
        print(f"🎯 Steps: {steps}, CFG: {cfg_scale}, Seed: {seed}")
        
        # Send request to serverless API
        response = requests.post(SERVERLESS_URL, headers=headers, json=payload, timeout=300)
        
        if response.status_code == 200:
            result = response.json()
            print(f"📥 Received response status: {result.get('status')}")
            print(f"📊 Response keys: {list(result.keys())}")
            
            # Check if generation was successful
            if result.get('status') == 'COMPLETED':
                output_data = result.get('output')
                
                if output_data:
                    # Handle different output formats
                    image_data = None
                    
                    # Check if output is directly a base64 string
                    if isinstance(output_data, str):
                        image_data = output_data
                    # Check if output has an 'images' array
                    elif isinstance(output_data, dict) and 'images' in output_data:
                        images = output_data['images']
                        if images and len(images) > 0:
                            image_data = images[0]
                    # Check if output is a dict with base64 data
                    elif isinstance(output_data, dict):
                        # Sometimes the image might be in a different key
                        for key, value in output_data.items():
                            if isinstance(value, str) and len(value) > 1000:  # Likely base64 image
                                image_data = value
                                break
                    
                    if image_data and isinstance(image_data, str):
                        # Save the base64 image
                        output_filename = f"{task_id}_output.png"
                        saved_path = save_base64_image(image_data, output_filename)
                        
                        if saved_path:
                            print(f"✅ Image generation completed: {output_filename}")
                            return jsonify({
                                'status': 'completed',
                                'task_id': task_id,
                                'image_url': f'/outputs/{output_filename}',
                                'message': 'Image generated successfully!'
                            })
                        else:
                            return jsonify({'error': 'Failed to save generated image'}), 500
                    else:
                        return jsonify({'error': 'Could not find valid image data in response'}), 500
                else:
                    return jsonify({'error': 'No output data found in response'}), 500
            else:
                error_msg = result.get('error', 'Unknown error occurred')
                print(f"❌ Generation failed: {error_msg}")
                return jsonify({'error': f'Generation failed: {error_msg}'}), 500
        else:
            error_msg = f"API request failed with status {response.status_code}: {response.text}"
            print(f"❌ API Error: {error_msg}")
            return jsonify({'error': error_msg}), 500
        
    except Exception as e:
        print(f"❌ Error in generate_image: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    finally:
        # Clean up temporary files
        try:
            if 'input_path' in locals() and os.path.exists(input_path):
                os.remove(input_path)
            if 'mask_path' in locals() and os.path.exists(mask_path):
                os.remove(mask_path)
        except:
            pass

@app.route('/outputs/<filename>')
def serve_output(filename):
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename)

@app.route('/api/gallery')
def get_gallery():
    try:
        image_files = [f for f in os.listdir(app.config['OUTPUT_FOLDER']) if allowed_file(f)]
        # Sort by modification time, newest first
        image_files.sort(key=lambda x: os.path.getmtime(os.path.join(app.config['OUTPUT_FOLDER'], x)), reverse=True)
        return jsonify({'images': image_files})
    except Exception as e:
        print(f"❌ Error in get_gallery: {str(e)}")
        return jsonify({'error': 'Could not retrieve gallery.'}), 500

if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"🌐 Starting Flask server on {host}:{port}")
    app.run(debug=debug, host=host, port=port) 