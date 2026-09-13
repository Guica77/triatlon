import CoreLocation
import Observation
import WeatherKit

@MainActor @Observable
final class TrainingWeatherService {
    enum State: Equatable { case idle, loading, ready, unavailable }

    private(set) var state: State = .idle
    private(set) var summary = "Ubicación necesaria"
    private(set) var trainingAdvice: String?

    func refresh(for location: CLLocation?) async {
        guard let location else {
            state = .unavailable
            summary = "Ubicación necesaria"
            trainingAdvice = nil
            return
        }
        state = .loading
        do {
            let weather = try await WeatherService.shared.weather(for: location)
            let current = weather.currentWeather
            let temperature = Int(current.temperature.value.rounded())
            let wind = Int(current.wind.speed.converted(to: .kilometersPerHour).value.rounded())
            let humidity = Int((current.humidity * 100).rounded())
            summary = "\(temperature)° · \(humidity)% humedad · viento \(wind) km/h"
            trainingAdvice = recommendation(temperature: temperature, humidity: humidity, wind: wind)
            state = .ready
        } catch {
            state = .unavailable
            summary = "Tiempo no disponible"
            trainingAdvice = nil
        }
    }

    private func recommendation(temperature: Int, humidity: Int, wind: Int) -> String? {
        if temperature >= 28 || (temperature >= 24 && humidity >= 70) {
            return "Calor previsto: baja el ritmo, hidrátate y evita las horas centrales."
        }
        if temperature <= 3 {
            return "Frío previsto: calienta más tiempo y lleva una capa ligera."
        }
        if wind >= 30 {
            return "Viento intenso: ajusta el ritmo por esfuerzo y elige un recorrido resguardado."
        }
        return "Condiciones adecuadas para seguir el entrenamiento previsto."
    }
}
