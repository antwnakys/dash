import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = DashViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/// dash's page colour (`--bg` in src/index.css), light and dark. Everything native behind the web page uses it,
/// so nothing dark shows behind the Dynamic Island, during overscroll or while the page loads.
private let dashBackground = UIColor { traits in
    traits.userInterfaceStyle == .dark
        ? UIColor(red: 11 / 255, green: 11 / 255, blue: 13 / 255, alpha: 1)
        : UIColor(red: 242 / 255, green: 242 / 255, blue: 240 / 255, alpha: 1)
}

/// The Capacitor screen, edge to edge, in dash's colours.
class DashViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(DashThemePlugin())
        bridge?.registerPluginInstance(DashAppPlugin())
        view.backgroundColor = dashBackground
        guard let webView = webView else { return }
        webView.backgroundColor = dashBackground
        webView.scrollView.backgroundColor = dashBackground
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 15.0, *) {
            webView.underPageBackgroundColor = dashBackground
        }
        // iOS 26 draws a dimmed, blurred "edge effect" (with a divider line) under the status bar and at the
        // bottom of every scroll view. dash fills the whole screen and fades its own content, so switch it off.
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            webView.scrollView.topEdgeEffect.isHidden = true
            webView.scrollView.bottomEdgeEffect.isHidden = true
        }
        #endif
    }
}

/// Lets the web app tell iOS which theme it shows (it can differ from the phone's setting),
/// so the native colours and the status bar text match.
@objc(DashThemePlugin)
class DashThemePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "DashThemePlugin"
    let jsName = "DashTheme"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]

    /// `style`: "light", "dark" or "system" (follow the phone's setting).
    @objc func set(_ call: CAPPluginCall) {
        let style: UIUserInterfaceStyle
        switch call.getString("style") {
        case "dark": style = .dark
        case "light": style = .light
        default: style = .unspecified
        }
        DispatchQueue.main.async { [weak self] in
            self?.bridge?.viewController?.view.window?.overrideUserInterfaceStyle = style
            call.resolve()
        }
    }
}

/// Facts about the installed app for the web side. `info()` returns `expires`: when the signing profile Xcode put
/// into the app runs out (free Apple ID profiles last 7 days, then the app stops opening until it's reinstalled).
@objc(DashAppPlugin)
class DashAppPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "DashAppPlugin"
    let jsName = "DashApp"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "info", returnType: CAPPluginReturnPromise)
    ]

    @objc func info(_ call: CAPPluginCall) {
        var result: [String: Any] = [:]
        if let expires = DashAppPlugin.profileExpiry() {
            result["expires"] = ISO8601DateFormatter().string(from: expires)
        }
        call.resolve(result)
    }

    /// `embedded.mobileprovision` is a signed file with a property list inside; read its ExpirationDate.
    /// Absent in the simulator and in App Store builds, which then report no expiry.
    static func profileExpiry() -> Date? {
        guard
            let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
            let data = try? Data(contentsOf: url),
            let text = String(data: data, encoding: .isoLatin1),
            let start = text.range(of: "<?xml"),
            let end = text.range(of: "</plist>"),
            let xml = String(text[start.lowerBound..<end.upperBound]).data(using: .isoLatin1),
            let plist = try? PropertyListSerialization.propertyList(from: xml, format: nil) as? [String: Any]
        else { return nil }
        return plist["ExpirationDate"] as? Date
    }
}
