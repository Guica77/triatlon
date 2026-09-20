import AppKit
import AVFoundation
import QuartzCore

struct Caption {
    let start: Double
    let end: Double
    let title: String
    let detail: String
}

@main
struct ProductVideoRenderer {
    static func main() async throws {
        guard CommandLine.arguments.count == 4 else {
            throw RendererError.usage
        }

        let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
        let narrationURL = URL(fileURLWithPath: CommandLine.arguments[2])
        let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
        let source = AVURLAsset(url: sourceURL)
        let narration = AVURLAsset(url: narrationURL)
        let duration = try await source.load(.duration)
        let videoTrack = try await requiredTrack(in: source, mediaType: .video)
        let naturalSize = try await videoTrack.load(.naturalSize)
        let preferredTransform = try await videoTrack.load(.preferredTransform)
        let transformedRect = CGRect(origin: .zero, size: naturalSize)
            .applying(preferredTransform)
            .standardized
        let renderSize = transformedRect.size

        let composition = AVMutableComposition()
        let compositionVideo = try requiredMutableTrack(in: composition, mediaType: .video)
        try compositionVideo.insertTimeRange(
            CMTimeRange(start: .zero, duration: duration),
            of: videoTrack,
            at: .zero
        )

        if let narrationTrack = try await narration.loadTracks(withMediaType: .audio).first {
            let narrationDuration = try await narration.load(.duration)
            let usableDuration = CMTimeMinimum(duration, narrationDuration)
            let compositionAudio = try requiredMutableTrack(in: composition, mediaType: .audio)
            try compositionAudio.insertTimeRange(
                CMTimeRange(start: .zero, duration: usableDuration),
                of: narrationTrack,
                at: .zero
            )
        }

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRange(start: .zero, duration: duration)
        let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: compositionVideo)
        let normalizedTransform = preferredTransform.translatedBy(
            x: -transformedRect.minX,
            y: -transformedRect.minY
        )
        layerInstruction.setTransform(normalizedTransform, at: .zero)
        instruction.layerInstructions = [layerInstruction]

        let videoComposition = AVMutableVideoComposition()
        videoComposition.instructions = [instruction]
        videoComposition.renderSize = renderSize
        videoComposition.frameDuration = CMTime(value: 1, timescale: 30)

        let videoLayer = CALayer()
        videoLayer.frame = CGRect(origin: .zero, size: renderSize)
        let overlayLayer = CALayer()
        overlayLayer.frame = videoLayer.frame
        overlayLayer.masksToBounds = true
        addCaptions(to: overlayLayer, renderSize: renderSize, duration: duration.seconds)

        let parentLayer = CALayer()
        parentLayer.frame = videoLayer.frame
        parentLayer.addSublayer(videoLayer)
        parentLayer.addSublayer(overlayLayer)
        videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(
            postProcessingAsVideoLayer: videoLayer,
            in: parentLayer
        )

        try? FileManager.default.removeItem(at: outputURL)
        guard let exporter = AVAssetExportSession(
            asset: composition,
            presetName: AVAssetExportPresetHighestQuality
        ) else {
            throw RendererError.exporter
        }
        exporter.videoComposition = videoComposition
        try await exporter.export(to: outputURL, as: .mp4)
        print(outputURL.path)
    }

    private static func requiredTrack(
        in asset: AVAsset,
        mediaType: AVMediaType
    ) async throws -> AVAssetTrack {
        guard let track = try await asset.loadTracks(withMediaType: mediaType).first else {
            throw RendererError.missingTrack(mediaType.rawValue)
        }
        return track
    }

    private static func requiredMutableTrack(
        in composition: AVMutableComposition,
        mediaType: AVMediaType
    ) throws -> AVMutableCompositionTrack {
        guard let track = composition.addMutableTrack(
            withMediaType: mediaType,
            preferredTrackID: kCMPersistentTrackID_Invalid
        ) else {
            throw RendererError.missingTrack(mediaType.rawValue)
        }
        return track
    }

    private static func addCaptions(
        to parent: CALayer,
        renderSize: CGSize,
        duration: Double
    ) {
        let captions = [
            Caption(start: 0, end: 6, title: "TriWaveX", detail: "Entrena con una dirección clara"),
            Caption(start: 6, end: 14, title: "Hoy", detail: "Tu próxima sesión, clara y preparada"),
            Caption(start: 14, end: 22, title: "Plan", detail: "Consulta, adapta y completa tu semana"),
            Caption(start: 22, end: 30, title: "Progreso", detail: "Entiende tu carga, recuperación y evolución"),
            Caption(start: 30, end: 38, title: "Chat", detail: "Tu entrenador y la asistencia inteligente, contigo"),
            Caption(start: 38, end: 48, title: "Perfil", detail: "Plan, lesiones, fisiología y dispositivos"),
            Caption(start: 48, end: max(49, duration), title: "7 días gratis", detail: "Empieza a entrenar con claridad"),
        ]

        for caption in captions where caption.start < duration {
            let horizontalInset = renderSize.width * 0.055
            let panelHeight = renderSize.height * 0.108
            let panelFrame = CGRect(
                x: horizontalInset,
                y: renderSize.height * 0.055,
                width: renderSize.width - (horizontalInset * 2),
                height: panelHeight
            )
            let panel = CALayer()
            panel.frame = panelFrame
            panel.contents = captionImage(
                caption,
                size: panelFrame.size,
                cornerRadius: panelHeight * 0.24
            )
            panel.contentsGravity = .resizeAspectFill
            panel.contentsScale = 3
            panel.opacity = 0
            panel.add(opacityAnimation(for: caption, duration: duration), forKey: "caption")
            parent.addSublayer(panel)
        }
    }

    private static func captionImage(
        _ caption: Caption,
        size: CGSize,
        cornerRadius: CGFloat
    ) -> CGImage? {
        guard let bitmap = NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: Int(size.width.rounded()),
            pixelsHigh: Int(size.height.rounded()),
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .deviceRGB,
            bytesPerRow: 0,
            bitsPerPixel: 0
        ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else { return nil }

        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = context
        defer { NSGraphicsContext.restoreGraphicsState() }

        NSColor.black.withAlphaComponent(0.72).setFill()
        NSBezierPath(
            roundedRect: CGRect(origin: .zero, size: size),
            xRadius: cornerRadius,
            yRadius: cornerRadius
        ).fill()

        let horizontalInset = size.height * 0.18
        let width = size.width - (horizontalInset * 2)
        let titleAttributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: size.height * 0.24, weight: .bold),
            .foregroundColor: NSColor.white,
        ]
        let detailAttributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: size.height * 0.15, weight: .medium),
            .foregroundColor: NSColor.white.withAlphaComponent(0.82),
        ]
        (caption.title as NSString).draw(
            in: CGRect(
                x: horizontalInset,
                y: size.height * 0.50,
                width: width,
                height: size.height * 0.30
            ),
            withAttributes: titleAttributes
        )
        (caption.detail as NSString).draw(
            in: CGRect(
                x: horizontalInset,
                y: size.height * 0.19,
                width: width,
                height: size.height * 0.22
            ),
            withAttributes: detailAttributes
        )

        context.flushGraphics()
        return bitmap.cgImage
    }

    private static func opacityAnimation(for caption: Caption, duration: Double) -> CAKeyframeAnimation {
        let fade = min(0.35, max(0.15, (caption.end - caption.start) * 0.08))
        let start = max(0, caption.start / duration)
        let fadeIn = min(1, (caption.start + fade) / duration)
        let fadeOut = max(0, (min(caption.end, duration) - fade) / duration)
        let end = min(1, caption.end / duration)
        let animation = CAKeyframeAnimation(keyPath: "opacity")
        animation.values = [0, 0, 1, 1, 0, 0]
        animation.keyTimes = [0, NSNumber(value: start), NSNumber(value: fadeIn), NSNumber(value: fadeOut), NSNumber(value: end), 1]
        animation.duration = duration
        animation.beginTime = AVCoreAnimationBeginTimeAtZero
        animation.fillMode = .both
        animation.isRemovedOnCompletion = false
        return animation
    }
}

enum RendererError: LocalizedError {
    case usage
    case missingTrack(String)
    case exporter

    var errorDescription: String? {
        switch self {
        case .usage:
            return "Uso: render-product-video <entrada.mp4> <locucion.aiff> <salida.mp4>"
        case .missingTrack(let type):
            return "No se ha encontrado la pista requerida: \(type)"
        case .exporter:
            return "No se ha podido crear el exportador de vídeo."
        }
    }
}
