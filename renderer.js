/**
 * =========================================================
 * JOMJALAN - CUTI-CUTI MALAYSIA TRAVEL PORTAL
 * Renderer Script (A-to-Z Customizable Holiday Planner)
 * =========================================================
 */

// =========================================================
// SECTION 1: TAB NAVIGATION LOGIC
// =========================================================

/**
 * Switches active visibility between the Explorer view and Dashboard view tabs.
 * @param {string} tabName - The identifier name of the target container ('explorer' or 'plans').
 */
function switchTab(tabName) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.getElementById('btn-' + tabName).classList.add('active');
}

// Global Variables for State Management & Calculations
let currentPackages = [];
let latestCalculatedData = null; 
let appliedDiscountRate = 0; 
let appliedDiscountFixed = 0;
let cachedWeatherData = null;

let internalTransportCost = 0;
let internalHotelCost = 0;

// Standard Accommodation Options Template
const defaultAccommodationOptions = `
    <option value="">-- Select Accommodation Type --</option>
    <option value="80">Backpacker Hostel / Homestay (RM 80 / night)</option>
    <option value="200">3-Star Hotel / Resort (RM 200 / night)</option>
    <option value="450">5-Star Luxury Resort (RM 450 / night)</option>
    <option value="custom">Custom Accommodation Amount</option>
`;

// Geographic Coordinates mapping for Open-Meteo API integration across all 14 states/territories
const stateCoordinates = {
    "Johor": { lat: 1.4927, lon: 103.7414 },
    "Kedah": { lat: 6.1184, lon: 100.3685 },
    "Kelantan": { lat: 6.1254, lon: 102.2381 },
    "Melaka": { lat: 2.1896, lon: 102.2501 },
    "Negeri Sembilan": { lat: 2.7258, lon: 101.9424 },
    "Pahang": { lat: 3.8077, lon: 103.3260 },
    "Perak": { lat: 4.5921, lon: 101.0901 },
    "Perlis": { lat: 6.4449, lon: 100.2048 },
    "Pulau Pinang": { lat: 5.4141, lon: 100.3288 },
    "Sabah": { lat: 5.9804, lon: 116.0735 },
    "Sarawak": { lat: 1.5533, lon: 110.3592 },
    "Selangor": { lat: 3.0738, lon: 101.5183 },
    "Terengganu": { lat: 5.3117, lon: 103.1324 },
    "Kuala Lumpur": { lat: 3.1390, lon: 101.6869 }
};

/**
 * Translates numerical WMO weather codes into readable description strings.
 * @param {number} code - WMO weather interpretation code.
 * @returns {string} Human-readable weather description.
 */
function getWeatherDescription(code) {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 67) return "Light Rain / Drizzle";
    if (code >= 80 && code <= 82) return "Heavy Rain Showers";
    if (code >= 95) return "Thunderstorm";
    return "Cloudy";
}

// =========================================================
// SECTION 2: EXTERNAL API, RECOMMENDATIONS & FOOD SUGGESTIONS
// =========================================================

async function fetchMalaysianDestinationData() {
    const state = document.getElementById('stateSelect').value;
    const errorDiv = document.getElementById('errorExplorer');
    errorDiv.innerText = "";

    if (!state) {
        document.getElementById('resultCard').style.display = 'none';
        return;
    }

    const travelDate = document.getElementById('travelDateSelect').value;
    if (!travelDate) {
        errorDiv.innerText = "Please select a travel date to view weather insights";
        document.getElementById('resultCard').style.display = 'none';
        return;
    }

    document.getElementById('resState').innerText = state;
    document.getElementById('resWeather').innerText = "Loading...";
    document.getElementById('resTemp').innerText = "Loading...";
    document.getElementById('resWindSpeed').innerText = "Loading...";
    document.getElementById('resUVIndex').innerText = "Loading...";
    document.getElementById('resElevation').innerText = "Loading...";
    document.getElementById('resultCard').style.display = 'block';

    try {
        const coords = stateCoordinates[state] || { lat: 3.1390, lon: 101.6869 };
        let apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,uv_index_max&forecast_days=16&timezone=auto`;
        let response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Weather API request failed.");
        cachedWeatherData = await response.json();
        updateWeatherForSelectedDate();

        let foodSuggestions = [];
        
        // Define localized food options and preset packages based on selected state
        if (state === "Johor") {
            foodSuggestions = ["Authentic Laksa Johor", "Mee Rebus Stulang Laut", "Kacang Pool Haji Larkin", "Johor Bahru Bak Kut Teh", "Otak-Otak Kempas / Muar"];
            currentPackages = [
                { name: "LEGOLAND & Hotel Package (3D2N)", days: 3, price: 500, accType: "Included: LEGOLAND Theme Hotel (Family Suite)" },
                { name: "Danga Bay Leisure Trip (2D1N)", days: 2, price: 250, accType: "Included: Danga Bay Beachfront Resort" }
            ];
        } else if (state === "Kedah") {
            foodSuggestions = ["Langkawi Laksa Power", "Nasi Ulam Cik Dah", "Laksa Telok Keai", "Gulai Nangka Beratur Alor Setar", "Nasi Daging Air Asam"];
            currentPackages = [
                { name: "Langkawi Getaway Package (3D2N)", days: 3, price: 450, accType: "Included: 3-Star Beachfront Resort (Pantai Cenang)" },
                { name: "Island Hopping & Cable Car (2D1N)", days: 2, price: 280, accType: "Included: Langkawi Town Hotel (Standard Room)" }
            ];
        } else if (state === "Kelantan") {
            foodSuggestions = ["Nasi Kerabu Khusus Tok Bali", "Nasi Dagang Kelantan", "Laksam Kelantan", "Nasi Tumpang", "Colek Malam Kota Bharu"];
            currentPackages = [{ name: "Kelantan Culture & Food Trip (2D1N)", days: 2, price: 200, accType: "Included: Kota Bharu Heritage Hotel" }];
        } else if (state === "Melaka") {
            foodSuggestions = ["Melaka Chicken Rice Ball", "Asam Pedas Claypot Restoran Kota", "Nyonya Cendol Jonker Walk", "Satay Celup Capitol", "Kuih Keria Antarabangsa Limbongan"];
            currentPackages = [
                { name: "Melaka Heritage Weekend (2D1N)", days: 2, price: 230, accType: "Included: Jonker Boutique Hotel" },
                { name: "River Cruise & City Stay (3D2N)", days: 3, price: 320, accType: "Included: 4-Star Melaka Riverfront Hotel" }
            ];
        } else if (state === "Negeri Sembilan") {
            foodSuggestions = ["Daging Salai Masak Lemak Cili Api", "Gulai Itik Salai Rembau", "Seremban Siew Pow", "Cendol Wahyu Seremban", "Mee Laksam Negeri Sembilan"];
            currentPackages = [{ name: "Port Dickson Beach Resort Trip (3D2N)", days: 3, price: 380, accType: "Included: Port Dickson Seafront Villa" }];
        } else if (state === "Pahang") {
            foodSuggestions = ["Gulai Tempoyak Ikan Patin Temerloh", "Hot Steamboat Cameron Highlands", "Pahang Nasi Dagang", "Puding Raja Pekan", "Mee Calong Kuantan"];
            currentPackages = [
                { name: "Cameron Highlands Nature Tour (3D2N)", days: 3, price: 300, accType: "Included: Tudor-Style Highland Resort" },
                { name: "Genting SkyWorlds Park Trip (2D1N)", days: 2, price: 450, accType: "Included: Genting First World Hotel" }
            ];
        } else if (state === "Perak") {
            foodSuggestions = ["Ipoh White Coffee & Taugeh Chicken", "Nasi Vanggey (Nasi Ganja Ipoh)", "Rendang Tok Perak", "Laksa Teluk Intan", "Cendol Abang Kacak Taiping"];
            currentPackages = [
                { name: "Lost World of Tambun & Ipoh Food Trip (2D1N)", days: 2, price: 350, accType: "Included: Lost World Hotel & Hot Spring Pass" },
                { name: "Pulau Pangkor Island Retreat (3D2N)", days: 3, price: 400, accType: "Included: Pangkor Beach Chalet" }
            ];
        } else if (state === "Perlis") {
            foodSuggestions = ["Laksa Perlis", "Ikan Bakar Kuala Perlis", "Pulut Mempelam (Mango Pulut)", "Pekasam Ikan", "Daging Harimau Menangis Perlis"];
            currentPackages = [{ name: "Perlis Indera Kayangan Explorer (2D1N)", days: 2, price: 180, accType: "Included: Kangar City Hotel" }];
        } else if (state === "Pulau Pinang") {
            foodSuggestions = ["Penang Nasi Kandar Line Clear", "Penang Char Kway Teow", "Penang Asam Laksa", "Teochew Chendul Penang Road", "Pasembur Gurney Drive"];
            currentPackages = [
                { name: "Penang Food & Heritage Tour (2D1N)", days: 2, price: 200, accType: "Included: Georgetown Heritage Hotel" },
                { name: "ESCAPE Theme Park & Hotel Trip (3D2N)", days: 3, price: 420, accType: "Included: Batu Ferringhi Beach Resort" }
            ];
        } else if (state === "Sabah") {
            foodSuggestions = ["Tuaran Mee Sabah", "Hinava (Sabah Traditional Fish Salad)", "Beaufort Mee", "Soto Sabah Kota Kinabalu", "Seafood Feast at Welcom Restaurant"];
            currentPackages = [
                { name: "Kundasang & Kinabalu Park Trip (3D2N)", days: 3, price: 480, accType: "Included: Kundasang Mountain View Lodge" },
                { name: "Tunku Abdul Rahman Marine Park (2D1N)", days: 2, price: 260, accType: "Included: KK City Waterfront Hotel" }
            ];
        } else if (state === "Sarawak") {
            foodSuggestions = ["Authentic Sarawak Laksa", "Kolo Mee Kuching", "Midin Stir-Fry Jungle Fern", "Manok Pansoh (Bamboo Chicken)", "Kek Lapis Sarawak"];
            currentPackages = [{ name: "Kuching Heritage & Cultural Trip (3D2N)", days: 3, price: 390, accType: "Included: Kuching Waterfront Hotel" }];
        } else if (state === "Selangor") {
            foodSuggestions = ["Famous Satay Kajang Haji Samuri", "Lontong Klang", "Nasi Lemak Kukus Shah Alam", "Bak Kut Teh Klang", "Mee Rebus Selangor"];
            currentPackages = [{ name: "Sunway Lagoon Theme Park Staycation (2D1N)", days: 2, price: 450, accType: "Included: Sunway Resort Hotel Suite" }];
        } else if (state === "Terengganu") {
            foodSuggestions = ["Keropok Lekor Fresh", "Nasi Dagang Terengganu", "Nasi Kerabu Terengganu", "Sata & Otak-Otak Celup Tepung", "Laksam Terengganu"];
            currentPackages = [
                { name: "Redang Island Snorkeling Package (3D2N)", days: 3, price: 550, accType: "Included: Redang Beach Resort Chalet" },
                { name: "Perhentian Island Trip (3D2N)", days: 3, price: 500, accType: "Included: Perhentian Island Lagoon Lodge" }
            ];
        } else {
            foodSuggestions = ["Nasi Lemak Wanjo Kampung Baru", "Jalan Alor Street Food Feast", "Roti John Titiwangsa", "Nasi Kandar Pelita KLCC", "Cendol Durian Chow Kit"];
            currentPackages = [{ name: "KL City Staycation & Aquaria Trip (2D1N)", days: 2, price: 300, accType: "Included: Bukit Bintang 4-Star Hotel" }];
        }

        let foodContainer = document.getElementById('foodSuggestionsContainer');
        foodContainer.innerHTML = '<ul>' + foodSuggestions.map(item => `<li>🍲 ${item}</li>`).join('') + '</ul>';

        let packageSelect = document.getElementById('packageSelect');
        packageSelect.innerHTML = '<option value="">-- Select A Package Preset (Or Build Manual Below) --</option>';
        currentPackages.forEach((pkg, index) => {
            packageSelect.innerHTML += `<option value="${index}">${pkg.name} - Est. RM${pkg.price}</option>`;
        });
        document.getElementById('selectedPackageNotice').innerText = "";

        document.getElementById('customDestName').value = "Trip to " + state;
        document.getElementById('accommodationSelect').innerHTML = defaultAccommodationOptions;
        internalHotelCost = 0;
        document.getElementById('nightBreakdown').innerText = "";

    } catch (error) {
    errorDiv.innerText = "API Note: Loaded in offline mode (Live weather unavailable).";
    document.getElementById('resState').innerText = state + " ";
    document.getElementById('resWeather').innerText = "Sunny & Clear";
    document.getElementById('resTemp').innerText = "31°C";
    document.getElementById('resWindSpeed').innerText = "10.0 km/h";
    document.getElementById('resUVIndex').innerText = "Index 5.0 (Moderate)";
    document.getElementById('resElevation').innerText = "0 meters";
    }
}

/**
 * Generates context-aware activity lists depending on whether the weather is rainy or sunny.
 * @param {string} state - The name of the selected state.
 * @param {boolean} isRainy - Flag indicating precipitation condition.
 * @returns {string[]} Array of recommendation strings.
 */
function getStateActivities(state, isRainy) {
    let activities = [];

    switch (state) {
        case "Johor":
            if (isRainy) {
                activities = [
                    "Indoor fun at LEGOLAND Theme Park (Indoor sections & SEA LIFE Aquarium)",
                    "Shopping and dining at Paradigm Mall JB",
                    "Visit Sultan Abu Bakar Royal Museum",
                    "Indoor rock climbing or cafe hopping in JB",
                    "Explore R&F Mall indoor attractions"
                ];
            } else {
                activities = [
                    "Explore LEGOLAND Malaysia Resort theme park",
                    "Hike and explore Endau-Rompin National Park",
                    "Relax and enjoy breeze at Desaru Coast Beach",
                    "Outdoor shopping at Johor Premium Outlets (JPO)",
                    "Sightseeing around Sultan Abu Bakar State Mosque"
                ];
            }
            break;

        case "Kedah":
            if (isRainy) {
                activities = [
                    "Explore Langkawi 3D Art in Paradise Museum (Indoor)",
                    "Visit Paddy Museum (Muzium Padi) Alor Setar",
                    "Indoor shopping & duty-free browsing at Kuah Town",
                    "Relax at local indoor cafes & try Laksa Telok Keai",
                    "Visit Zahir Mosque heritage gallery"
                ];
            } else {
                activities = [
                    "Ride the Langkawi SkyCab & SkyBridge",
                    "Relax and sunbathe at Pantai Cenang beach",
                    "Island Hopping around Pulau Dayang Bunting",
                    "Explore Kilim Karst Geoforest Park boat tour",
                    "Visit Eagle Square (Dataran Lang)"
                ];
            }
            break;

        case "Kelantan":
            if (isRainy) {
                activities = [
                    "Indoor shopping at Pasar Siti Khadijah (Covered Market)",
                    "Visit Muzium Diraja Istana Jahar (Indoor Heritage)",
                    "Explore Bank Kerapu World War II Museum",
                    "Discover traditional crafts at Kampung Kraftangan",
                    "Visit Wat Photivihan Sleeping Buddha (Covered Pavilion)"
                ];
            } else {
                activities = [
                    "Relax and walk along Pantai Cahaya Bulan beach",
                    "Outdoor culture walk around Kota Bharu Cultural Zone",
                    "Explore Tok Bali Fishermen Harbor",
                    "Sightseeing at Dataran Al-Khatiri",
                    "Take photos at Min House Camp & Butterfly Garden"
                ];
            }
            break;

        case "Melaka":
            if (isRainy) {
                activities = [
                    "Explore Baba & Nyonya Heritage Museum (Indoor)",
                    "Visit Melaka Sultanate Palace Museum",
                    "Indoor shopping at Dataran Pahlawan Melaka Megamall",
                    "Try Jonker Walk indoor Nyonya restaurants",
                    "Visit Maritime Museum Muzium Samudera"
                ];
            } else {
                activities = [
                    "Explore A Famosa Fort & Stadthuys square",
                    "Walk along Jonker Street Night Market",
                    "Take the scenic Melaka River Cruise",
                    "Ride the Taming Sari Gyro Tower",
                    "Relax at Klebang Sand Dunes"
                ];
            }
            break;

        case "Negeri Sembilan":
            if (isRainy) {
                activities = [
                    "Visit Army Museum Port Dickson (Indoor Galleries)",
                    "Explore Alive 3D Art Gallery Port Dickson",
                    "Visit Custom Museum (Muzium Adat) Jelebu",
                    "Indoor dining & cafe hopping in Seremban",
                    "Explore Palm Mall Seremban indoor leisure"
                ];
            } else {
                activities = [
                    "Water sports & swimming at Port Dickson beaches",
                    "Hike Mount Datuk in Rembau for panoramic views",
                    "Visit historic Seri Menanti Royal Palace",
                    "Explore Cape Rachado Lighthouse & forest reserve",
                    "Relax at Ostrich Show Farm Port Dickson"
                ];
            }
            break;

        case "Pahang":
            if (isRainy) {
                activities = [
                    "Indoor theme park fun at Skytropolis Genting",
                    "Visit Lavender Garden indoor glasshouse (Cameron)",
                    "Explore Time Tunnel Museum Cameron Highlands",
                    "Indoor tea tasting at Boh Tea Centre (Visitor Centre)",
                    "Shopping at SkyAvenue Genting Highlands"
                ];
            } else {
                activities = [
                    "Explore Mossy Forest boardwalk trail (Cameron Highlands)",
                    "Visit Boh Tea Plantation scenic viewpoints",
                    "Outdoor fun at Genting SkyWorlds Theme Park",
                    "Explore Taman Negara national park jungle trekking",
                    "Relax at Teluk Chempedak beach Kuantan"
                ];
            }
            break;

        case "Perak":
            if (isRainy) {
                activities = [
                    "Visit Ipoh World at Han Chin Pet Soo (Indoor Museum)",
                    "Explore Perak Museum Taiping (Oldest Museum in Malaysia)",
                    "Indoor dining at Ipoh Old Town heritage cafes",
                    "Explore Geological Museum Ipoh",
                    "Shopping at Ipoh Parade Megamall"
                ];
            } else {
                activities = [
                    "Explore Gua Tempurung limestone caves",
                    "Have outdoor fun at Sunway Lost World of Tambun",
                    "Visit historical Kellie's Castle in Batu Gajah",
                    "Relax on white sandy beaches at Pulau Pangkor",
                    "Walk around scenic Taiping Lake Gardens"
                ];
            }
            break;

        case "Perlis":
            if (isRainy) {
                activities = [
                    "Explore Gua Kelam limestone cave (Covered Walkway)",
                    "Visit Kota Kayang Museum indoor heritage gallery",
                    "Indoor local dining & trying Laksa Perlis",
                    "Explore Tuanku Syed Putra Mosque",
                    "Visit Perlis Crafts Complex (Kompleks Kraf)"
                ];
            } else {
                activities = [
                    "Scenic panoramic views at Wang Kelian Viewpoint",
                    "Walk and relax at Tasik Melati Recreational Park",
                    "Take outdoor photos across Chuping Paddy Fields",
                    "Visit Perlis Herbal Garden & Snake Farm",
                    "Enjoy sunset at Kuala Perlis Waterfront"
                ];
            }
            break;

        case "Pulau Pinang":
            if (isRainy) {
                activities = [
                    "Explore Pinang Peranakan Mansion (Indoor)",
                    "Visit Upside Down Museum & Tech Dome Penang",
                    "Indoor shopping & dining at Gurney Plaza / Paragon",
                    "Discover history at Penang State Museum",
                    "Enjoy traditional Nasi Kandar in covered restaurants"
                ];
            } else {
                activities = [
                    "Explore Georgetown UNESCO Street Art murals",
                    "Ride Penang Hill Funicular Train to the peak",
                    "Visit Kek Lok Si Temple outdoor pagoda",
                    "Outdoor adventure rides at ESCAPE Theme Park",
                    "Relax and enjoy water sports at Batu Ferringhi Beach"
                ];
            }
            break;

        case "Sabah":
            if (isRainy) {
                activities = [
                    "Visit Sabah State Museum & Heritage Village (Indoor)",
                    "Explore Kota Kinabalu City Mosque & Gallery",
                    "Indoor shopping at Imago Shopping Mall KK",
                    "Discover marine life at Green Connection Aquarium",
                    "Try seafood feast at covered Welcome Seafood Restaurant"
                ];
            } else {
                activities = [
                    "Visit Desa Dairy Farm Kundasang (Little New Zealand)",
                    "View Mount Kinabalu at Kinabalu National Park",
                    "Island hopping in Tunku Abdul Rahman Marine Park",
                    "Explore Sepilok Orangutan Rehabilitation Centre",
                    "Watch world-famous sunset at Tanjung Aru Beach"
                ];
            }
            break;

        case "Sarawak":
            if (isRainy) {
                activities = [
                    "Explore Borneo Cultures Museum Kuching (Largest Indoor Museum)",
                    "Visit Kuching Cat Museum & Planetarium",
                    "Discover history at Chinese History Museum Kuching",
                    "Indoor handicraft shopping at Main Bazaar Kuching",
                    "Enjoy authentic Sarawak Laksa at covered food courts"
                ];
            } else {
                activities = [
                    "Visit Sarawak Cultural Village outdoor living museum",
                    "Walk along scenic Kuching Waterfront promenade",
                    "See wild orangutans at Semenggoh Nature Reserve",
                    "Hike and spot wildlife at Bako National Park",
                    "Take photos at giant Kuching Cat Statues"
                ];
            }
            break;

        case "Selangor":
            if (isRainy) {
                activities = [
                    "Indoor fun at District 21 / Trans Studio Mall",
                    "Explore Sultan Alam Shah Museum Shah Alam",
                    "Indoor shopping & ice skating at Sunway Pyramid",
                    "Visit National Science Centre (Pusat Sains Negara)",
                    "Explore Chocolate Museum Kota Damansara"
                ];
            } else {
                activities = [
                    "Water park fun at Sunway Lagoon Theme Park",
                    "Night fireflies boat tour in Kuala Selangor",
                    "Watch i-City City of Digital Lights outdoor park",
                    "Climb Batu Caves rainbow stairs",
                    "Hike Broga Hill Semenyih for sunrise views"
                ];
            }
            break;

        case "Terengganu":
            if (isRainy) {
                activities = [
                    "Explore Terengganu State Museum (Largest Museum Complex)",
                    "Visit Crystal Mosque (Masjid Kristal) indoor hall",
                    "Indoor batik & craft shopping at Pasar Payang",
                    "Learn boat building at Pulau Duyong workshops",
                    "Taste fresh Keropok Lekor at Kampung Losong"
                ];
            } else {
                activities = [
                    "Snorkeling at Redang & Perhentian Islands",
                    "Walk across landmark Kuala Terengganu Drawbridge",
                    "Explore Taman Tamadun Islam outdoor monument park",
                    "Relax at Bukit Keluang beach and cliff walks",
                    "Enjoy beach breeze at Pantai Teluk Ketapang"
                ];
            }
            break;

        case "Kuala Lumpur":
        default:
            if (isRainy) {
                activities = [
                    "Explore Aquaria KLCC oceanarium (Indoor)",
                    "Shopping and indoor dining at Pavilion KL / Suria KLCC",
                    "Visit National Museum (Muzium Negara)",
                    "Science discovery at Petrosains KLCC",
                    "Indoor café hopping in Bukit Bintang"
                ];
            } else {
                activities = [
                    "Snap photos at Petronas Twin Towers (KLCC Park)",
                    "Visit KL Tower Observation Deck",
                    "Explore KL Bird Park (Taman Burung KL)",
                    "Shopping and walking around Bukit Bintang",
                    "Historical walk around Merdeka Square"
                ];
            }
            break;
    }

    return activities;
}

/**
 * Updates weather interface elements when a specific date is chosen by the user.
 */
function updateWeatherForSelectedDate() {
    const errorDiv = document.getElementById('errorExplorer');
    errorDiv.innerText = "";

    const dateInput = document.getElementById('travelDateSelect');
    const selectedDate = dateInput ? dateInput.value : "";
    const state = document.getElementById('stateSelect').value;
    
    if (!state) return;

    if (!selectedDate) {
        errorDiv.innerText = "Please select a travel date to view weather insights";
        document.getElementById('resultCard').style.display = 'none';
        return;
    }

    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('resState').innerText = state + ``;

    if (!cachedWeatherData || !cachedWeatherData.daily) {
        fetchMalaysianDestinationData();
        return;
    }

    const dailyTimes = cachedWeatherData.daily.time;
    const dateIndex = dailyTimes.indexOf(selectedDate);

    if (dateIndex !== -1) {
        let maxTemp = cachedWeatherData.daily.temperature_2m_max[dateIndex];
        let minTemp = cachedWeatherData.daily.temperature_2m_min[dateIndex];
        let weatherCode = cachedWeatherData.daily.weathercode[dateIndex];
        let maxWind = cachedWeatherData.daily.windspeed_10m_max ? cachedWeatherData.daily.windspeed_10m_max[dateIndex] : "10.2";
        
        let rawUV = cachedWeatherData.daily.uv_index_max ? cachedWeatherData.daily.uv_index_max[dateIndex] : null;
        let uvDisplay = "";

        if (rawUV !== null) {
            let uvLevel = "";
            if (rawUV >= 8) uvLevel = "Very High";
            else if (rawUV >= 6) uvLevel = "High";
            else if (rawUV >= 3) uvLevel = "Moderate";
            else uvLevel = "Low";

            uvDisplay = `Index ${rawUV} (${uvLevel})`;
        } else {
            uvDisplay = "N/A";
        }

        let avgTemp = ((maxTemp + minTemp) / 2).toFixed(1);

        document.getElementById('resWeather').innerText = getWeatherDescription(weatherCode);
        document.getElementById('resTemp').innerText = `${avgTemp}°C - Estimated Avg ( Min: ${minTemp}°C | Max: ${maxTemp}°C )`;
        document.getElementById('resWindSpeed').innerText = `${maxWind} km/h`;
        document.getElementById('resUVIndex').innerText = uvDisplay;
        document.getElementById('resElevation').innerText = (cachedWeatherData.elevation !== undefined ? cachedWeatherData.elevation : "0") + " meters";

        let isRainy = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95;
        let weatherAdvice = isRainy 
            ? `🌧️ Rainy Weather Alert for ${state}: Shifting focus to indoor/sheltered attractions.` 
            : `☀️ Clear / Sunny Weather for ${state}: Perfect for outdoor adventures and sightseeing.`;

        let weatherFilteredActivities = getStateActivities(state, isRainy);

        document.getElementById('weatherAdviceContainer').innerText = weatherAdvice;
        let destContainer = document.getElementById('destSuggestionsContainer');
        destContainer.innerHTML = '<ul>' + weatherFilteredActivities.map(item => `<li>📍 ${item}</li>`).join('') + '</ul>';

    } else {
        document.getElementById('resWeather').innerText = "Clear Sky";
        document.getElementById('resTemp').innerText = "28.5°C - Estimated Avg ( Min: 24°C | Max: 33°C )";
        document.getElementById('resWindSpeed').innerText = "12.5 km/h";
        document.getElementById('resUVIndex').innerText = "Index 6.5 (High)";
        document.getElementById('resElevation').innerText = (cachedWeatherData.elevation !== undefined ? cachedWeatherData.elevation : "0") + " meters";
        
        document.getElementById('weatherAdviceContainer').innerText = "☀️ Weather Excellent for Outdoor Activities: Ideal conditions expected for sightseeing and outdoor tours.";
        
        let outdoorFallbackActivities = getStateActivities(state, false);

        let destContainer = document.getElementById('destSuggestionsContainer');
        destContainer.innerHTML = '<ul>' + outdoorFallbackActivities.map(item => `<li>📍 ${item}</li>`).join('') + '</ul>';
    }
}

/**
 * Applies pre-configured travel packages selected from the preset dropdown.
 */
function applySelectedPackage() {
    let index = document.getElementById('packageSelect').value;
    let notice = document.getElementById('selectedPackageNotice');
    let accSelect = document.getElementById('accommodationSelect');

    if (index === "") {
        notice.innerText = "";
        accSelect.innerHTML = defaultAccommodationOptions;
        internalHotelCost = 0;
        document.getElementById('nightBreakdown').innerText = "";
        calculateCustomBudget();
        return;
    }

    let pkg = currentPackages[index];
    
    document.getElementById('calcDays').value = pkg.days;
    internalHotelCost = pkg.price;
    
    accSelect.innerHTML = `<option value="pkg_included" selected>${pkg.accType}</option>`;
    document.getElementById('nightBreakdown').innerText = `☑️ Included in Package: RM${pkg.price}`;
    document.getElementById('customDestName').value = pkg.name;

    notice.innerText = `✅ Applied preset: "${pkg.name}" (${pkg.days} Days, RM${pkg.price} Includes accommodation).`;

    calculateCustomBudget();
}

/**
 * Toggles visibility of the custom transport input field and updates internal transport cost.
 */
function updateTransportCost() {
    let select = document.getElementById('transportSelect').value;
    let customInput = document.getElementById('customTransportInput');

    if (select === "custom") {
        customInput.style.display = 'block';
        customInput.focus();
        internalTransportCost = parseFloat(customInput.value) || 0;
    } else {
        customInput.style.display = 'none';
        customInput.value = "";
        if (select !== "") {
            internalTransportCost = parseFloat(select) || 0;
        } else {
            internalTransportCost = 0;
        }
    }
    calculateCustomBudget();
}

/**
 * Toggles visibility of the custom accommodation input field and computes nightly expenses.
 */
function updateAccommodationCost() {
    let select = document.getElementById('accommodationSelect').value;
    let customInput = document.getElementById('customAccommodationInput');
    let days = parseInt(document.getElementById('calcDays').value) || 0;
    let nights = Math.max(1, days - 1);
    
    if (select !== "pkg_included") {
        document.getElementById('packageSelect').value = "";
        document.getElementById('selectedPackageNotice').innerText = "";
    }

    if (select === "custom") {
        customInput.style.display = 'block';
        customInput.focus();
        let customRatePerNight = parseFloat(customInput.value) || 0;
        internalHotelCost = customRatePerNight * nights;
        document.getElementById('nightBreakdown').innerText = `ℹ️ (Custom: RM${customRatePerNight}/night x ${nights} night(s) = RM${internalHotelCost})`;
    } else {
        customInput.style.display = 'none';
        customInput.value = "";

        if (days <= 0) {
            document.getElementById('nightBreakdown').innerText = "";
            calculateCustomBudget();
            return;
        }

        if (select !== "" && select !== "pkg_included") {
            let ratePerNight = parseFloat(select) || 0;
            internalHotelCost = ratePerNight * nights;
            document.getElementById('nightBreakdown').innerText = `ℹ️ (${ratePerNight}/night x ${nights} night(s) = RM${internalHotelCost})`;
        } else if (select === "") {
            let pkgIndex = document.getElementById('packageSelect').value;
            if (pkgIndex === "") {
                internalHotelCost = 0;
                document.getElementById('nightBreakdown').innerText = "";
            }
        }
    }

    calculateCustomBudget();
}

/**
 * Validates and applies active promotional codes to offer percentage or fixed discounts.
 */
function applyPromoCode() {
    let code = document.getElementById('promoInput').value.trim();
    let msg = document.getElementById('promoMessage');
    
    appliedDiscountRate = 0;
    appliedDiscountFixed = 0;

    if (code.toUpperCase() === "CUTI10") {
        appliedDiscountRate = 0.10;
        msg.style.color = "var(--secondary)";
        msg.innerText = "🎉 Promo Code 'CUTI10' applied! (10% OFF)";
    } else if (code.toUpperCase() === "JOMJALAN50") {
        appliedDiscountFixed = 50;
        msg.style.color = "var(--secondary)";
        msg.innerText = "🎉 Promo Code 'JOMJALAN50' applied! (RM50 OFF)";
    } else if (code === "iLoveMY") {
        appliedDiscountRate = 0.20;
        msg.style.color = "var(--secondary)";
        msg.innerText = "🎉 Special Promo 'iLoveMY' applied! (20% OFF)";
    } else if (code.toUpperCase() === "KPMIM25") {
        appliedDiscountFixed = 25;
        msg.style.color = "var(--secondary)";
        msg.innerText = "🎉 Student Promo 'KPMIM25' applied! (RM25 OFF)";
    } else if (code.toUpperCase() === "WEEKEND15") {
        appliedDiscountRate = 0.15;
        msg.style.color = "var(--secondary)";
        msg.innerText = "🎉 Weekend Promo 'WEEKEND15' applied! (15% OFF)";
    } else if (code === "") {
        msg.innerText = "";
    } else {
        msg.style.color = "var(--danger)";
        msg.innerText = "❌ Invalid promo code. Please check and try again.";
    }
    calculateCustomBudget();
}

// =========================================================================
// SECTION 3: MEANINGFUL CALCULATION & CUSTOM BUDGET ESTIMATOR
// =========================================================================

/**
 * Computes total estimated travel budget dynamically based on user parameters, custom fields, and discounts.
 */
function calculateCustomBudget() {
    let customName = document.getElementById('customDestName').value.trim();
    let daysInput = document.getElementById('calcDays').value.trim();
    let foodInput = document.getElementById('calcFood').value.trim();
    let transportVal = document.getElementById('transportSelect').value;
    let accommodationVal = document.getElementById('accommodationSelect').value;
    let errorCalc = document.getElementById('errorCalc');
    
    errorCalc.innerText = "";

    if (!customName || !daysInput || !foodInput || !transportVal || !accommodationVal) {
        errorCalc.innerText = "Please complete all budget details to calculate!";
        document.getElementById('calcResultBox').style.display = 'none';
        return;
    }

    // Capture custom input values if custom option is selected
    if (transportVal === "custom") {
        let customTransVal = parseFloat(document.getElementById('customTransportInput').value) || 0;
        internalTransportCost = customTransVal;
    }

    if (accommodationVal === "custom") {
        let days = parseInt(daysInput) || 1;
        let nights = Math.max(1, days - 1);
        let customAccVal = parseFloat(document.getElementById('customAccommodationInput').value) || 0;
        internalHotelCost = customAccVal * nights;
    }

    let days = parseInt(daysInput);
    let food = parseFloat(foodInput);

    if (isNaN(days) || isNaN(food) || food < 0 || days <= 0) {
        errorCalc.innerText = "Error: Please enter valid positive numerical values.";
        document.getElementById('calcResultBox').style.display = 'none';
        return;
    }

    let subTotal = internalTransportCost + internalHotelCost + food;
    let finalCost = subTotal;
    let discountText = "";

    if (appliedDiscountRate > 0) {
        let discountAmount = subTotal * appliedDiscountRate;
        finalCost = subTotal - discountAmount;
        discountText = `(${Math.round(appliedDiscountRate * 100)}% Discount Applied!)`;
    } else if (appliedDiscountFixed > 0) {
        finalCost = Math.max(0, subTotal - appliedDiscountFixed);
        discountText = `(RM${appliedDiscountFixed} Discount Applied!)`;
    }

    let dailyCost = finalCost / days;

    latestCalculatedData = {
        destination: customName + " (" + days + " Days)",
        budget: finalCost.toFixed(2)
    };

    document.getElementById('resTotalCost').innerText = finalCost.toFixed(2);
    document.getElementById('discountTag').innerText = discountText;
    document.getElementById('resDailyCost').innerText = dailyCost.toFixed(2);
    document.getElementById('calcResultBox').style.display = 'block';
}

/**
 * Transfers calculated budget items directly into the persistent user dashboard via localStorage.
 */
function sendToTravelPlan() {
    if (!latestCalculatedData) return;

    let userChoice = confirm(`Add "${latestCalculatedData.destination}" with estimated budget of RM${latestCalculatedData.budget} to your dashboard?`);
    
    if (userChoice) {
        let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
        let currentDate = document.getElementById('travelDateSelect').value || new Date().toISOString().split('T')[0];

        plans.push({
            destination: latestCalculatedData.destination,
            date: currentDate,
            budget: latestCalculatedData.budget
        });

        localStorage.setItem('travelPlans', JSON.stringify(plans));
        loadPlans();
        switchTab('plans');
        alert("Success! Travel plan added directly to your dashboard.");

        resetBudgetForm();
    }
}

// =========================================================================
// SECTION 4: CRUD OPERATIONS, STATISTICS & LOCAL STORAGE PERSISTENCE
// =========================================================

/**
 * Loads and renders all saved travel plans from LocalStorage into the dashboard table.
 */
function loadPlans() {
    let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
    let tbody = document.getElementById('planTableBody');
    tbody.innerHTML = '';

    let totalBudget = 0;

    if (plans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No travel plans saved yet.</td></tr>`;
    } else {
        plans.forEach((plan, index) => {
            totalBudget += parseFloat(plan.budget) || 0;
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${plan.destination}</td>
                    <td>${plan.date}</td>
                    <td>RM ${plan.budget}</td>
                    <td>
                        <button class="btn btn-sm" onclick="editPlan(${index})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePlan(${index})">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('statTotalTrips').innerText = plans.length;
    document.getElementById('statTotalBudget').innerText = totalBudget.toFixed(2);
}

/**
 * Handles creation (INSERT) and modification (UPDATE) of manual travel plan entries.
 */
function savePlan() {
    let destination = document.getElementById('destInput').value.trim();
    let date = document.getElementById('dateInput').value;
    let budget = document.getElementById('budgetInput').value;
    let editIndex = document.getElementById('editIndex').value;
    let errorCRUD = document.getElementById('errorCRUD');

    errorCRUD.innerText = "";

    if (!destination || !date || !budget) {
        errorCRUD.innerText = "Error: Please complete all required form fields!";
        return;
    }

    let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');

    if (editIndex === "-1") {
        plans.push({ destination, date, budget });
    } else {
        plans[editIndex] = { destination, date, budget };
        document.getElementById('editIndex').value = "-1";
        document.getElementById('formTitle').innerText = "📝 Add / Edit Custom Travel Plan (Create / Update)";
    }

    localStorage.setItem('travelPlans', JSON.stringify(plans));

    document.getElementById('destInput').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('budgetInput').value = '';

    loadPlans();

    resetBudgetForm();
}

/**
 * Resets all input fields, hides custom inputs, and clears result panels in the budget builder.
 */
function resetBudgetForm() {
    document.getElementById('customDestName').value = "";
    document.getElementById('calcDays').value = "";
    document.getElementById('calcFood').value = "";
    document.getElementById('transportSelect').selectedIndex = 0;
    document.getElementById('accommodationSelect').selectedIndex = 0;
    
    // Clear and hide custom input fields
    let customTrans = document.getElementById('customTransportInput');
    let customAcc = document.getElementById('customAccommodationInput');
    if (customTrans) { customTrans.style.display = 'none'; customTrans.value = ""; }
    if (customAcc) { customAcc.style.display = 'none'; customAcc.value = ""; }

    let nightBreakdown = document.getElementById('nightBreakdown');
    if (nightBreakdown) nightBreakdown.innerText = "";

    appliedDiscountRate = 0;
    appliedDiscountFixed = 0;

    document.getElementById('promoInput').value = "";
    let promoMsg = document.getElementById('promoMessage');
    if (promoMsg) promoMsg.innerText = "";

    document.getElementById('errorCalc').innerText = "";
    document.getElementById('calcResultBox').style.display = 'none'; 
}

/**
 * Populates form inputs with existing data to allow editing of a specific travel plan.
 * @param {number} index - Index of the plan within the localStorage array.
 */
function editPlan(index) {
    let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
    let plan = plans[index];

    document.getElementById('destInput').value = plan.destination;
    document.getElementById('dateInput').value = plan.date;
    document.getElementById('budgetInput').value = plan.budget;
    document.getElementById('editIndex').value = index;
    document.getElementById('formTitle').innerText = "✏️ Edit Travel Plan (Editing Item #" + (index + 1) + ")";
}

/**
 * Deletes a selected travel plan entry from localStorage and refreshes the table.
 * @param {number} index - Index of the plan to delete.
 */
function deletePlan(index) {
    let plans = JSON.parse(localStorage.getItem('travelPlans') || '[]');
    plans.splice(index, 1);
    localStorage.setItem('travelPlans', JSON.stringify(plans));
    loadPlans();
}

/**
 * Clears all saved travel plans from localStorage after user confirmation.
 */
function clearAllPlans() {
    if (confirm("Are you sure you want to clear all saved travel plans?")) {
        localStorage.removeItem('travelPlans');
        loadPlans();
    }
}

// Automatically load saved plans when the window finishes initializing
window.onload = function() {
    loadPlans();
};