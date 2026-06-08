#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            // Future: add a global hotkey, autostart, or system tray here.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running FocusLine");
}
