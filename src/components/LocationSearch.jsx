import { useState, useRef } from "react";

function LocationSearch({ placeholder, setLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const timeoutRef = useRef(null);

  const searchPlaces = async (value) => {
    console.log(import.meta.env.VITE_GEOAPIFY_API_KEY);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value
        )}&filter=countrycode:in&limit=5&apiKey=${
          import.meta.env.VITE_GEOAPIFY_API_KEY
        }`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch locations");
      }

      const data = await res.json();
      setResults(data.features || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    }
  };

  const choosePlace = (place) => {
    setQuery(place.properties.formatted);

    setLocation({
      address: place.properties.formatted,
      lat: place.properties.lat,
      lng: place.properties.lon,
    });

    setResults([]);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);

          clearTimeout(timeoutRef.current);

          timeoutRef.current = setTimeout(() => {
            searchPlaces(value);
          }, 300);
        }}
        className="w-full bg-[#1E293B] text-white p-4 rounded-xl border border-gray-600 focus:border-[#FFBE0B] outline-none"
      />

      {results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
          {results.map((place, index) => (
            <div
              key={`${place.properties.place_id}-${index}`}
              onClick={() => choosePlace(place)}
              className="p-3 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer text-black"
            >
              {place.properties.formatted}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationSearch;