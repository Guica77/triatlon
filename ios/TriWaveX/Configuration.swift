import Foundation

enum Configuration {
    static var siteURL: URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "TriWaveXSiteURL") as? String,
              let url = URL(string: value), url.scheme == "https",
              let host = url.host, !host.hasSuffix(".invalid"),
              url.user == nil, url.password == nil,
              url.query == nil, url.fragment == nil,
              url.path.isEmpty || url.path == "/" else { return nil }
        return url
    }

    static func allows(_ url: URL, origin: URL) -> Bool {
        guard url.scheme == "https", url.user == nil, url.password == nil else { return false }
        return url.host == origin.host && url.port == origin.port
    }
}
