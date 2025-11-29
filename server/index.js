const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// อนุญาตให้ Frontend เข้าถึงได้ (สำคัญมาก)
app.use(cors());
app.use(express.json());

// ใช้ Port ของระบบ (Render) ถ้าไม่มีให้ใช้ 5000
const PORT = process.env.PORT || 5000;

app.get('/api/weather', async (req, res) => {
    try {
        let { lat, lon } = req.query;

        // Validation
        if (!lat || !lon) {
            return res.status(400).json({ error: "Lat/Lon required" });
        }

        // แปลง Lat/Lon เป็นตัวเลข
        let latNum = parseFloat(lat);
        let lonNum = parseFloat(lon);

        // 🟢 FIX 1: Normalize Longitude (แก้ปัญหาโลกหมุนเกิน 180 องศา)
        // สูตร: ทำให้ค่าวนกลับมาอยู่ในช่วง -180 ถึง 180 เสมอ
        lonNum = ((lonNum + 180) % 360 + 360) % 360 - 180;

        // เตรียม URL
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}`;

        // 🟢 FIX 2: แยก Try-Catch (Fail-Safe Logic)

        // ส่วนที่ 1: ดึงสภาพอากาศ (Critical - ห้ามพัง)
        let weatherData = null;
        try {
            const weatherRes = await axios.get(weatherUrl, {
                headers: {
                    'User-Agent': 'StudentProjectWeatherApp/1.0' // ชื่ออะไรก็ได้ให้ดูไม่ใช่อัตโนมัติ
                }
            });
            weatherData = weatherRes.data;
        } catch (err) {
            console.error("Weather API Error:", err.message);
            return res.status(500).json({ error: "Failed to fetch weather data" });
        }

        // ส่วนที่ 2: ดึงชื่อสถานที่ (Non-Critical - พังได้)
        let locationInfo = {
            location: "พิกัดแผนที่",
            full_address: `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`
        };

        try {
            const geoRes = await axios.get(geoUrl, {
                headers: {
                    // ใส่ User-Agent เพื่อลดโอกาสโดนแบน (429)
                    'User-Agent': 'StudentProjectWeatherApp/1.0',
                    'Accept-Language': 'th, en;q=0.9'
                },
                timeout: 3000 // รอแค่ 3 วิพอ ถ้าช้าคือตัดทิ้งเลย
            });

            const address = geoRes.data.address;
            const displayName = geoRes.data.display_name;

            if (address) {
                // 🟢 FIX 3: เพิ่ม Keys ให้ครอบคลุมทั่วโลก
                locationInfo.location =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    address.city_district ||
                    address.suburb ||

                    // Western Keys (US/EU)
                    address.hamlet ||
                    address.borough ||
                    address.neighbourhood ||
                    address.quarter ||

                    // Fallback
                    address.county ||
                    address.state ||
                    address.country ||
                    "พื้นที่ไม่มีชื่อ";

                locationInfo.full_address = displayName;
            }

        } catch (geoErr) {
            // ถ้า Error (429, Timeout) ให้ Log ไว้ แต่ไม่หยุดการทำงาน
            console.warn("⚠️ Geocoding Warning:", geoErr.message);
            console.warn("Using fallback location name.");
        }

        // ส่งข้อมูลกลับ (รวมร่าง)
        res.json({
            ...locationInfo,
            weather: weatherData
        });

    } catch (error) {
        console.error("Server Critical Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});