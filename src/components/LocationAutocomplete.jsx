import { useEffect, useRef, useState } from "react";

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

// Mumbai center
const MUMBAI = {
  lat: 19.076,
  lng: 72.8777,
};

function LocationAutocomplete({
  label,
  placeholder,
  value,
  onSelect,
}) {
  const [query, setQuery] = useState(
    value?.address || value?.name || ""
  );

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const requestRef = useRef(0);

  // ============================================================
  // KEEP INPUT IN SYNC WITH SELECTED LOCATION
  // ============================================================

  useEffect(() => {
    if (value) {
      setQuery(
        value.address ||
          value.name ||
          value.shortName ||
          ""
      );
    } else {
      setQuery("");
    }
  }, [value]);

  // ============================================================
  // CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setSuggestions([]);
        setIsFocused(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      requestRef.current += 1;
    };
  }, []);

  // ============================================================
  // SEARCH LOCATIONS
  // ============================================================

  const searchLocations = async (text) => {
    const searchText = text.trim();

    if (searchText.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (!API_KEY) {
      setSuggestions([]);
      setLoading(false);

      setError(
        "Geoapify API key is missing. Check your .env file."
      );

      return;
    }

    const requestId = ++requestRef.current;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        text: searchText,
        apiKey: API_KEY,
        format: "geojson",
        limit: "10",

        // Search inside India
        filter: "countrycode:in",

        // Prefer Mumbai results
        bias: `proximity:${MUMBAI.lng},${MUMBAI.lat}`,

        // English results
        lang: "en",
      });

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Geoapify returned ${response.status}`
        );
      }

      const data = await response.json();

      // Ignore old requests
      if (requestId !== requestRef.current) {
        return;
      }

      const features = Array.isArray(data.features)
        ? data.features
        : [];

      const results = features
        .map((feature) => {
          const properties = feature.properties || {};

          const lat = Number(properties.lat);
          const lng = Number(properties.lon);

          // Invalid coordinates
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return null;
          }

          const name =
            properties.name ||
            properties.address_line1 ||
            properties.formatted ||
            "Unknown location";

          const address =
            properties.formatted ||
            properties.address_line2 ||
            name;

          const secondary =
            properties.address_line2 ||
            [
              properties.city,
              properties.state,
            ]
              .filter(Boolean)
              .join(", ");

          return {
            id:
              properties.place_id ||
              `${lat}-${lng}-${address}`,

            name,

            shortName:
              properties.name ||
              properties.address_line1 ||
              name,

            address,

            formattedAddress: address,

            secondary,

            lat,

            lng,

            type:
              properties.result_type ||
              properties.datasource?.raw?.place_type ||
              "location",
          };
        })
        .filter(Boolean);

      setSuggestions(results);
    } catch (err) {
      console.error(
        "Location autocomplete error:",
        err
      );

      if (requestId === requestRef.current) {
        setSuggestions([]);

        setError(
          "Unable to search locations. Please try again."
        );
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (event) => {
    const text = event.target.value;

    setQuery(text);
    setIsFocused(true);
    setError("");

    // If user starts typing again,
    // previous selected location becomes invalid.
    onSelect?.(null);

    clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      searchLocations(text);
    }, 300);
  };

  // ============================================================
  // SELECT LOCATION
  // ============================================================

  const handleSelect = (location) => {
    setQuery(
      location.address ||
        location.name
    );

    setSuggestions([]);
    setIsFocused(false);
    setError("");

    // Send complete location object
    // back to BookRide.jsx
    onSelect?.({
      id: location.id,

      lat: location.lat,

      lng: location.lng,

      name: location.name,

      shortName:
        location.shortName ||
        location.name,

      address:
        location.address ||
        location.name,

      formattedAddress:
        location.formattedAddress ||
        location.address ||
        location.name,

      secondary:
        location.secondary ||
        "",
    });
  };

  // ============================================================
  // CLEAR LOCATION
  // ============================================================

  const clearLocation = () => {
    setQuery("");
    setSuggestions([]);
    setError("");
    setIsFocused(false);

    onSelect?.(null);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      ref={wrapperRef}
      className="relative mb-5"
    >
      {/* LABEL */}

      <label className="block text-sm font-bold text-gray-400 mb-2">
        {label}
      </label>

      {/* INPUT */}

      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setIsFocused(true);

            if (query.trim().length >= 2) {
              searchLocations(query);
            }
          }}
          onChange={handleChange}
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 pr-12 outline-none focus:border-[#FFBE0B] transition"
        />

        {/* LOADING */}

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 rounded-full border-2 border-gray-600 border-t-[#FFBE0B] animate-spin" />
          </div>
        )}

        {/* CLEAR BUTTON */}

        {!loading && query && (
          <button
            type="button"
            onClick={clearLocation}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <p className="text-red-400 text-xs mt-2">
          {error}
        </p>
      )}

      {/* LOCATION SUGGESTIONS */}

      {isFocused &&
        suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-[2000] overflow-hidden rounded-2xl border border-white/10 bg-[#11151F] shadow-2xl">
            {suggestions.map((location) => (
              <button
                key={location.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();

                  handleSelect(location);
                }}
                className="w-full text-left px-4 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.07] transition"
              >
                <div className="flex items-start gap-3">

                  {/* ICON */}

                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/10 text-[#FFBE0B]">
                    📍
                  </div>

                  {/* LOCATION TEXT */}

                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {location.name}
                    </p>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {location.secondary ||
                        location.address}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

      {/* NO RESULTS */}

      {isFocused &&
        query.trim().length >= 2 &&
        !loading &&
        !error &&
        suggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-[2000] rounded-2xl border border-white/10 bg-[#11151F] p-5 shadow-2xl">
            <p className="text-sm text-gray-500">
              No locations found
            </p>
          </div>
        )}
    </div>
  );
}

export default LocationAutocomplete;