package warls

import (
	"github.com/storganizer/server/internal/app"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

// Module owns WARLS streaming to WLED devices. It exposes a single WebSocket
// endpoint per session; the session publishes its desired LED state for any
// number of devices and the module's Registry holds those LEDs on the strip
// (via repeated WARLS UDP packets) until the session disconnects or stops
// claiming the device.
type Module struct {
	registry *Registry
}

func New() *Module { return &Module{registry: NewRegistry()} }

func (m *Module) Name() string                { return "warls" }
func (m *Module) Dependencies() []string      { return []string{"devices"} }
func (m *Module) Migrations() []app.Migration { return nil }
func (m *Module) Init(_ core.App) error       { return nil }
func (m *Module) RegisterHooks(_ core.App)    {}

// RegisterRoutes adds:
//
//	GET /api/warls/stream — WebSocket; frontend publishes per-device LED
//	  frames, backend forwards as WARLS UDP and keeps them alive until the
//	  session disconnects.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.GET("/api/warls/stream", newSessionHandler(m.registry))
}
