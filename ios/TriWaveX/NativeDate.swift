import Foundation

/// Server timestamps arrive as `toISOString()` (milliseconds) or from Supabase
/// (microseconds). `JSONDecoder.DateDecodingStrategy.iso8601` rejects any
/// fractional seconds, which made whole screens fail to decode.
enum NativeDate {
    nonisolated static func parse(_ value: String) -> Date? {
        let plain = ISO8601DateFormatter()
        if let date = plain.date(from: value) { return date }
        let normalized = value.replacingOccurrences(of: #"(\.\d{3})\d+"#, with: "$1", options: .regularExpression)
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fractional.date(from: normalized)
    }

    nonisolated static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            guard let date = parse(value) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Fecha no válida: \(value)")
            }
            return date
        }
        return decoder
    }
}
