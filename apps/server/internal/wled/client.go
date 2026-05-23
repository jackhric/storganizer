// Package wled provides an HTTP client for the WLED JSON API.
// It has no PocketBase dependency and can be imported by any module.
//
// WLED API reference: https://kno.wled.ge/interfaces/json-api/
package wled

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client communicates with a single WLED device.
type Client struct {
	baseURL string
	http    *http.Client
}

// NewClient returns a Client targeting the given WLED base URL (e.g. "http://192.168.1.42").
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 3 * time.Second},
	}
}

// Info holds the subset of /json/info we care about.
type Info struct {
	LEDs struct {
		Count  int `json:"count"`
		Matrix struct {
			Width  int `json:"w"`
			Height int `json:"h"`
		} `json:"matrix"`
	} `json:"leds"`
}

// FetchInfo retrieves device metadata from GET /json/info.
func (c *Client) FetchInfo(ctx context.Context) (*Info, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/json/info", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var info Info
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("decode /json/info: %w", err)
	}
	return &info, nil
}

// LEDColor represents a single LED position and its target RGB color.
type LEDColor struct {
	Index int
	R, G, B uint8
}

// Highlight sets specific LEDs to their colors with a black background on all
// other LEDs. Sends a single POST /json/state request.
//
// The WLED "i" (individual) array format: [index, r, g, b, index, r, g, b, ...]
// LEDs not listed will use the segment color, which we set to black.
func (c *Client) Highlight(ctx context.Context, leds []LEDColor) error {
	// Build individual LED array: flat [idx, r, g, b] tuples.
	i := make([]int, 0, len(leds)*4)
	for _, led := range leds {
		i = append(i, led.Index, int(led.R), int(led.G), int(led.B))
	}

	return c.postState(ctx, map[string]any{
		"on":  true,
		"bri": 200,
		"seg": []map[string]any{{
			"col": [][]int{{0, 0, 0}}, // black background
			"i":   i,
		}},
	})
}

// Clear turns off all LEDs by setting the device to off.
func (c *Client) Clear(ctx context.Context) error {
	return c.postState(ctx, map[string]any{"on": false})
}

func (c *Client) postState(ctx context.Context, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/json/state", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("WLED returned HTTP %d", resp.StatusCode)
	}
	return nil
}
