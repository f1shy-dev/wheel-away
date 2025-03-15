// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use env_logger;
use fast_image_resize::{self as fr};
use image::{DynamicImage, ImageOutputFormat, RgbaImage};
use log::{debug, error, info};
use mouse_position::mouse_position::Mouse;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::num::NonZeroU32;
use xcap::Monitor;

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

#[tauri::command]
fn greet(name: &str) -> String {
    info!("Greeting {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_mouse_position() -> Result<MousePosition, String> {
    debug!("Getting mouse position");
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => {
            debug!("Mouse position: x={}, y={}", x, y);
            Ok(MousePosition { x, y })
        }
        Mouse::Error => {
            error!("Failed to get mouse position");
            Err("Error getting mouse position".to_string())
        }
    }
}

#[tauri::command]
fn capture_screen() -> Result<ScreenCapture, String> {
    info!("Starting screen capture");

    // Find a primary monitor
    // Get a monitor at position 0,0 as a starting point
    info!("Getting monitor at position 0,0");
    let monitor = match Monitor::from_point(0, 0) {
        Ok(m) => m,
        Err(e) => {
            error!("Failed to get monitor: {}", e);
            return Err(e.to_string());
        }
    };

    // Capture the screen
    info!("Capturing screen image");
    let image_buffer = match monitor.capture_image() {
        Ok(img) => {
            info!(
                "Screen captured successfully. Dimensions: {}x{}",
                img.width(),
                img.height()
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

        // Create resizer instance and resize
        let mut resizer = fr::Resizer::new();
        resizer
            .resize(&src_image, &mut dst_image, None)
            .map_err(|e| e.to_string())?;

        // Convert back to DynamicImage
        let resized_buffer =
            RgbaImage::from_raw(new_width, max_height, dst_image.buffer().to_vec())
                .ok_or("Failed to create resized image")?;

        image = DynamicImage::ImageRgba8(resized_buffer);

        info!("Image fast-resized to {}x{}", image.width(), image.height());
    }

    // Convert the image to a PNG and encode as base64
    info!("Converting image to PNG and base64");
    let mut png_data = Vec::new();
    let mut cursor = Cursor::new(&mut png_data);
    match image.write_to(&mut cursor, ImageOutputFormat::Png) {
        Ok(_) => debug!("Image converted to PNG successfully"),
        Err(e) => {
            error!("Failed to convert image to PNG: {}", e);
            return Err(e.to_string());
        }
    };

    let base64_image = BASE64.encode(&png_data);
    info!(
        "Base64 encoding complete. Length: {} bytes",
        base64_image.len()
    );

    Ok(ScreenCapture {
        data: format!("data:image/png;base64,{}", base64_image),
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_mouse_position,
            capture_screen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
