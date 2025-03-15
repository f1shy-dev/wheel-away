// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64_simd::STANDARD as BASE64_SIMD;
use env_logger;
use fast_image_resize::{self as fr};
use image::{DynamicImage, ImageOutputFormat, RgbaImage};
use jpeg_encoder::{ColorType, Encoder as JpegEncoder};
use log::{debug, error, info};
use mouse_position::mouse_position::Mouse;
use serde::{Deserialize, Serialize};
use serialport::{SerialPort, SerialPortInfo, SerialPortType};
use std::io::{Cursor, Write};
use std::num::NonZeroU32;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use xcap::Monitor;

// Global serial port connection
lazy_static::lazy_static! {
    static ref SERIAL_CONNECTION: Arc<Mutex<Option<Box<dyn SerialPort>>>> = Arc::new(Mutex::new(None));
}

#[derive(Serialize, Deserialize)]
struct MousePosition {
    x: i32,
    y: i32,
}

#[derive(Serialize, Deserialize)]
struct ScreenCapture {
    data: String,
    width: u32,
    height: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct SerialPortDetails {
    port_name: String,
    port_type: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    info!("Greeting {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_mouse_position() -> Result<MousePosition, String> {
    // debug!("Getting mouse position");
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => {
            // debug!("Mouse position: x={}, y={}", x, y);
            Ok(MousePosition { x, y })
        }
        Mouse::Error => {
            error!("Failed to get mouse position");
            Err("Error getting mouse position".to_string())
        }
    }
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<SerialPortDetails>, String> {
    info!("Listing available serial ports");

    match serialport::available_ports() {
        Ok(ports) => {
            let port_details = ports
                .into_iter()
                .map(|port| {
                    let port_type = match port.port_type {
                        SerialPortType::UsbPort(_) => "USB".to_string(),
                        SerialPortType::BluetoothPort => "Bluetooth".to_string(),
                        SerialPortType::PciPort => "PCI".to_string(),
                        SerialPortType::Unknown => "Unknown".to_string(),
                    };

                    SerialPortDetails {
                        port_name: port.port_name,
                        port_type,
                    }
                })
                .collect();

            Ok(port_details)
        }
        Err(e) => {
            error!("Failed to list serial ports: {}", e);
            Err(format!("Failed to list serial ports: {}", e))
        }
    }
}

#[tauri::command]
fn connect_to_arduino(port_name: &str) -> Result<String, String> {
    info!("Connecting to Arduino on port: {}", port_name);

    // Try to open the serial port
    match serialport::new(port_name, 9600)
        .timeout(Duration::from_millis(1000))
        .open()
    {
        Ok(port) => {
            // Store the connection in the global variable
            let mut serial_connection = SERIAL_CONNECTION.lock().unwrap();
            *serial_connection = Some(port);

            info!("Successfully connected to Arduino on port: {}", port_name);
            Ok(format!("Connected to {}", port_name))
        }
        Err(e) => {
            error!("Failed to connect to Arduino: {}", e);
            Err(format!("Failed to connect to Arduino: {}", e))
        }
    }
}

#[tauri::command]
fn disconnect_arduino() -> Result<String, String> {
    info!("Disconnecting from Arduino");

    let mut serial_connection = SERIAL_CONNECTION.lock().unwrap();
    *serial_connection = None;

    info!("Arduino disconnected");
    Ok("Arduino disconnected".to_string())
}

#[tauri::command]
fn send_arduino_command(command: &str) -> Result<String, String> {
    info!("Sending command to Arduino: {}", command);

    let mut serial_connection = SERIAL_CONNECTION.lock().unwrap();

    match &mut *serial_connection {
        Some(port) => {
            // Send the command with a newline
            let command_with_newline = format!("{}\n", command);
            match port.write(command_with_newline.as_bytes()) {
                Ok(_) => {
                    info!("Command sent successfully");

                    // Read the response
                    let mut response = String::new();
                    let mut buffer = [0u8; 100];

                    // Wait a bit for Arduino to process and respond
                    std::thread::sleep(Duration::from_millis(100));

                    // Read available data
                    match port.read(&mut buffer) {
                        Ok(bytes_read) => {
                            if bytes_read > 0 {
                                response =
                                    String::from_utf8_lossy(&buffer[0..bytes_read]).to_string();
                                info!("Received response: {}", response);
                            } else {
                                info!("No response received");
                                response = "No response".to_string();
                            }
                        }
                        Err(e) => {
                            info!("Error reading response: {}", e);
                            response = "Error reading response".to_string();
                        }
                    }

                    Ok(response)
                }
                Err(e) => {
                    error!("Failed to send command: {}", e);
                    Err(format!("Failed to send command: {}", e))
                }
            }
        }
        None => {
            error!("No Arduino connected");
            Err("No Arduino connected".to_string())
        }
    }
}

#[tauri::command]
fn capture_screen() -> Result<ScreenCapture, String> {
    let total_start = Instant::now();
    info!("Starting screen capture");

    // Find a primary monitor
    let monitor_start = Instant::now();
    info!("Getting monitor at position 0,0");
    let monitor = match Monitor::from_point(0, 0) {
        Ok(m) => m,
        Err(e) => {
            error!("Failed to get monitor: {}", e);
            return Err(e.to_string());
        }
    };
    info!("Monitor lookup took: {:?}", monitor_start.elapsed());

    // Capture the screen
    let capture_start = Instant::now();
    info!("Capturing screen image");
    let image_buffer = match monitor.capture_image() {
        Ok(img) => {
            info!(
                "Screen captured successfully. Dimensions: {}x{}, took: {:?}",
                img.width(),
                img.height(),
                capture_start.elapsed()
            );
            img
        }
        Err(e) => {
            error!("Failed to capture image: {}", e);
            return Err(e.to_string());
        }
    };

    let mut image = DynamicImage::ImageRgba8(image_buffer.clone());
    let width = image.width();
    let height = image.height();

    // Resize the image if height is greater than 1080
    let max_height = 1080;
    if height > max_height {
        let resize_start = Instant::now();
        info!("Resizing image from {}x{}", width, height);

        // Calculate new dimensions preserving aspect ratio
        let aspect_ratio = width as f32 / height as f32;
        let new_width = (max_height as f32 * aspect_ratio).round() as u32;

        info!("Fast resize to {}x{}", new_width, max_height);

        // Create source image view from image buffer
        let src_width = NonZeroU32::new(width).unwrap();
        let src_height = NonZeroU32::new(height).unwrap();
        let image_buffer_vec = image_buffer.to_vec();
        let src_image = fr::images::ImageRef::new(
            src_width.into(),
            src_height.into(),
            &image_buffer_vec,
            fr::pixels::PixelType::U8x4,
        )
        .map_err(|e| e.to_string())?;

        // Create destination image buffer
        let dst_width = NonZeroU32::new(new_width).unwrap();
        let dst_height = NonZeroU32::new(max_height).unwrap();
        let mut dst_image = fr::images::Image::new(
            dst_width.into(),
            dst_height.into(),
            fr::pixels::PixelType::U8x4,
        );

        let options = fr::ResizeOptions {
            algorithm: fr::ResizeAlg::Convolution(fr::FilterType::Box),
            cropping: fr::SrcCropping::None,
            mul_div_alpha: true,
        };

        // Create resizer instance and resize
        let mut resizer = fr::Resizer::new();
        resizer
            .resize(&src_image, &mut dst_image, &options)
            .map_err(|e| e.to_string())?;

        info!("Actual resize took: {:?}", resize_start.elapsed());

        // Convert back to DynamicImage
        let resized_buffer =
            RgbaImage::from_raw(new_width, max_height, dst_image.buffer().to_vec())
                .ok_or("Failed to create resized image")?;

        image = DynamicImage::ImageRgba8(resized_buffer);

        info!(
            "Image fast-resized to {}x{}, took: {:?}",
            image.width(),
            image.height(),
            resize_start.elapsed()
        );
    }

    // Convert the image to JPEG and encode as base64 using faster libraries
    let encoding_start = Instant::now();
    info!("Converting image to JPEG and base64");

    // Convert RGBA to RGB for JPEG encoding
    let rgba_start = Instant::now();
    let rgba = image.to_rgba8();
    let width = rgba.width() as usize;
    let height = rgba.height() as usize;

    // Pre-allocate the RGB buffer with exact capacity
    let mut rgb_data = Vec::with_capacity(width * height * 3);

    // More efficient conversion from RGBA to RGB
    // Process raw bytes directly instead of pixel by pixel
    let rgba_data = rgba.as_raw();
    for chunk in rgba_data.chunks_exact(4) {
        rgb_data.push(chunk[0]); // R
        rgb_data.push(chunk[1]); // G
        rgb_data.push(chunk[2]); // B
                                 // Skip alpha (chunk[3])
    }

    info!("RGBA to RGB conversion took: {:?}", rgba_start.elapsed());

    // Use JPEG encoder with high quality
    let jpeg_start = Instant::now();
    // Create a buffer to hold the JPEG data
    let mut jpeg_data = Vec::new();
    // Create the encoder with the buffer and quality
    let mut jpeg_encoder = JpegEncoder::new(&mut jpeg_data, 85);
    // Encode the image
    match jpeg_encoder.encode(&rgb_data, width as u16, height as u16, ColorType::Rgb) {
        Ok(_) => {
            debug!("Image converted to JPEG successfully");
        }
        Err(e) => {
            error!("Failed to convert image to JPEG: {}", e);
            return Err(e.to_string());
        }
    };
    info!("JPEG encoding took: {:?}", jpeg_start.elapsed());

    // Use SIMD-accelerated base64 encoding
    let base64_start = Instant::now();
    let base64_image = BASE64_SIMD.encode_to_string(&jpeg_data);
    info!("Base64 encoding took: {:?}", base64_start.elapsed());

    info!(
        "Total encoding (JPEG + base64) took: {:?}, data length: {} bytes",
        encoding_start.elapsed(),
        base64_image.len()
    );

    info!(
        "Total screen capture process took: {:?}",
        total_start.elapsed()
    );

    Ok(ScreenCapture {
        data: format!("data:image/jpeg;base64,{}", base64_image),
        width: image.width(),
        height: image.height(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set up RUST_LOG for logging
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "debug");
    }

    // Initialize the env_logger
    env_logger::init();

    info!("Starting Wheel Away application");

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_mouse_position,
            capture_screen,
            list_serial_ports,
            connect_to_arduino,
            disconnect_arduino,
            send_arduino_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
