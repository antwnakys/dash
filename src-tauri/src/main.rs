//! dash for Mac: a window that shows the live website (https://antwnakys.github.io/dash/), so it's
//! always the latest version. Google sign-in opens in the default browser and comes back through
//! the Google URL scheme in tauri.conf.json (see src/data/googleMac.ts); this file only brings the
//! window to the front when that happens.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |_| {
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("dash couldn't start");
}
