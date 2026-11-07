//! dash for Mac: a window that shows the live website (https://antwnakys.github.io/dash/), so it's
//! always the latest version, plus a menu bar icon. Closing the window keeps dash running in the
//! menu bar so reminders still arrive; it also starts at login (menu bar → Open at Login).
//! Google sign-in opens in the default browser and comes back through the Google URL scheme in
//! tauri.conf.json (see src/data/googleMac.ts); this file only brings the window to the front then.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Deserialize;
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_notification::NotificationExt;

/// A reminder planned by the website (src/lib/reminderPlan.ts); `at` is in ms since 1970.
#[derive(Deserialize, Clone)]
struct Reminder {
    at: i64,
    title: String,
    body: String,
}

#[derive(Default)]
struct Reminders(Mutex<Vec<Reminder>>);

/// A reminder whose time passed while the Mac was asleep still shows if it's at most this late.
const GRACE_MS: i64 = 30 * 60 * 1000;

/// Menu bar items that open a part of dash: (menu id, label). The website handles the id.
const SECTIONS: [(&str, &str); 5] = [
    ("today", "Today"),
    ("courses", "Courses"),
    ("exams", "Exams"),
    ("tasks", "Tasks"),
    ("calendar", "Calendar"),
];

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn notify_now(app: &AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

/// Replaces the planned reminders (the website rebuilds the plan whenever dash's data changes).
#[tauri::command]
fn set_reminders(items: Vec<Reminder>, state: State<Reminders>) {
    *state.0.lock().unwrap() = items;
}

/// Shows a notification right away (Settings → Reminders → test).
#[tauri::command]
fn notify(app: AppHandle, title: String, body: String) {
    notify_now(&app, &title, &body);
}

fn tray(app: &AppHandle) -> tauri::Result<()> {
    let new = MenuItem::with_id(app, "new", "New…", true, None::<&str>)?;
    let sections = SECTIONS
        .iter()
        .map(|(id, label)| MenuItem::with_id(app, *id, *label, true, None::<&str>))
        .collect::<tauri::Result<Vec<_>>>()?;
    let at_login = app.autolaunch().is_enabled().unwrap_or(false);
    let login = CheckMenuItem::with_id(app, "login", "Open at Login", true, at_login, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit dash", true, None::<&str>)?;

    let menu = Menu::new(app)?;
    menu.append(&new)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    for item in &sections {
        menu.append(item)?;
    }
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&login)?;
    menu.append(&quit)?;

    let login_item = login.clone();
    TrayIconBuilder::with_id("dash")
        .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))?)
        .icon_as_template(true)
        .tooltip("dash")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "quit" => app.exit(0),
            "login" => {
                let launcher = app.autolaunch();
                let on = launcher.is_enabled().unwrap_or(false);
                let _ = if on { launcher.disable() } else { launcher.enable() };
                let _ = login_item.set_checked(launcher.is_enabled().unwrap_or(!on));
            }
            id => {
                show_window(app);
                let _ = app.emit("dash://menu", id.to_string());
            }
        })
        .build(app)?;
    Ok(())
}

/// Shows reminders when their time comes, for as long as dash is running.
fn reminder_clock(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(15));
        let now = now_ms();
        let due: Vec<Reminder> = {
            let state = app.state::<Reminders>();
            let mut items = state.0.lock().unwrap();
            let (due, later) = items.drain(..).partition(|r| r.at <= now);
            *items = later;
            due
        };
        for r in due.iter().filter(|r| now - r.at <= GRACE_MS) {
            notify_now(&app, &r.title, &r.body);
        }
    });
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .manage(Reminders::default())
        .invoke_handler(tauri::generate_handler![set_reminders, notify])
        .setup(|app| {
            // Start at login from the first launch on; the menu bar item turns it off.
            let marker = app.path().app_config_dir()?.join("login-item-set");
            if !marker.exists() {
                let _ = app.autolaunch().enable();
                let _ = std::fs::create_dir_all(marker.parent().unwrap());
                let _ = std::fs::write(&marker, b"1");
            }
            tray(app.handle())?;
            reminder_clock(app.handle().clone());

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |_| show_window(&handle));
            Ok(())
        })
        // Closing the window keeps dash in the menu bar; Quit is in the menu bar menu (or ⌘Q).
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("dash couldn't start");

    app.run(|app, event| {
        // Clicking dash in the Dock brings the window back.
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen { .. } = event {
            show_window(app);
        }
        #[cfg(not(target_os = "macos"))]
        let _ = (app, event);
    });
}
