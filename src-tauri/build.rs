fn main() {
    // dash's own commands, so the capability can allow them for the live website.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["set_reminders", "notify"])),
    )
    .expect("tauri build step failed");
}
