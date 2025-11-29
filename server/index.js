const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Endpoint หลัก: รับ Lat/Lon คืนค่า Weather + ชื่อเมือง
app.get('/api/weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Lat/Lon required" });
        }

        let latNum = parseFloat(lat);
        let lonNum = parseFloat(lon);

        lonNum = ((lonNum + 180) % 360 + 360) % 360 - 180;

        // 1. ดึงข้อมูลอากาศจาก Open-Meteo (Current + Daily Forecast)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        // 2. ดึงชื่อเมือง (Reverse Geocoding)
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}`;

        // const [weatherRes, geoRes] = await Promise.all([
        //     axios.get(weatherUrl),
        //     axios.get(geoUrl, { headers: { 'User-Agent': 'WeatherApp/1.0', 'Accept-Language': 'th, en;q=0.9' } }) // Nominatim ต้องการ User-Agent
        // ]);



        // const address = (geoRes.data && geoRes.data.address) ? geoRes.data.address : null;
        // const displayName = (geoRes.data && geoRes.data.display_name) ? geoRes.data.display_name : `พิกัด ${lat}, ${lon}`;


        // if (!address) {
        //      return res.json({
        //         location: "ไม่ทราบชื่อสถานที่",
        //         full_address: displayName,
        //         weather: weatherRes.data
        //     });
        // }
        // console.log("📍 Debug Address Keys:", Object.keys(address));
        // console.log("📍 Debug Address Values:", address);

        // const locationName =
        //     address.city ||
        //     address.town ||
        //     address.village ||
        //     address.municipality ||      // เทศบาล
        //     address.city_district ||     // เขต (กทม)
        //     address.hamlet ||          // 👈 เพิ่ม: หมู่บ้านเล็กๆ (เจอเยอะใน US/UK)
        //     address.borough ||         // 👈 เพิ่ม: เขต (เช่นใน New York)
        //     address.neighbourhood ||   // 👈 เพิ่ม: ย่านชุมชน
        //     address.quarter ||         // 👈 เพิ่ม: ย่าน
        //     address.aerodrome ||     // สนามบิน
        //     address.tourism ||       // สถานที่ท่องเที่ยว
        //     address.leisure ||       // สวนสาธารณะ/อุทยาน
        //     address.amenity ||       // สิ่งอำนวยความสะดวก
        //     address.building ||      // ตึก
        //     address.road ||          // ถนน
        //     address.suburb ||            // แขวง/ตำบล
        //     address.county ||            // อำเภอ
        //     address.state ||             // จังหวัด
        //     address.country ||           // ประเทศ
        //     "Unknown Location";

        // res.json({
        //     location: locationName,
        //     full_address: displayName,
        //     weather: weatherRes.data
        // });
        let weatherData = null;
        try {
            const weatherRes = await axios.get(weatherUrl);
            weatherData = weatherRes.data;
        } catch (err) {
            throw new Error("Weather API Failed"); // ถ้าอากาศพัง คือจบ
        }

        // 2. ดึงชื่อเมือง (ตัวนี้พังได้ ไม่ว่ากัน)
        let locationInfo = {
            location: "พิกัดแผนที่",
            full_address: `${latNum.toFixed(2)}, ${lonNum.toFixed(2)}`
        };

        try {
            // เพิ่ม User-Agent ให้เฉพาะเจาะจงขึ้น เพื่อลดโอกาสโดนแบน
            const geoRes = await axios.get(geoUrl, {
                headers: {
                    'User-Agent': 'StudentProjectWeatherApp/1.0 (contact@example.com)',
                    'Accept-Language': 'th, en;q=0.9'
                },
                timeout: 3000 // รอแค่ 3 วิพอ ถ้าช้าคือตัดทิ้ง
            });

            // Logic เดิมในการหาชื่อ
            const address = geoRes.data.address;
            const displayName = geoRes.data.display_name;

            if (address) {
                locationInfo.location =
                    address.city || address.town || address.village ||
                    address.municipality || address.county || address.state ||
                    address.country || "ไม่ทราบชื่อสถานที่";
                locationInfo.full_address = displayName;
            }

        } catch (geoErr) {
            console.log("⚠️ Geocoding failed (429 or Timeout), using default name.");
            // ไม่ต้องทำอะไร ปล่อยให้ใช้ค่า Default ด้านบน
        }

        // 3. ส่งข้อมูลกลับ (ได้ Weather ชัวร์ๆ + Location ถ้ามี)
        res.json({
            ...locationInfo, // แตก object ชื่อเมือง
            weather: weatherData
        });

    } catch (error) {
        console.error("Server Error:", error.message);
        // ส่ง response กลับไปแม้จะ error เพื่อให้ frontend ไม่ค้าง
        res.status(500).json({ error: "Failed to process data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});